import {
  CurrentsRunParameters,
  ValidatedCurrentsParameters,
} from "../../types";
import { MergedConfig } from "../config/config";
import { warn } from "../log";
import { findSpecs } from "./specMatcher";

const getSpecPattern = (
  configPattern: MergedConfig["specPattern"],
  explicit?: CurrentsRunParameters["spec"]
) => explicit || configPattern;

export const getSpecFiles = async ({
  config,
  params,
}: {
  config: MergedConfig;
  params: ValidatedCurrentsParameters;
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
      projectRoot: config.projectRoot,
      specPattern,
      configSpecPattern: config.specPattern,
      excludeSpecPattern: [
        config.excludeSpecPattern,
        config.additionalIgnorePattern,
      ].flat(2),
      testingType: params.testingType,
    });
    return { specs: [], specPattern };
  }
  return { specs, specPattern };
};
