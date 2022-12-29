const { loadEnvConfig } = require("@next/env");
import { run } from "cypress-cloud";

function loadEnvVariables() {
  const projectDir = process.cwd();
  loadEnvConfig(projectDir);
}

loadEnvVariables();

(async function runTests() {
  const projectId = process.env.CURRENTS_PROJECT_ID || "";
  const key = process.env.CURRENTS_RECORD_KEY || "";

  const spec = ["cypress/e2e/1000.spec.js"];
  const testingType = "e2e";
  const record = true;

  const summarizedResults = await run({
    projectId,
    key,
    spec,
    testingType,
    record,
  });

  console.log("summarizedResults");
  console.log(summarizedResults);
})();
