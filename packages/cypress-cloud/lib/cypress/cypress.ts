import cypress from "cypress";
import {
  CurrentsRunParameters,
  CypressResult,
  ValidatedCurrentsParameters,
} from "cypress-cloud/types";
import Debug from "debug";
import _ from "lodash";
import { getCypressRunAPIParams } from "../config";
import { safe } from "../lang";
import { getWSSPort } from "../ws";

const debug = Debug("currents:cypress");
interface RunCypressSpecFile {
  spec: string;
}

export function runBareCypress(params: CurrentsRunParameters = {}) {
  // revert currents params to cypress params
  // exclude record mode params
  const p = {
    ...params,
    ciBuildId: undefined,
    tag: undefined,
    parallel: undefined,
    record: false,
    group: undefined,
    spec: _.flatten(params.spec).join(","),
  };
  debug("Running bare Cypress with params %o", p);
  return cypress.run(p);
}

/**
 * Run Cypress tests, we need to pass down the stripped options as if we've received them from the CLI
 */
export async function runSpecFile(
  { spec }: RunCypressSpecFile,
  cypressRunOptions: ValidatedCurrentsParameters
) {
  const runAPIOptions = getCypressRunAPIParams(cypressRunOptions);

  const options = {
    ...runAPIOptions,
    config: {
      ...runAPIOptions.config,
      trashAssetsBeforeRuns: false,
    },
    env: {
      ...runAPIOptions.env,
      currents_ws: getWSSPort(),
    },
    spec,
  };
  debug("running cypress with options %o", options);
  const result = await cypress.run(options);

  debug("cypress run result %o", result);
  return result;
}

export const runSpecFileSafe = (
  ...args: Parameters<typeof runSpecFile>
): Promise<CypressResult> =>
  safe(
    runSpecFile,
    (error) => {
      debug("cypress run exception %o", error);
      return {
        status: "failed" as const,
        failures: 1,
        message: `Cypress process crashed with an error:\n${
          (error as Error).message
        }\n${(error as Error).stack}}`,
      };
    },
    () => {}
  )(...args);
