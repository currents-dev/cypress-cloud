import fs from "fs/promises";
import { join } from "path";

export const getCoverageFilePath = async (
  coverageFile = "./.nyc_output/out.json"
) => {
  const path = join(process.cwd(), coverageFile);

  try {
    await fs.access(path);
    return {
      path,
      error: false,
    };
  } catch (error) {
    return {
      path,
      error,
    };
  }
};
