import "source-map-support/register";

import { run as internalRun } from "./lib/run";
import { CurrentsRunAPI } from "./types";

/**
 * Run Cypress tests with a cloud service of your choice and return the results
 *
 * @augments CurrentsRunAPI
 * @returns {CypressCommandLine.CypressRunResult} The test results, or undefined if no tests were run
 */
export function run(params: CurrentsRunAPI) {
  return internalRun(params);
}
