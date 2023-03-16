import("./lib/init");

import { cutInitialOutput } from "./lib/capture";
import { getConfig } from "./lib/config";
import { setRunId } from "./lib/httpClient";
import { summarizeTestResults } from "./lib/results";
import { getSpecFiles, getSpecPattern } from "./lib/specMatcher";
import { CurrentsRunParameters } from "./types";

import Debug from "debug";
import { createRun } from "./lib/api/api";
import { guessBrowser } from "./lib/browser";
import { getCI } from "./lib/ciProvider";
import { getGitInfo } from "./lib/git";
import { bold, divider, info, spacer, title } from "./lib/log";
import { getPlatformInfo } from "./lib/platform";
import { runTillDone } from "./lib/runner";
import { summaryTable } from "./lib/table";
import { validateRequiredParams } from "./lib/validateParams";

const debug = Debug("currents:index");

/**
 * Run the Cypress tests and return the results.
 *
 * @augments CurrentsRunParameters
 * @returns {TestsResult | undefined} The test results, or undefined if no tests were run.
 */
export async function run(params: CurrentsRunParameters) {
  spacer();

  const {
    key: recordKey,
    projectId,
    group,
    parallel,
    ciBuildId,
    tag,
    testingType = "e2e",
    batchSize = 1,
  } = params;

  debug("run api params %o", params);
  validateRequiredParams(params);

  // get the actual config parsed by Cypress
  const config = await getConfig(params);
  // explicitly provided pattern or the default from the config file
  const specPattern = getSpecPattern(config.specPattern, params.spec);
  // find the spec files according to the resolved configuration
  const specs = await getSpecFiles({ config, params });
  if (specs.length === 0) {
    return;
  }

  info("Discovered %d spec files", specs.length);

  const osPlatformInfo = await getPlatformInfo();
  const platform = {
    ...osPlatformInfo,
    ...guessBrowser(params.browser ?? "electron", config.resolved?.browsers),
  };
  const ci = getCI(ciBuildId);
  const commit = await getGitInfo(config.projectRoot);

  info(
    `Tags: ${tag?.join(",") ?? false}; Group: ${group ?? false}; Parallel: ${
      parallel ?? false
    }; Batch Size: ${batchSize}`
  );
  info("Connecting to cloud orchestration service...");

  const run = await createRun({
    ci,
    specs: specs.map((spec) => spec.relative),
    commit,
    group,
    platform,
    parallel: parallel ?? false,
    ciBuildId,
    projectId,
    recordKey,
    specPattern: [specPattern].flat(2),
    tags: tag,
    testingType,
    batchSize,
  });

  info("🎥 Run URL:", bold(run.runUrl));

  setRunId(run.runId);

  cutInitialOutput();

  const results = await runTillDone(
    {
      runId: run.runId,
      groupId: run.groupId,
      machineId: run.machineId,
      platform,
      config,
    },
    params
  );

  const testResults = summarizeTestResults(Object.values(results));

  divider();

  title("white", "Cloud Run Finished");
  console.log(summaryTable(results));
  info("🏁 Recorded Run:", bold(run.runUrl));

  spacer();
  return testResults;
}
