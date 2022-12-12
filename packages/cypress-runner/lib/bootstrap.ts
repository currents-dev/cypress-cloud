import cp from "child_process";
import { getBinPath } from "cy2";
import fs from "fs";
import { nanoid } from "nanoid";
import { createTempFile } from "./fs";

export const bootCypress = async (port: number) => {
  const tempFilePath = await createTempFile();

  // TODO: provide the same flags as for the command
  const cypressBin = await getBinPath(require.resolve("cypress"));
  cp.spawnSync(
    cypressBin,
    [
      "run",
      "--spec",
      nanoid(),
      "--env",
      `currents_port=${port},currents_temp_file=${tempFilePath}`,
    ],
    {
      stdio: "pipe",
    }
  );

  if (!fs.existsSync(tempFilePath)) {
    throw new Error("Cannot detect cypress config file");
  }
  return JSON.parse(fs.readFileSync(tempFilePath, "utf-8"));
};
