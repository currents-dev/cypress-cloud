import("./lib/init");

import { cutInitialOutput, resetCapture } from "./lib/capture";
import { getCurrentsConfig, mergeConfig } from "./lib/config";
import { setRunId } from "./lib/httpClient";
import {
  getFailedDummyResult,
  isSuccessResult,
  processCypressResults,
  summarizeTestResults,
} from "./lib/results";
import { findSpecs } from "./lib/specMatcher";
import {
  CypressModuleAPIRunOptions,
  SummaryResults,
  TestingType,
  TestsResult,
} from "./types";

import { createInstance, createRun } from "./lib/api/api";
import { CreateInstancePayload } from "./lib/api/types/instance";
import { guessBrowser } from "./lib/browser";
import { getCI } from "./lib/ciProvider";
import { runSpecFileSafe } from "./lib/cypress";
import { getGitInfo } from "./lib/git";
import { divider, info, spacer, title, warn } from "./lib/log";
import { getPlatformInfo } from "./lib/platform";
import { summaryTable } from "./lib/table";

interface RunOptions extends CypressModuleAPIRunOptions {
  /** The project ID to use. If not specified, will use the projectId from currents.config.js or process.env.CURRENTS_PROJECT_ID */
  projectId?: string;
  /**  The record key to use */
  key?: string;
  /** List of tags for the recorded run, like ["production" , "nightly"] */
  tag?: string[];
}

/**
 * Run the Cypress tests.
 * You can either pass the options as a parameter, or run the cli.
 *
 * @augments RunOptions
 * @returns {TestsResult | undefined} The test results, or undefined if no tests were run.
 */
export async function run(parameters: RunOptions) {
  spacer();

  const { key: _key, projectId: _projectId, ...cypressRunOptions } = parameters;

  const { projectId: currentsProjectId } = await getCurrentsConfig();

  const {
    group,
    parallel,
    ciBuildId,
    tag: tags,
    testingType: _testingType,
  } = parameters;
  const key = _key ?? process.env.CURRENTS_RECORD_KEY;
  if (!key) {
    throw new Error(
      "Missing 'key'. Please either pass it as a cli flag '-k, --key <record-key>', as CURRENTS_RECORD_KEY environment variable, or if using the run function directly pass it as the 'key' parameter."
    );
  }

  const projectId =
    _projectId ?? currentsProjectId ?? process.env.CURRENTS_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      "Missing projectId. Please either set it in currents.config.js, as CURRENTS_PROJECT_ID environmnet variable, or if using the run function directly pass it as the 'projectId' parameter."
    );
  }

  const testingType: TestingType = _testingType ?? "e2e";
  const config = await mergeConfig(testingType, projectId, cypressRunOptions);
  const specPattern = parameters.spec || config.specPattern;
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
    ...guessBrowser(parameters.browser ?? "electron", config.resolved.browsers),
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
    projectId: config.projectId,
    recordKey: key,
    specPattern,
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
    cypressRunOptions
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
    config: ReturnType<typeof getCurrentsConfig>;
  },
  cypressRunOptions: CypressModuleAPIRunOptions
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
