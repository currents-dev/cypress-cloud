import cp from "child_process";
import { getBinPath } from "cy2";
import fs from "fs";
import { nanoid } from "nanoid";
import { getStrippedCypressOptions, serializeOptions } from "./cli/cli";
import { createTempFile } from "./fs";

export const bootCypress = async (port: number) => {
  const tempFilePath = await createTempFile();

  const serializedOptions = serializeOptions(
    getStrippedCypressOptions()
  ).flatMap((arg) => arg.split(" "));

  console.log("booting cypress with extra options", serializedOptions);
  // prepare cypress arg for dummy launch
  // it is important to pass the same args in order to get the same config
  // as for the actual run
  const args: string[] = [
    "run",
    "--spec",
    nanoid(),
    "--env",
    `currents_port=${port},currents_temp_file=${tempFilePath}`,
    ...serializedOptions,
  ];

  // TODO: capture the output and log it in case of error
  const cypressBin = await getBinPath(require.resolve("cypress"));
  const child = cp.spawnSync(cypressBin, args, {
    stdio: "pipe",
  });

  if (!fs.existsSync(tempFilePath)) {
    throw new Error("Cannot detect cypress config file");
  }
  try {
    return JSON.parse(fs.readFileSync(tempFilePath, "utf-8"));
  } catch (error) {
    console.error(
      "Unable to get cypress configuration. Running Cypress failed with the following output:"
    );
    console.dir({
      stdout: child.stdout.toString("utf-8"),
      stderr: child.stderr.toString(),
    });
    process.exit(1);
  }
};
