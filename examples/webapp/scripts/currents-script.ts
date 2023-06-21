import assert from "assert";
import { run } from "@deploysentinel/cypress-parallel";

(async function runTests() {
  const projectId = process.env.CURRENTS_PROJECT_ID || "projectId";
  const recordKey = process.env.CURRENTS_RECORD_KEY || "someKey";

  const result = await run({
    ciBuildId: `run-api-smoke-${new Date().toISOString()}`,
    spec: ["cypress/e2e_smoke/**/*.spec.js"],
    projectId,
    recordKey,
  });

  if (result?.status === "failed") {
    process.exit(1);
  }
  assert(result?.runUrl?.match(/(\S+)/));
  assert(result?.totalPassed === 1);
  assert(result?.totalTests === 1);
})();
