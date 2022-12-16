// @ts-ignore
import cypress from "cypress";
import Debug from "debug";
import { CypressResult } from "../types";
import { getCypressModuleAPIOptions, getStrippedCypressOptions } from "./cli";

const debug = Debug("currents:cypress");
interface RunCypressSpecFile {
  spec: string;
}
/**
 * Run Cypress tests, we need to pass down the stripped options as if we've received them from the CLI
 */
export async function runSpecFile({ spec }: RunCypressSpecFile) {
  const runAPIOptions = getCypressModuleAPIOptions(getStrippedCypressOptions());

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

export const runSpecFileSafe = async ({
  spec,
}: RunCypressSpecFile): Promise<CypressResult> => {
  try {
    return await runSpecFile({ spec });
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
