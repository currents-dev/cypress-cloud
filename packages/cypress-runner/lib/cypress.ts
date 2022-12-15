// @ts-ignore
import cypress from "cypress";
import Debug from "debug";
import { getCypressModuleAPIOptions, getStrippedCypressOptions } from "./cli/";

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
