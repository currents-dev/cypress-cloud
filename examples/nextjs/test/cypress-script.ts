import { run } from "cypress-runner";

(async function runTests() {
  const projectId = "your-project-id";
  const key = "your-project-id";
  const specPattern = "cypress/e2e/1000.spec.js";
  const summarizedResults = await run({ projectId, key, specPattern });
  console.log("summarizedResults");
  console.log(summarizedResults);
})();
