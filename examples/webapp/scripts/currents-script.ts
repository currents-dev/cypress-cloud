import { run } from "@currents/cypress";

(async function runTests() {
  const projectId = process.env.CURRENTS_PROJECT_ID || "";
  const key = process.env.CURRENTS_RECORD_KEY || "";

  const spec = ["cypress/e2e/*.spec.js"];
  const testingType = "e2e";
  const record = true;

  const summarizedResults = await run({
    projectId,
    key,
    spec,
    testingType,
    record,
    ciBuildId: new Date().toISOString(),
    batchSize: 3,
  });

  console.log("summarizedResults");
  console.log(summarizedResults);
})();
