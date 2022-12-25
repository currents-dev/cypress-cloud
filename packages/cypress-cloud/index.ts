import("./lib/init");

import { cutInitialOutput, resetCapture } from "./lib/capture";
import { getConfig } from "./lib/config";
import { setRunId } from "./lib/httpClient";
import {
  getFailedDummyResult,
  isSuccessResult,
  processCypressResults,
  summarizeTestResults,
} from "./lib/results";
import { findSpecs } from "./lib/specMatcher";
import { CurrentsRunParameters, SummaryResults } from "./types";

import { createInstance, createRun } from "./lib/api/api";
import { CreateInstancePayload } from "./lib/api/types/instance";
import { guessBrowser } from "./lib/browser";
import { getCI } from "./lib/ciProvider";
import { runSpecFileSafe } from "./lib/cypress";
import { getGitInfo } from "./lib/git";
import { divider, info, spacer, title, warn } from "./lib/log";
import { getPlatformInfo } from "./lib/platform";
import { summaryTable } from "./lib/table";

/**
 * Run the Cypress tests and return the results.
 *
 * @augments RunOptions
 * @returns {TestsResult | undefined} The test results, or undefined if no tests were run.
 */
export async function run(params: CurrentsRunParameters) {
  spacer();

  const { key, projectId, group, parallel, ciBuildId, tags, testingType } =
    params;

  const config = await getConfig(params);
  const specPattern = params.spec || config.specPattern;
  const specs = await findSpecs({
    projectRoot: config.projectRoot,
    testingType,
    specPattern,
    configSpecPattern: config.specPattern,
    excludeSpecPattern: config.excludeSpecPattern,
    additionalIgnorePattern: config.additionalIgnorePattern,
  });

  if (specs.length === 0) {
    warn("No spec files found to execute. Configuration: %O", {
      specPattern,
      configSpecPattern: config.specPattern,
      excludeSpecPattern: [
        config.excludeSpecPattern,
        config.additionalIgnorePattern,
      ].flat(2),
      testingType,
    });
    return;
  }

  info(
    "Discovered %d spec files, connecting to the cloud orchestration service...",
    specs.length
  );

  const osPlatformInfo = await getPlatformInfo();
  const platform = {
    ...osPlatformInfo,
    ...guessBrowser(params.browser ?? "electron", config.resolved.browsers),
  };
  const ci = getCI();
  const commit = await getGitInfo(config.projectRoot);

  const run = await createRun({
    ci,
    specs: specs.map((spec) => spec.relative),
    commit,
    group,
    platform,
    parallel: parallel ?? false,
    ciBuildId,
    projectId,
    recordKey: key,
    specPattern: [specPattern].flat(2),
    tags,
    testingType,
  });

  info("Run URL:", run.runUrl);
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

  info("Recorded Run:", run.runUrl);
  spacer();

  return testResults;
}

async function runTillDone(
  {
    runId,
    groupId,
    machineId,
    platform,
    config,
  }: CreateInstancePayload & {
    config: Awaited<ReturnType<typeof getConfig>>;
  },
  cypressRunOptions: CurrentsRunParameters
) {
  const summary: SummaryResults = {};

  let hasMore = true;
  while (hasMore) {
    const currentSpecFile = await createInstance({
      runId,
      groupId,
      machineId,
      platform,
    });
    if (!currentSpecFile.spec) {
      hasMore = false;
      break;
    }

    divider();
    info(
      "Run progress: %d/%d",
      currentSpecFile.claimedInstances,
      currentSpecFile.totalInstances
    );
    info("Executing spec file: %s", currentSpecFile.spec);

    let cypressResult = await runSpecFileSafe(
      { spec: currentSpecFile.spec },
      cypressRunOptions
    );

    if (!isSuccessResult(cypressResult)) {
      cypressResult = getFailedDummyResult({
        spec: currentSpecFile.spec,
        error: cypressResult.message,
        config,
      });
      warn(
        "Executing the spec file has failed, executing the next spec file..."
      );
    }

    summary[currentSpecFile.spec] = cypressResult;
    await processCypressResults(currentSpecFile.instanceId!, cypressResult);
    resetCapture();
  }

  return summary;
}
