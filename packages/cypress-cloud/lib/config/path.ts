import isAbsolute from "is-absolute";
import _ from "lodash";
import path from "path";

export const defaultFilenames = [
  "currents.config.js",
  "currents.config.cjs",
  "currents.config.mjs",
];
export function getConfigFilePath(
  projectRoot: string | null = null,
  explicitConfigFilePath?: string
): string[] {
  const prefix = projectRoot ?? process.cwd();
  if (
    _.isString(explicitConfigFilePath) &&
    isAbsolute(explicitConfigFilePath)
  ) {
    return [explicitConfigFilePath];
  }
  if (_.isString(explicitConfigFilePath)) {
    return [normalizePath(prefix, explicitConfigFilePath)];
  }

  return defaultFilenames.map((p) => normalizePath(prefix, p));
}

export function normalizePath(prefix: string, filename: string): string {
  return `file://${path.resolve(prefix, filename)}`;
}
