import {
  CurrentsRunParameters,
  StrippedCypressModuleAPIOptions,
} from "cypress-cloud/types";
import Debug from "debug";
import _ from "lodash";
import { customAlphabet } from "nanoid";
const debug = Debug("currents:boot");

import { getStrippedCypressOptions } from "../config";
const getDummySpec = customAlphabet("abcdefghijklmnopqrstuvwxyz", 10);

export function getBootstrapArgs({
  params,
  port,
  tempFilePath,
}: {
  params: CurrentsRunParameters;
  port: number;
  tempFilePath: string;
}) {
  return _.chain(getCypressCLIParams(params))
    .thru((opts) => ({
      ...opts,
      // merge the env with the currents specific env variables
      env: {
        ...(opts.env ?? {}),
        currents_temp_file: tempFilePath,
        currents_port: port,
        currents_debug_enabled: process.env.DEBUG?.includes("currents:")
          ? true
          : false,
      },
    }))
    .tap((opts) => {
      debug("cypress bootstrap params: %o", opts);
    })
    .thru(serializeOptions)
    .tap((opts) => {
      debug("cypress bootstrap serialized params: %o", opts);
    })
    .filter(Boolean)
    .thru((args) => {
      return [
        ...args,
        "--spec",
        getDummySpec(),
        params.testingType === "component" ? "--component" : "--e2e",
      ];
    })
    .value();
}

/**
 * Converts Currents options to Cypress CLI params.
 * Cypress CLI options are different from Cypress module API options.
 *
 * @param params Currents param
 * @returns Cypress CLI params
 * @see https://docs.cypress.io/guides/guides/command-line#cypress-run
 * @see https://docs.cypress.io/api/module-api
 */
function getCypressCLIParams(
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

function serializeOptions(options: Record<string, unknown>): string[] {
  return Object.entries(options)
    .flatMap(([key, value]) => {
      const _key = dashed(key);
      if (typeof value === "boolean") {
        return value === true ? [`--${_key}`] : [];
      }

      if (_.isObject(value)) {
        return [`--${_key}`, serializeComplexParam(value)];
      }

      // @ts-ignore
      return [`--${_key}`, value.toString()];
    })
    .filter(Boolean);
}

function serializeComplexParam(param: {}) {
  return JSON.stringify(param);
}

const dashed = (v: string) => v.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
