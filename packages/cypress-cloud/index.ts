import("./lib/init");

import {
  cutInitialOutput,
  getCapturedOutput,
  resetCapture,
} from "./lib/capture";
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

import { bus } from "./bus";
import { createInstance, createRun } from "./lib/api/api";
import { CreateInstancePayload } from "./lib/api/types/instance";
import { guessBrowser } from "./lib/browser";
import { getCI } from "./lib/ciProvider";
import { runSpecFileSafe } from "./lib/cypress";
import { getGitInfo } from "./lib/git";
import { bold, divider, error, info, spacer, title, warn } from "./lib/log";
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

  const { key, projectId, group, parallel, ciBuildId, tag, testingType } =
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
    "Discovered %d spec files, connecting to cloud orchestration service...",
    specs.length
  );

  const osPlatformInfo = await getPlatformInfo();
  const platform = {
    ...osPlatformInfo,
    ...guessBrowser(params.browser ?? "electron", config.resolved?.browsers),
  };
  const ci = getCI(ciBuildId);
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
    tags: tag,
    testingType,
  });

  info(
    "Params:",
    `Tags: ${tag?.join(",") ?? false}, Group: ${group ?? false}, Parallel: ${
      parallel ?? false
    }`
  );
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

  const uploadTasks: Promise<any>[] = [];
  let hasMore = true;

  async function runSpecFile() {
    const currentSpecFile = await createInstance({
      runId,
      groupId,
      machineId,
      platform,
    });
    if (!currentSpecFile.spec) {
      hasMore = false;
      return;
    }

    divider();
    info(
      "Running: %s (%d/%d)",
      currentSpecFile.spec,
      currentSpecFile.claimedInstances,
      currentSpecFile.totalInstances
    );

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

    title("blue", "Reporting results and artifacts in background...");

    uploadTasks.push(
      processCypressResults(
        currentSpecFile.instanceId!,
        cypressResult,
        getCapturedOutput()
      ).catch(error)
    );

    resetCapture();
  }

  bus.on("after", () => console.log("🔥 AFTER"));
  bus.on("after", runSpecFile);
  await runSpecFile();
  while (hasMore) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // uploadTasks.push(runSpecFile());
  }
  // waitUntil(() => !hasMore, 0, 1000);

  await Promise.allSettled(uploadTasks);
  return summary;
}
