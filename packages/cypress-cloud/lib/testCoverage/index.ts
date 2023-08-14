import { join } from "path";
import fs from "fs/promises";
import { warn } from "../log";

export const getCoverageFilePath = async (
  coverageFile = "./.nyc_output/out.json"
) => {
  const path = join(process.cwd(), coverageFile);

  try {
    await fs.access(path);
    return path;
  } catch (error) {
    warn(
      'Coverage file was not found at "%s". Coverage recording will be skipped.',
      path
    );
    return null;
  }
};
