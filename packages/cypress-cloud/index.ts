/// <reference types="cypress" />
import "source-map-support/register.js";

import { run as internalRun } from "./lib/run";
export type { CurrentsConfig } from "./lib/config/config";
import { CurrentsRunAPI } from "./types";
export type { CurrentsRunAPI } from "./types";
/**
 * Run Cypress tests with a cloud service of your choice and return the results
 *
 * @augments CurrentsRunAPI
 * @returns {CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult | undefined} The test results, or undefined if no tests were run
 */
export function run(params?: CurrentsRunAPI) {
  return internalRun(params);
}
