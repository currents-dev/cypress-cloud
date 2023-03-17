import Debug from "debug";
import { CurrentsRunParameters, ValidatedCurrentsConfig } from "../types";
import { getCurrentsConfig } from "./config";
import { error } from "./log";
const debug = Debug("currents:validateParams");

export function resolveCurrentsConfig(
  params: CurrentsRunParameters
): CurrentsRunParameters {
  const configFromFile = getCurrentsConfig();

  const cloudServiceUrl =
    process.env.CURRENTS_API_URL ??
    params.cloudServiceUrl ??
    configFromFile.cloudServiceUrl;

  const recordKey =
    process.env.CURRENTS_RECORD_KEY ??
    params.recordKey ??
    configFromFile.recordKey;

  const projectId =
    process.env.CURRENTS_PROJECT_ID ??
    params.projectId ??
    configFromFile.projectId;

  const testingType = params.testingType ?? "e2e";

  const batchSize =
    testingType === "e2e"
      ? configFromFile.e2e.batchSize
      : configFromFile.component.batchSize;
  // batchSize and cloudServiceUrl default are in getCurrentsConfig()
  return {
    ...params,
    cloudServiceUrl,
    recordKey,
    projectId,
    batchSize,
    testingType,
  };
}

export function getValidatedCurrentsConfig(
  params: CurrentsRunParameters
): ValidatedCurrentsConfig {
  if (!params.cloudServiceUrl) {
    throw new Error(
      `Cannot resolve cloud service URL. Please provide it in one of the following ways:
- set CURRENTS_API_URL environment variable
- set "cloudServiceUrl" property in "currents.config.js" file
- provide it as a "cloudServiceUrl" property for "run" API method`
    );
  }
  if (!params.projectId) {
    throw new Error(
      `Cannot resolve projectId. Please provide it in one of the following ways:
- set CURRENTS_PROJECT_ID environment variable
- set "projectId" property in "currents.config.js" file
- provide it as a "projectId" property for "run" API method`
    );
  }
  if (!params.recordKey) {
    throw new Error(
      `Cannot resolve record key. Please provide it in one of the following ways:
- set CURRENTS_RECORD_KEY environment variable
- pass it as a cli flag '-k, --key <record-key>'
- set "recordKey" property in "currents.config.js" file
- provide it as a "recordKey" property for "run" API method`
    );
  }
  const requiredParameters: Array<keyof CurrentsRunParameters> = [
    "testingType",
    "batchSize",
  ];
  requiredParameters.forEach((key) => {
    if (typeof params[key] === "undefined") {
      error(
        'Missing required parameter "%s". Please provide at least the following parameters: %s',
        key,
        requiredParameters.join(", ")
      );
      throw new Error("Missing required parameter");
    }
  });
  debug("Validated currents parameters: %o", params);
  return params as ValidatedCurrentsConfig;
}
