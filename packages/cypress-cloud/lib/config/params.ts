import {
  CurrentsRunParameters,
  StrippedCypressModuleAPIOptions,
  ValidatedCurrentsParameters,
} from "cypress-cloud/types";
import Debug from "debug";
import _ from "lodash";
import { ValidationError } from "../errors";
import { error } from "../log";
import { getCurrentsConfig } from "./config";
const debug = Debug("currents:validateParams");

export function fallback(...args: string[]) {
  return args.find((arg) => arg !== undefined && arg !== null && arg !== "");
}

export function resolveCurrentsParams(
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

export const projectIdError = `Cannot resolve projectId. Please use one of the following:
- set CURRENTS_PROJECT_ID environment variable
- set "projectId" in "currents.config.js" file
- provide it as a "projectId" property for "run" API method`;

export const cloudServiceUrlError = `Cannot resolve cloud service URL. Please use one of the following:
- set CURRENTS_API_URL environment variable
- set "cloudServiceUrl" in "currents.config.js" file
- provide it as a "cloudServiceUrl" property for "run" API method`;

export const cloudServiceInvalidUrlError = `Invalid cloud service URL provided`;

export const recordKeyError = `Cannot resolve record key. Please use one of the following:
- set CURRENTS_RECORD_KEY environment variable
- pass it as a cli flag '-k, --key <record-key>'
- set "recordKey" in "currents.config.js" file
- provide it as a "recordKey" property for "run" API method`;

export function validateParams(
  _params: CurrentsRunParameters
): ValidatedCurrentsParameters {
  const params = resolveCurrentsParams(_params);
  if (!params.cloudServiceUrl) {
    throw new ValidationError(cloudServiceUrlError);
  }
  if (!params.projectId) {
    throw new ValidationError(projectIdError);
  }
  if (!params.recordKey) {
    throw new ValidationError(recordKeyError);
  }

  // validate cloudServiceUrl
  try {
    new URL(params.cloudServiceUrl);
  } catch (err) {
    throw new ValidationError(
      `${cloudServiceInvalidUrlError}: "${params.cloudServiceUrl}"`
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
  debug("validated currents parametes: %o", params);
  return params as ValidatedCurrentsParameters;
}

/**
 *
 * @returns Cypress non-empty options without the ones that are not relevant for the runner
 */
export function getStrippedCypressOptions(
  params: CurrentsRunParameters
): StrippedCypressModuleAPIOptions {
  return _.pickBy(
    _.omit(params, [
      "cloudServiceUrl",
      "batchSize",
      "projectId",
      "record",
      "key",
      "recordKey",
      "group",
      "parallel",
      "tag",
      "ciBuildId",
      "spec",
      "exit",
      "headed",
      "headless",
    ]),
    Boolean
  );
}
