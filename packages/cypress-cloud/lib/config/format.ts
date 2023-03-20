import {
  CurrentsRunParameters,
  StrippedCypressModuleAPIOptions,
} from "cypress-cloud/types";
import _ from "lodash";

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

/**
 * Converts Currents option to Cypress CLI options.
 * Cypress CLI options are different from Cypress module API options.
 *
 * @param params
 * @returns Cypress CLI options
 * @see https://docs.cypress.io/guides/guides/command-line#cypress-run
 * @see https://docs.cypress.io/api/module-api
 */
export function getCLICypressOptions(
  params: CurrentsRunParameters
): StrippedCypressModuleAPIOptions {
  const result = getStrippedCypressOptions(params);
  const testingType =
    result.testingType === "component"
      ? {
          component: true,
        }
      : {};
  return {
    ..._.omit(result, "testingType"),
    ...testingType,
  };
}

export function serializeOptions(options: Record<string, unknown>) {
  return Object.entries(options)
    .map(([key, value]) => {
      const _key = dashed(key);
      if (typeof value === "boolean") {
        return value === true ? `--${_key}` : "";
      }

      if (_.isObject(value)) {
        return `--${_key} ${serializeComplexParam(value)}`;
      }

      // @ts-ignore
      return `--${_key} ${value.toString()}`;
    })
    .filter(Boolean);
}

function serializeComplexParam(param: {}) {
  return JSON.stringify(param);
}

const dashed = (v: string) => v.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
