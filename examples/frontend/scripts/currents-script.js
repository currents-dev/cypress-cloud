const assert = require("assert");
const { run } = require("cypress-cloud");

(async function runTests() {
  const projectId = process.env.CURRENTS_PROJECT_ID || "xrH0QX";
  const recordKey = process.env.CURRENTS_RECORD_KEY || "KwS93fNP1XQJNU4R";

  const result = await run({
    ciBuildId: `run-${new Date().toISOString()}`,
    spec: ["cypress/e2e/*.cy.js"],
    projectId,
    recordKey,
  });

  assert(result?.totalPassed === 1);
  assert(result?.totalTests === 1);
  assert(result?.totalFailed === 0);
  assert(typeof result?.runUrl === "string");
})();
