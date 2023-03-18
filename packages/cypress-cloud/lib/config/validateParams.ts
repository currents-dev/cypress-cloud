import {
  CurrentsRunParameters,
  ValidatedCurrentsConfig,
} from "cypress-cloud/types";
import Debug from "debug";
import { error } from "../log";
import { getCurrentsConfig } from "./config";
const debug = Debug("currents:validateParams");

function resolveCurrentsParams(
  params: CurrentsRunParameters
): CurrentsRunParameters {
  const configFromFile = getCurrentsConfig();

  const cloudServiceUrl =
    params.cloudServiceUrl ??
    process.env.CURRENTS_API_URL ??
    configFromFile.cloudServiceUrl;

  const recordKey =
    params.recordKey ??
    process.env.CURRENTS_RECORD_KEY ??
    configFromFile.recordKey;

  const projectId =
    params.projectId ??
    process.env.CURRENTS_PROJECT_ID ??
    configFromFile.projectId;

  const testingType = params.testingType ?? "e2e";

  const batchSize =
    testingType === "e2e"
      ? configFromFile.e2e.batchSize
      : configFromFile.component.batchSize;

  // batchSize and cloudServiceUrl defaults are in getCurrentsConfig()
  return {
    ...params,
    cloudServiceUrl,
    recordKey,
    projectId,
    batchSize,
    testingType,
  };
}

export function validateParams(
  _params: CurrentsRunParameters
): ValidatedCurrentsConfig {
  const params = resolveCurrentsParams(_params);
  if (!params.cloudServiceUrl) {
    throw new Error(
      `Cannot resolve cloud service URL. Please use one of the following:
- set CURRENTS_API_URL environment variable
- set "cloudServiceUrl" in "currents.config.js" file
- provide it as a "cloudServiceUrl" property for "run" API method`
    );
  }
  if (!params.projectId) {
    throw new Error(
      `Cannot resolve projectId. Please use one of the following:
- set CURRENTS_PROJECT_ID environment variable
- set "projectId" in "currents.config.js" file
- provide it as a "projectId" property for "run" API method`
    );
  }
  if (!params.recordKey) {
    throw new Error(
      `Cannot resolve record key. Please use one of the following:
- set CURRENTS_RECORD_KEY environment variable
- pass it as a cli flag '-k, --key <record-key>'
- set "recordKey" in "currents.config.js" file
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
