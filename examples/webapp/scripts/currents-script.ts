import assert from "assert";
import { run } from "cypress-cloud";

(async function runTests() {
  const projectId = process.env.CURRENTS_PROJECT_ID || "";
  const key = process.env.CURRENTS_RECORD_KEY || "";

  const summarizedResults = await run({
    projectId,
    key,
    spec: ["cypress/e2e_smoke/*.spec.js"],
    testingType: "e2e",
    record: true,
    ciBuildId: `run-api-smoke-${new Date().toISOString()}`,
    tag: ["run-api-smoke"],
    batchSize: 1,
  });

  assert(summarizedResults?.passes === 1);
  assert(summarizedResults?.tests === 1);
})();
