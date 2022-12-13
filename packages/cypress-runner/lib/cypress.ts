// @ts-ignore
import cypress from "cypress";
import { getStrippedCypressOptions } from "./cli";

interface RunCypressSpecFile {
  spec: string;
}
/**
 * Run Cypress tests, we need to pass down the stripped * options as we've received them from the CLI
 */
export async function runSpecFile({ spec }: RunCypressSpecFile) {
  const result = await cypress.run({
    ...getStrippedCypressOptions(),
    spec,
  });

  return result;
}
