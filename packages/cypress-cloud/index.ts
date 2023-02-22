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

import { createInstances, createRun } from "./lib/api/api";
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
    `Tags: ${tag?.join(",") ?? false}; Group: ${group ?? false}; Parallel: ${
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

  console.log(results);
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
    const instances = await createInstances({
      runId,
      groupId,
      machineId,
      platform,
    });

    if (instances.specs.length === 0) {
      hasMore = false;
      return;
    }

    divider();
    info(
      "Running: %s (%d/%d)",
      instances.specs.map((s) => s.spec).join(", "),
      instances.claimedInstances,
      instances.totalInstances
    );

    let cypressResult = await runSpecFileSafe(
      { spec: instances.specs.map((s) => s.spec).join(",") },
      cypressRunOptions
    );

    if (!isSuccessResult(cypressResult)) {
      // TODO: Handle partially failed results
      cypressResult = getFailedDummyResult({
        specs: instances.specs.map((s) => s.spec),
        error: cypressResult.message,
        config,
      });
      warn(
        "Executing the spec files has failed, running the next spec files..."
      );
    }

    console.dir(cypressResult);

    instances.specs.forEach((spec) => {
      summary[spec.spec] = {
        ...cypressResult,
        runs: cypressResult.runs.filter((r) => r.spec.relative === spec.spec),
      };
    });

    title("blue", "Reporting results and artifacts in background...");

    uploadTasks.concat(
      cypressResult.runs.flatMap(async (run) =>
        processCypressResults(
          instances.specs.find((s) => s.spec === run.spec.relative)!
            .instanceId!,
          {
            ...cypressResult,
            runs: cypressResult.runs.filter(
              (r) => r.spec.relative === run.spec.relative
            ),
          },
          getCapturedOutput()
        ).catch(error)
      )
    );

    resetCapture();
  }

  // bus.on("after", () => console.log("🔥 AFTER"));
  // bus.on("after", async () => await runSpecFile());

  while (hasMore) {
    await runSpecFile();
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    // uploadTasks.push(runSpecFile());
  }
  // waitUntil(() => !hasMore, 0, 1000);

  await Promise.allSettled(uploadTasks);
  return summary;
}
