const assert = require("assert");
const { run } = require("@deploysentinel/cypress-parallel");

(async function runTests() {
  const projectId = process.env.CURRENTS_PROJECT_ID || "projectId";
  const recordKey = process.env.CURRENTS_RECORD_KEY || "someKey";

  const result = await run({
    ciBuildId: `run-api-smoke-${new Date().toISOString()}`,
    spec: ["cypress/e2e_smoke/**/*.spec.js"],
    projectId,
    recordKey,
  });

  assert(result?.totalPassed === 1);
  assert(result?.totalTests === 1);
  assert(result?.totalFailed === 0);
  assert(typeof result?.runUrl === "string");
})();
