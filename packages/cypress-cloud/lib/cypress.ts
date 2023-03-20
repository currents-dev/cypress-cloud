import cypress from "cypress";
import Debug from "debug";
import { CurrentsRunParameters, CypressResult } from "../types";
import { getStrippedCypressOptions } from "./config";
import { getWSSPort } from "./ws";

const debug = Debug("currents:cypress");
interface RunCypressSpecFile {
  spec: string;
}
/**
 * Run Cypress tests, we need to pass down the stripped options as if we've received them from the CLI
 */
export async function runSpecFile(
  { spec }: RunCypressSpecFile,
  cypressRunOptions: CurrentsRunParameters
) {
  const runAPIOptions = getStrippedCypressOptions(cypressRunOptions);

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

export const runSpecFileSafe = async (
  { spec }: RunCypressSpecFile,
  cypressRunOptions: CurrentsRunParameters
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
