// @ts-ignore
import cypress from "cypress";
import Debug from "debug";
import { CurrentsRunParameters, CypressResult } from "../types";
import { getStrippedCypressOptions } from "./cli";

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

  debug("running cypress with options", {
    runAPIOptions,
    spec,
  });
  const result = await cypress.run({
    ...runAPIOptions,
    spec,
  });

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
