import Debug from "debug";
import { isObject, omit, pickBy } from "lodash";
import {
  CurrentsRunParameters,
  StrippedCypressModuleAPIOptions,
  TestingType,
} from "../../types";
import { getCurrentsConfig } from "../config";
import { withError } from "../log";
import { sanitizeAndConvertNestedArgs } from "./parser";
import { program } from "./program";

const debug = Debug("currents:cli");

export function parseOptions(
  _program: typeof program = program,
  ...args: Parameters<typeof program.parse>
) {
  _program.parse(...args);
  debug("parsed CLI flags %o", _program.opts());

  const { e2e, component } = _program.opts();
  if (e2e && component) {
    _program.error("Cannot use both e2e and component options");
  }

  return getRunParameters(_program.opts());
}

/**
 *
 * @returns Cypress non-empty options without the ones that are not relevant for the runner
 */
export function getStrippedCypressOptions(
  params: CurrentsRunParameters
): StrippedCypressModuleAPIOptions {
  return pickBy(
    omit(params, [
      "batchSize",
      "projectId",
      "record",
      "key",
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
    ...omit(result, "testingType"),
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

      if (isObject(value)) {
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

/**
 * Transforms the CLI options into the format that the `run` API expects
 *
 * @param cliOptions
 * @returns Currents run parameters
 */
export async function getRunParameters(
  cliOptions: ReturnType<typeof program.opts>
): Promise<CurrentsRunParameters> {
  const { projectId, recordKey, e2e, component } = await getCurrentsConfig();
  const key = cliOptions.key ?? process.env.CURRENTS_RECORD_KEY ?? recordKey;

  if (!key) {
    return program.error(
      withError(
        "Missing 'key'. Please either pass it as a cli flag '-k, --key <record-key>', set it in currents.config.js, or set CURRENTS_RECORD_KEY environment variable."
      )
    );
  }

  const _projectId = process.env.CURRENTS_PROJECT_ID ?? projectId;

  if (!_projectId) {
    return program.error(
      withError(
        "Missing 'projectId'. Please either set it in currents.config.js, or as CURRENTS_PROJECT_ID environment variable."
      )
    );
  }

  const testingType = cliOptions.component
    ? "component"
    : ("e2e" as TestingType);
  const batchSize = testingType === "e2e" ? e2e.batchSize : component.batchSize;

  const result = {
    ...omit({ ...cliOptions }, "e2e", "component"),
    config: sanitizeAndConvertNestedArgs(cliOptions.config, "config"),
    env: sanitizeAndConvertNestedArgs(cliOptions.env, "env"),
    reporterOptions: sanitizeAndConvertNestedArgs(
      cliOptions.reporterOptions,
      "reporterOptions"
    ),
    testingType,
    key,
    projectId: _projectId,
    batchSize,
  };

  debug("parsed run params: %o", result);
  return result;
}
