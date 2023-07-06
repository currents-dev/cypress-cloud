import assert from "assert";
import { run } from "cypress-cloud";

(async function runTests() {
  const projectId = process.env.CURRENTS_PROJECT_ID || "projectId";
  const recordKey = process.env.CURRENTS_RECORD_KEY || "someKey";

  const ciBuildId = `run-api-smoke-${new Date().toISOString()}`;
  const resultA = await run({
    ciBuildId,
    spec: ["cypress/e2e_smoke/**/*.spec.js"],
    projectId,
    recordKey,
    group: "groupA",
  });

  const resultB = await run({
    ciBuildId: ciBuildId + "b",
    spec: ["cypress/e2e_smoke/**/*.spec.js"],
    projectId,
    recordKey,
    group: "groupB",
    env: {
      CURRENTS_TESTING_FAIL: "yes",
    },
  });

  if (resultA?.status === "failed") {
    process.exit(1);
  }
  assert(resultA?.runUrl?.match(/(\S+)/));
  assert(resultA?.totalPassed === 1);
  assert(resultA?.totalTests === 1);

  if (resultB?.status === "failed") {
    process.exit(1);
  }
  assert(resultB?.totalPassed === 0);
  assert(resultB?.totalFailed === 1);
  assert(resultB?.totalTests === 1);
})();
