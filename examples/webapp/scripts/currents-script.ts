import assert from "assert";
import { run } from "cypress-cloud";

(async function runTests() {
  const projectId = process.env.CURRENTS_PROJECT_ID || "";
  const key = process.env.CURRENTS_RECORD_KEY || "";

  const summarizedResults = await run({
    ciBuildId: `run-api-smoke-${new Date().toISOString()}`,
    spec: ["cypress/e2e_smoke/*.spec.js"],
    projectId,
    key,
  });

  assert(summarizedResults?.passes === 1);
  assert(summarizedResults?.tests === 1);
})();
