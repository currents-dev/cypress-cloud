import("./lib/init");

import { uploadArtifacts, uploadStdoutSafe } from "./lib/artifacts";
import * as capture from "./lib/capture";
import { parseOptions } from "./lib/cli/";
import { getCurrentsConfig, mergeConfig } from "./lib/config";
import { makeRequest, setRunId } from "./lib/httpClient";
import {
  getInstanceResultPayload,
  getInstanceTestsPayload,
  isSuccessResult,
  summarizeTestResults,
} from "./lib/results";
import { findSpecs } from "./lib/specMatcher";
import { Platform, SummaryResults, TestingType } from "./types";

import { guessBrowser } from "./lib/browser";
import { getCI } from "./lib/ciProvider";
import { runSpecFile } from "./lib/cypress";
import { getGitInfo } from "./lib/git";
import { divider, info, spacer, title, warn } from "./lib/log";
import { getPlatformInfo } from "./lib/platform";
import { summaryTable } from "./lib/table";

let stdout = capture.stdout();

export async function run() {
  const options = parseOptions();
  const { component, parallel, key, ciBuildId, group, tag: tags } = options;

  const currentsConfig = await getCurrentsConfig();

  const testingType: TestingType = component ? "component" : "e2e";
  const config = await mergeConfig(testingType, currentsConfig);
  const specPattern = options.spec || config.specPattern;
  const specs = await findSpecs({
    projectRoot: config.projectRoot,
    testingType,
    specPattern,
    configSpecPattern: config.specPattern,
    excludeSpecPattern: config.excludeSpecPattern,
    additionalIgnorePattern: config.additionalIgnorePattern,
  });

  if (specs.length === 0) {
    warn("No spec files found to execute using configuration: %O", {
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
    "Discovered %d spec files, connecting to orchestration service...",
    specs.length
  );

  const osPlatformInfo = await getPlatformInfo();
  const platform = {
    ...osPlatformInfo,
    ...guessBrowser(options.browser ?? "electron", config.resolved.browsers),
  };
  const ci = getCI();
  const commit = await getGitInfo(config.projectRoot);

  const res = await makeRequest({
    method: "POST",
    url: "runs",
    data: {
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
    },
  });

  const run = res.data;
  info("Run URL:", run.runUrl);
  setRunId(run.runId);

  const results = await runTillDone({
    runId: run.runId,
    groupId: run.groupId,
    machineId: run.machineId,
    platform,
  });

  const testResults = summarizeTestResults(Object.values(results));

  divider();

  title("white", "Cloud Run Finished");

  console.log(summaryTable(results));

  info("Recorded Run:", run.runUrl);
  spacer();

  return testResults;
}

type InstanceRequestArgs = {
  runId: string;
  groupId: string;
  machineId: string;
  platform: Platform;
};
async function getSpecFile({
  runId,
  groupId,
  machineId,
  platform,
}: InstanceRequestArgs) {
  const res = await makeRequest({
    method: "POST",
    url: `runs/${runId}/instances`,
    data: {
      runId,
      groupId,
      machineId,
      platform,
    },
  });
  return res.data;
}

async function runTillDone({
  runId,
  groupId,
  machineId,
  platform,
}: InstanceRequestArgs) {
  const summary: SummaryResults = {};

  let hasMore = true;
  while (hasMore) {
    const currentSpecFile = await getSpecFile({
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

    const cypressResult = await runSpecFile({ spec: currentSpecFile.spec });

    if (!isSuccessResult(cypressResult)) {
      // TODO: handle failure
      // do not exit
      // skip the spec file, go to next
      warn("Executing the spec file has failed, getting the next spec file...");
      continue;
    }

    summary[currentSpecFile.spec] = cypressResult;
    await processCypressResults(currentSpecFile.instanceId, cypressResult);

    capture.restore();
    stdout = capture.stdout();
  }

  return summary;
}

async function processCypressResults(
  instanceId: string,
  results: CypressCommandLine.CypressRunResult
) {
  const runResult = results.runs[0];
  if (!runResult) {
    throw new Error("No run found in Cypress results");
  }

  await makeRequest({
    method: "POST",
    url: `instances/${instanceId}/tests`,
    data: getInstanceTestsPayload(results.runs[0], results.config),
  });

  const resultPayload = getInstanceResultPayload(runResult);
  const uploadInstructions = await makeRequest({
    method: "POST",
    url: `instances/${instanceId}/results`,
    data: resultPayload,
  });

  const { videoUploadUrl, screenshotUploadUrls } = uploadInstructions.data;

  await uploadArtifacts({
    videoUploadUrl,
    videoPath: runResult.video,
    screenshotUploadUrls,
    screenshots: resultPayload.screenshots,
  });
  // keep last because of stdout
  await uploadStdoutSafe(instanceId, stdout.toString());
}
