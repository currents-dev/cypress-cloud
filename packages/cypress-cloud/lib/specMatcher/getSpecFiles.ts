import { CurrentsRunParameters } from "../../types";
import { ResolvedConfig } from "../config";
import { warn } from "../log";
import { findSpecs } from "./specMatcher";

export const getSpecPattern = (
  configPattern: ResolvedConfig["specPattern"],
  explicit?: string[]
) => explicit || configPattern;

export const getSpecFiles = async ({
  config,
  params,
}: {
  config: ResolvedConfig;
  params: CurrentsRunParameters;
}) => {
  const specPattern = getSpecPattern(config.specPattern, params.spec);
  // find the spec files according to the resolved configuration
  const specs = await findSpecs({
    projectRoot: config.projectRoot,
    testingType: params.testingType,
    specPattern,
    configSpecPattern: config.specPattern,
    excludeSpecPattern: config.excludeSpecPattern,
    additionalIgnorePattern: config.additionalIgnorePattern,
  });
  if (specs.length === 0) {
    warn("No spec files found to execute. Configuration: %O", {
      specPattern,
      configSpecPattern: config.specPattern,
      excludeSpecPattern: [
        config.excludeSpecPattern,
        config.additionalIgnorePattern,
      ].flat(2),
      testingType: params.testingType,
    });
    return [];
  }
  return specs;
};
