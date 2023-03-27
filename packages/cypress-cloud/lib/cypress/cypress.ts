import cypress from "cypress";
import {
  CurrentsRunParameters,
  CypressResult,
  ValidatedCurrentsParameters,
} from "cypress-cloud/types";
import Debug from "debug";
import _ from "lodash";
import { getCypressRunAPIParams } from "../config";

const debug = Debug("currents:cypress");
interface RunCypressSpecFile {
  spec: string;
}

export function runBareCypress(params: CurrentsRunParameters = {}) {
  // revert currents params to cypress params
  // exclude record mode params
  return cypress.run(
    _.chain(params)
      .thru((params) => ({
        ...params,
        ciBuildId: undefined,
        tag: undefined,
        parallel: undefined,
        record: false,
        group: undefined,
        spec: _.flatten(params.spec).join(","),
      }))
      .tap((params) => debug("Running bare Cypress with params %o", params))
      .value()
  );
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
      currents_ws: true,
    },
    spec,
  };
  debug("running cypress with options %o", options);
  const result = await cypress.run(options);

  debug("cypress run result %o", result);
  return result;
}

export const runSpecFileSafe = async (
  { spec }: RunCypressSpecFile,
  cypressRunOptions: ValidatedCurrentsParameters
): Promise<CypressResult> => {
  try {
    return await runSpecFile({ spec }, cypressRunOptions);
  } catch (error) {
    debug("cypress run exception %o", error);
    return {
      status: "failed",
      failures: 1,
      message: `Cypress process crashed with an error:\n${
        (error as Error).message
      }\n${(error as Error).stack}}`,
    };
  }
};
