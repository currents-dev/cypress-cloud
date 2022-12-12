// @ts-ignore
import git from "@cypress/commit-info";
import axios from "axios";
import { program } from "commander";
import cypress from "cypress";
import { uploadArtifacts, uploadStdout } from "./lib/artifacts";
import * as capture from "./lib/capture";
import { getConfig } from "./lib/config";
import {
  getInstanceResultPayload,
  getInstanceTestsPayload,
  isSuccessResult,
} from "./lib/results";
import { findSpecs } from "./lib/specMatcher";
import { Platform, TestingType } from "./types";

const stdout = capture.stdout();

program
  .option("--parallel", "Run tests in parallel", false)
  .option("--record", "Record test run", true)
  .option("--key <value>")
  .option("--component", "", false)
  .option("--e2e", "", true)
  .option("--ci-build-id <value>")
  .option("--spec <value>", "Run specific spec", "")
  .option("--group <value>", "Group test run", "");

program.parse();
const options = program.opts();

export async function run() {
  const commit = await git.commitInfo();
  const { parallel, record, key, ciBuildId, group } = options;

  const testingType: TestingType = options.component ? "component" : "e2e";
  const config = await getConfig(testingType);

  if (!config.projectId) {
    console.error("Missing projectId in config file");
    process.exit(1);
  }

  const specPattern = options.spec ?? config.specPattern;
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
  // I expect this to be a source of trouble untils we polish the implementation
  if (specs.length === 0) {
    console.error("No spec matching the spec pattern found");
    process.exit(0);
  }

  const platform = {
    osName: "darwin",
    osVersion: "22.1.0",
    browserName: "Electron",
    browserVersion: "106.0.5249.51",
  };
  const res = await axios.post("http://localhost:1234/runs", {
    ci: {
      params: null,
      provider: null,
    },
    specs: specs.map((spec) => spec.relative),
    commit: {
      ...commit,
      remoteOrigin: commit.remote,
      authorEmail: commit.email,
      authorName: commit.author,
    },
    group,
    platform,
    parallel,
    ciBuildId,
    projectId: config.projectId,
    recordKey: key,
    specPattern,
    tags: [],
    testingType,
  });

  const run = res.data;
  console.log(run);
  console.log("Run created", run.runUrl);

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
  const res = await axios.post(
    `http://localhost:1234/runs/${runId}/instances`,
    {
      runId,
      groupId,
      machineId,
      platform,
    }
  );
  return res.data;
}

async function runSpecFile({ spec }: { spec: string }) {
  const result = await cypress.run({
    // TODO: add other configuratiun based on CLI flags and the config file
    // trashAssetsBeforeRuns: false,
    spec,
  });
  return result;
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

    console.log("Running spec file", currentSpecFile);
    const cypressResult = await runSpecFile({ spec: currentSpecFile.spec });

    console.dir(cypressResult, { depth: null });
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

  await axios.post(
    `http://localhost:1234/instances/${instanceId}/tests`,
    getInstanceTestsPayload(results.runs[0], results.config)
  );
  const resultPayload = getInstanceResultPayload(runResult);
  const uploadInstructions = await axios.post(
    `http://localhost:1234/instances/${instanceId}/results`,
    resultPayload
  );

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
