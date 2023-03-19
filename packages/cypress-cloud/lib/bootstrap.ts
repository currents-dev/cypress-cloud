import { getBinPath } from "cy2";
import Debug from "debug";
import execa, { ExecaError } from "execa";
import fs from "fs";
import _ from "lodash";
import { customAlphabet } from "nanoid";
import { CurrentsRunParameters } from "../types";
import { getCLICypressOptions, serializeOptions } from "./config";
import { ValidationError } from "./errors";
import { createTempFile } from "./fs";
import { bold, info } from "./log";

const debug = Debug("currents:boot");
const getDummySpec = customAlphabet("abcdefghijklmnopqrstuvwxyz", 10);

export const bootCypress = async (
  port: number,
  params: CurrentsRunParameters
) => {
  debug("booting cypress...");
  const tempFilePath = await createTempFile();
  const serializedOptions = _.chain(getCLICypressOptions(params))
    .thru((opts) => ({
      ...opts,
      // merge the env with the currents specific env variables
      env: {
        ...(opts.env ?? {}),
        currents_temp_file: tempFilePath,
        currents_port: port,
        currents_debug_enabled: process.env.DEBUG?.includes("currents:")
          ? "true"
          : "false",
      },
    }))
    .thru(serializeOptions)
    .flatMap((arg) => arg.split(" "))
    .filter(Boolean)
    .value();

  // it is important to pass the same args in order to get the same config as for the actual run
  const args: string[] = [
    "run",
    "--spec",
    getDummySpec(),
    ...serializedOptions,
    params.testingType === "component" ? "--component" : "--e2e",
  ];

  debug("booting cypress with args: %o", args);
  const cypressBin = await getBinPath(require.resolve("cypress"));
  debug("cypress executable location: %s", cypressBin);
  const { stdout, stderr } = await execCypress(cypressBin, args);
  if (!fs.existsSync(tempFilePath)) {
    throw new Error(
      `Cannot resolve cypress configuration from ${tempFilePath}. Please report the issue.`
    );
  }
  try {
    const f = fs.readFileSync(tempFilePath, "utf-8");
    if (!f) {
      throw new Error("Is cypress-cloud/plugin installed?");
    }
    debug("cypress config '%s': '%s'", tempFilePath, f);
    return JSON.parse(f);
  } catch (err) {
    debug("read config temp file failed: %o", err);
    info(bold("Cypress stdout:\n"), stdout);
    info(bold("Cypress stderr:\n"), stderr);

    throw new ValidationError(`Unable to resolve cypress configuration
- make sure that 'cypress-cloud/plugin' is installed
- report the issue together with cypress stdout and stderr
`);
  }
};

async function execCypress(cypressBin: string, args: readonly string[]) {
  let stdout = "";
  let stderr = "";
  try {
    await execa(cypressBin, args, {
      stdio: "pipe",
      env: {
        ...process.env,
        // prevent warnings about recording mode
        CYPRESS_RECORD_KEY: undefined,
      },
    });
  } catch (err) {
    debug("exec cypress failed (certain failures are expected): %o", err);
    stdout = (err as ExecaError).stdout;
    stderr = (err as ExecaError).stderr;
  }
  return { stdout, stderr };
}
