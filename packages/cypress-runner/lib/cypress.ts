// @ts-ignore
import cypress from "cypress";
import { getCypressModuleAPIOptions, getStrippedCypressOptions } from "./cli/";

interface RunCypressSpecFile {
  spec: string;
}
/**
 * Run Cypress tests, we need to pass down the stripped options as if we've received them from the CLI
 */
export async function runSpecFile({ spec }: RunCypressSpecFile) {
  const runAPIOptions = getCypressModuleAPIOptions(getStrippedCypressOptions());

  console.log("Running Cypress with options", runAPIOptions);
  const result = await cypress.run({
    ...runAPIOptions,
    spec,
  });

  return result;
}
