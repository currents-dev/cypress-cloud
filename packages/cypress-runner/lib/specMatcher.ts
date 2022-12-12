import Debug from "debug";
import path from "path";

import commonPathPrefix from "common-path-prefix";
import { globby, Options as GlobbyOptions } from "globby";
import _ from "lodash";
import os from "os";
import { FindSpecs, SpecWithRelativeRoot } from "../types";
import { toArray, toPosix } from "./utils";

const debug = Debug("currents:specMatcher");

/**
 * Replicate how cypress is discovering spec files
 * https://github.com/cypress-io/cypress/blob/bc9edb44523d62ca934827b8e870f38f86634ca4/packages/data-context/src/sources/ProjectDataSource.ts#L250
 * https://github.com/cypress-io/cypress/blob/bc9edb44523d62ca934827b8e870f38f86634ca4/packages/data-context/src/actions/ProjectActions.ts#L417
 */
// @ts-disable
async function findSpecs({
  projectRoot,
  testingType,
  specPattern,
  configSpecPattern,
  excludeSpecPattern,
  additionalIgnorePattern,
}: FindSpecs<string[]>): Promise<SpecWithRelativeRoot[]> {
  configSpecPattern = toArray(configSpecPattern);
  specPattern = toArray(specPattern);
  excludeSpecPattern = toArray(excludeSpecPattern) || [];

  // exclude all specs matching e2e if in component testing
  additionalIgnorePattern = toArray(additionalIgnorePattern) || [];

  if (!specPattern || !configSpecPattern) {
    throw Error("could not find pattern to load specs");
  }

  console.log({
    projectRoot,
    specPattern,
    configSpecPattern,
    excludeSpecPattern,
    additionalIgnorePattern,
  });

  let specAbsolutePaths = await getFilesByGlob(projectRoot, specPattern, {
    absolute: true,
    ignore: [...excludeSpecPattern, ...additionalIgnorePattern],
  });

  // If the specPattern and configSpecPattern are different,
  // it means the user passed something non-default via --spec (run mode only)
  // in this scenario, we want to grab everything that matches `--spec`
  // that falls within their default specPattern. The reason is so we avoid
  // attempting to run things that are not specs, eg source code, videos, etc.
  //
  // Example: developer wants to run tests associated with timers in packages/driver
  // So they run yarn cypress:run --spec **/timers*
  // we do **not** want to capture `timers.ts` (source code) or a video in
  // cypress/videos/timers.cy.ts.mp4, so we take the intersection between specPattern
  // and --spec.
  if (!_.isEqual(specPattern, configSpecPattern)) {
    const defaultSpecAbsolutePaths = await getFilesByGlob(
      projectRoot,
      configSpecPattern,
      {
        absolute: true,
        ignore: [...excludeSpecPattern, ...additionalIgnorePattern],
      }
    );

    specAbsolutePaths = _.intersection(
      specAbsolutePaths,
      defaultSpecAbsolutePaths
    );
    console.log({ specAbsolutePaths });
  }

  const matched = matchedSpecs({
    projectRoot,
    testingType,
    specAbsolutePaths,
    specPattern,
  });

  return matched;
}

async function getFilesByGlob(
  cwd: string,
  glob: string | string[],
  globOptions: GlobbyOptions
) {
  const globs = ([] as string[]).concat(glob).map((globPattern) => {
    const workingDirectoryPrefix = path.join(cwd, path.sep);

    // If the pattern includes the working directory, we strip it from the pattern.
    // The working directory path may include characters that conflict with glob
    // syntax (brackets, parentheses, etc.) and cause our searches to inadvertently fail.
    // We scope our search to the working directory using the `cwd` globby option.
    if (globPattern.startsWith(workingDirectoryPrefix)) {
      return globPattern.replace(workingDirectoryPrefix, "");
    }

    return globPattern;
  });

  const ignoreGlob = (globOptions?.ignore ?? []).concat("**/node_modules/**");

  if (os.platform() === "win32") {
    // globby can't work with backwards slashes
    // https://github.com/sindresorhus/globby/issues/179
    debug("updating glob patterns to POSIX");
    for (const i in globs) {
      const cur = globs[i];

      if (!cur) throw new Error("undefined glob received");

      globs[i] = toPosix(cur);
    }
  }

  try {
    debug("globbing pattern(s): %o", globs);
    debug("within directory: %s", cwd);

    const files = await matchGlobs(globs, {
      onlyFiles: true,
      absolute: true,
      cwd,
      ...globOptions,
      ignore: ignoreGlob,
    });

    return files;
  } catch (e) {
    debug("error in getFilesByGlob %o", e);

    return [];
  }
}

const matchGlobs = async (globs, globbyOptions: GlobbyOptions) => {
  return await globby(globs, globbyOptions);
};

function matchedSpecs({ projectRoot, testingType, specAbsolutePaths }) {
  debug("found specs %o", specAbsolutePaths);

  let commonRoot = "";

  if (specAbsolutePaths.length === 1) {
    commonRoot = path.dirname(specAbsolutePaths[0]);
  } else {
    commonRoot = commonPathPrefix(specAbsolutePaths);
  }

  const specs = specAbsolutePaths.map((absolute) => {
    return transformSpec({
      projectRoot,
      absolute,
      testingType,
      commonRoot,
      platform: os.platform(),
      sep: path.sep,
    });
  });

  return specs;
}

function transformSpec({
  projectRoot,
  absolute,
  testingType,
  commonRoot,
  platform,
  sep,
}) {
  if (platform === "win32") {
    absolute = toPosix(absolute, sep);
    projectRoot = toPosix(projectRoot, sep);
  }

  const relative = path.relative(projectRoot, absolute);
  const parsedFile = path.parse(absolute);
  const fileExtension = path.extname(absolute);

  const specFileExtension =
    [".spec", ".test", "-spec", "-test", ".cy"]
      .map((ext) => ext + fileExtension)
      .find((ext) => absolute.endsWith(ext)) || fileExtension;

  const parts = absolute.split(projectRoot);
  let name = parts[parts.length - 1] || "";

  if (name.startsWith("/")) {
    name = name.slice(1);
  }

  const LEADING_SLASH = /^\/|/g;
  const relativeToCommonRoot = absolute
    .replace(commonRoot, "")
    .replace(LEADING_SLASH, "");

  return {
    fileExtension,
    baseName: parsedFile.base,
    fileName: parsedFile.base.replace(specFileExtension, ""),
    specFileExtension,
    relativeToCommonRoot,
    specType: testingType === "component" ? "component" : "integration",
    name,
    relative,
    absolute,
  };
}

module.exports = {
  findSpecs,
};
