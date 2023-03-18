import assert from "assert";
import { run } from "cypress-cloud";

(async function runTests() {
  const projectId = process.env.CURRENTS_PROJECT_ID || "";
  const recordKey = process.env.CURRENTS_RECORD_KEY || "";

  const result = await run({
    ciBuildId: `run-api-smoke-${new Date().toISOString()}`,
    spec: ["cypress/e2e_smoke/**/*.spec.js"],
    projectId,
    recordKey,
  });

  assert(result?.totalPassed === 1);
  assert(result?.totalTests === 1);
})();
