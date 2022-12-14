import "./lib/stdout";

import cypressPckg from "cypress/package.json";
import { uploadArtifacts, uploadStdout } from "./lib/artifacts";
import * as capture from "./lib/capture";
import { parseOptions } from "./lib/cli/";
import { getCurrentsConfig, mergeConfig } from "./lib/config";
import { makeRequest, setCypressVersion, setRunId } from "./lib/httpClient";
import {
  getInstanceResultPayload,
  getInstanceTestsPayload,
  isSuccessResult,
} from "./lib/results";
import { findSpecs } from "./lib/specMatcher";
import { Platform, TestingType } from "./types";

import { guessBrowser } from "./lib/browser";
import { getCiParams, getCiProvider } from "./lib/ciProvider";
import { runSpecFile } from "./lib/cypress";
import { getGitInfo } from "./lib/git";
import { getPlatformInfo } from "./lib/platform";

let stdout = capture.stdout();
setCypressVersion(cypressPckg.version);

export async function run() {
  const options = parseOptions();
  const { component, parallel, key, ciBuildId, group, tag: tags } = options;
  const testingType: TestingType = component ? "component" : "e2e";

  const currentsConfig = await getCurrentsConfig();
  if (!currentsConfig.projectId) {
    console.error("Missing projectId in config file");
    process.exit(1);
  }
  const config = await mergeConfig(testingType, currentsConfig);

  const specPattern = options.spec || config.specPattern;

  const specs = await findSpecs({
    projectRoot: process.cwd(),
    testingType,
    specPattern,
    configSpecPattern: config.specPattern,
    excludeSpecPattern: config.excludeSpecPattern,
    additionalIgnorePattern: config.additionalIgnorePattern,
  });

  console.log(
    "Resolved spec files to execute",
    specs.map((spec) => spec.absolute)
  );

  // TODO: clarify the message here, and show the configuration details to allow troubleshooting
  // I expect this to be a source of trouble until we polish the implementation
  if (specs.length === 0) {
    console.error("No spec matching the spec pattern found");
    process.exit(0);
  }

  const osPlatformInfo = await getPlatformInfo();

  const platform = {
    ...osPlatformInfo,
    ...guessBrowser(options.browser ?? "electron", config.resolved.browsers),
  };
  const ci = {
    params: getCiParams(),
    provider: getCiProvider(),
  };
  const commit = await getGitInfo();
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
  console.log("Run created", run.runUrl);
  setRunId(run.runId);

  await runTillDone({
    runId: run.runId,
    groupId: run.groupId,
    machineId: run.machineId,
    platform,
  });
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
  console.log(`POST http://localhost:1234/runs/${runId}/instances`);
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
  let hasMore = true;
  while (hasMore) {
    const currentSpecFile = await getSpecFile({
      runId,
      groupId,
      machineId,
      platform,
    });
    if (!currentSpecFile.spec) {
      console.log("No more spec files");
      console.log("Run URL", `http://localhost:8080/runs/${runId}`);
      hasMore = false;
      break;
    }

    capture.restore();
    stdout = capture.stdout();

    console.log("Running spec file...", currentSpecFile);
    const cypressResult = await runSpecFile({ spec: currentSpecFile.spec });

    // console.dir(cypressResult, { depth: null });
    console.log(
      "Sending cypress results to server....",
      currentSpecFile.instanceId
    );
    if (!isSuccessResult(cypressResult)) {
      // TODO: handle failure
      console.log("Cypress run failed");
      process.exit(1);
    }
    await processCypressResults(currentSpecFile.instanceId, cypressResult);
  }
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

  console.log(uploadInstructions.data);
  const { videoUploadUrl, screenshotUploadUrls } = uploadInstructions.data;

  console.log("Uploading video", videoUploadUrl, runResult.video);

  await uploadArtifacts({
    videoUploadUrl,
    videoPath: runResult.video,
    screenshotUploadUrls,
    screenshots: resultPayload.screenshots,
  });

  await uploadStdout(instanceId, stdout.toString());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
