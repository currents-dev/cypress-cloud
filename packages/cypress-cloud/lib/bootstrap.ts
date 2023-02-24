import cp from "child_process";
import { getBinPath } from "cy2";
import Debug from "debug";
import fs from "fs";
import { chain } from "lodash";
import { customAlphabet } from "nanoid";
import { VError } from "verror";
import { CurrentsRunParameters } from "../types";
import { getCLICypressOptions, serializeOptions } from "./cli/cli";
import { createTempFile } from "./fs";
import { error } from "./log";

const debug = Debug("currents:boot");
const getDummySpec = customAlphabet("abcdefghijklmnopqrstuvwxyz", 10);

export const bootCypress = async (
  port: number,
  params: CurrentsRunParameters
) => {
  debug("booting cypress...");
  const tempFilePath = await createTempFile();
  const serializedOptions = chain(getCLICypressOptions(params))
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

  const child = cp.spawnSync(cypressBin, args, {
    stdio: "pipe",
    env: {
      ...process.env,
      // prevent warnings about recording mode
      CYPRESS_RECORD_KEY: undefined,
    },
  });

  if (!fs.existsSync(tempFilePath)) {
    throw new VError(
      "Cannot resolve cypress configuration from '%s'. Please report the issue.",
      tempFilePath
    );
  }
  try {
    const f = fs.readFileSync(tempFilePath, "utf-8");

    if (!f) {
      throw new VError("Is cypress-cloud/plugin installed?");
    }
    debug("cypress config '%s': '%s'", tempFilePath, f);
    return JSON.parse(f);
  } catch (err) {
    debug("read config temp file failed: %o", err);
    error("Resolving cypress configuration failed:");
    console.dir({
      stdout: child.stdout.toString("utf-8").split("\n"),
      stderr: child.stderr.toString("utf-8").split("\n"),
    });
    throw new VError(err as Error, "Unable to resolve cypress configuration");
  }
};
