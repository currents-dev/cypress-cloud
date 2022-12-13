import cp from "child_process";
import { getBinPath } from "cy2";
import fs from "fs";
import { nanoid } from "nanoid";
import { getStrippedCypressOptions, serializeOptions } from "./cli";
import { createTempFile } from "./fs";

export const bootCypress = async (port: number) => {
  const tempFilePath = await createTempFile();

  // prepare cypress arg for dummy launch
  // it is important to pass the same args in order to get the same config
  // as for the actual run
  const args: string[] = [
    "run",
    "--spec",
    nanoid(),
    "--env",
    `currents_port=${port},currents_temp_file=${tempFilePath}`,
    ...serializeOptions(getStrippedCypressOptions(["spec"])).flatMap((arg) =>
      arg.split(" ")
    ),
  ];

  const cypressBin = await getBinPath(require.resolve("cypress"));
  const sdas = cp.spawnSync(cypressBin, args, {
    stdio: "pipe",
  });

  console.log(sdas.stdout.toString());
  if (!fs.existsSync(tempFilePath)) {
    throw new Error("Cannot detect cypress config file");
  }
  const config = JSON.parse(fs.readFileSync(tempFilePath, "utf-8"));
  return config;
};
