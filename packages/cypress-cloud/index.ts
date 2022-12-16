import("./lib/init");

import { cutInitialOutput, resetCapture } from "./lib/capture";
import { parseOptions } from "./lib/cli";
import { getCurrentsConfig, mergeConfig } from "./lib/config";
import { setRunId } from "./lib/httpClient";
import {
  getFailedDummyResult,
  isSuccessResult,
  processCypressResults,
  summarizeTestResults,
} from "./lib/results";
import { findSpecs } from "./lib/specMatcher";
import { SummaryResults, TestingType, TestsResult } from "./types";

import { createInstance, createRun } from "./lib/api/api";
import { CreateInstancePayload } from "./lib/api/types/instance";
import { guessBrowser } from "./lib/browser";
import { getCI } from "./lib/ciProvider";
import { runSpecFileSafe } from "./lib/cypress";
import { getGitInfo } from "./lib/git";
import { divider, info, spacer, title, warn } from "./lib/log";
import { getPlatformInfo } from "./lib/platform";
import { summaryTable } from "./lib/table";

interface RunOptions {
  /** The project ID to use. If not specified, will use the projectId from currents.config.js or process.env.CURRENTS_PROJECT_ID */
  projectId?: string;
  /**  The record key to use */
  key?: string;
  /** The spec pattern to use. If not specified, will use the specPattern from Cypress configuration */
  specPattern?: string;
}

/**
 * A microchart is a small chart that shows a single metric over time.
 * It is used in the instance summary and instance details.
 *
 * @augments RunOptions
 * @returns {TestsResult | undefined} The test results, or undefined if no tests were run.
 */
export async function run(parameters: RunOptions = {}) {
  spacer();
  const options = parseOptions();
  const { component, parallel, ciBuildId, group, tag: tags } = options;
  const key = parameters.key || options.key;
  if (!key) {
    throw new Error(
      "required option '-k, --key <record-key>' not specified. Please either pass it as a flag, or as a parameter to the run function."
    );
  }

  const testingType: TestingType = component ? "component" : "e2e";

  const { projectId, ...restOfCurrentsConfig } = await getCurrentsConfig();
  const currentsConfig = {
    ...restOfCurrentsConfig,
    projectId: parameters.projectId || projectId,
  };
  if (!currentsConfig.projectId) {
    throw new Error(
      "Missing projectId. Please either set it in currents.config.js, or pass it as a parameter to the run function."
    );
  }

  const config = await mergeConfig(testingType, currentsConfig);
  const specPattern =
    parameters.specPattern || options.spec || config.specPattern;
  const specs = await findSpecs({
    projectRoot: config.projectRoot,
    testingType,
    specPattern,
    configSpecPattern: config.specPattern,
    excludeSpecPattern: config.excludeSpecPattern,
    additionalIgnorePattern: config.additionalIgnorePattern,
  });

  if (specs.length === 0) {
    warn("No spec files found to execute. Used configuration: %O", {
      specPattern,
      configSpecPattern: config.specPattern,
      excludeSpecPattern: [
        ...config.excludeSpecPattern,
        config.additionalIgnorePattern,
      ],
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
    ...guessBrowser(options.browser ?? "electron", config.resolved.browsers),
  };
  const ci = getCI();
  const commit = await getGitInfo(config.projectRoot);

  const run = await createRun({
    ci,
    specs: specs.map((spec) => spec.relative),
    commit,
    group,
    platform,
    parallel,
    ciBuildId,
    projectId: config.projectId,
    recordKey: key,
    specPattern,
    tags,
    testingType,
  });

  info("Run URL:", run.runUrl);
  setRunId(run.runId);

  cutInitialOutput();
  const results = await runTillDone({
    runId: run.runId,
    groupId: run.groupId,
    machineId: run.machineId,
    platform,
    config,
  });

  const testResults = summarizeTestResults(Object.values(results));

  divider();

  title("white", "Cloud Run Finished");

  console.log(summaryTable(results));

  info("Recorded Run:", run.runUrl);
  spacer();

  return testResults;
}

async function runTillDone({
  runId,
  groupId,
  machineId,
  platform,
  config,
}: CreateInstancePayload & {
  config: ReturnType<typeof getCurrentsConfig>;
}) {
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

    let cypressResult = await runSpecFileSafe({ spec: currentSpecFile.spec });

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
