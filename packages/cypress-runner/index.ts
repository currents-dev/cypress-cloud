import { program } from "commander";
import fs from "fs";
import { nanoid } from "nanoid";
import * as capture from "./lib/capture";
import { getConfig } from "./lib/config";

const readFile = fs.promises.readFile;
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
const cypress = require("cypress");
const axios = require("axios");
const git = require("@cypress/commit-info");
const { findSpecs } = require("./lib/specMatcher");

const stdout = capture.stdout();

async function main() {
  const commit = await git.commitInfo();
  const { parallel, record, key, ciBuildId, group } = options;

  const testingType = options.component ? "component" : "e2e";
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

async function getSpecFile({ runId, groupId, machineId, platform }) {
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

async function runSpecFile({ spec }) {
  const result = await cypress.run({
    // TODO: add other configuratiun based on CLI flags and the config file
    spec,
    trashAssetsBeforeRuns: false,
  });
  return result;
}

async function runTillDone({ runId, groupId, machineId, platform }) {
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
    await processCypressResults(currentSpecFile.instanceId, cypressResult);
  }
}

async function processCypressResults(instanceId, results) {
  await axios.post(
    `http://localhost:1234/instances/${instanceId}/tests`,
    getInstanceTestsPayload(results.runs[0], results.config)
  );
  const resultPayload = getInstanceResultPayload(results.runs[0]);
  const uploadInstructions = await axios.post(
    `http://localhost:1234/instances/${instanceId}/results`,
    resultPayload
  );

  console.log(uploadInstructions.data);
  const { videoUploadUrl, screenshotUploadUrls } = uploadInstructions.data;

  console.log("Uploading video", videoUploadUrl, results.runs[0].video);
  await uploadArtifacts({
    videoUploadUrl,
    videoPath: results.runs[0].video,
    screenshotUploadUrls,
    screenshots: resultPayload.screenshots,
  });

  await uploadStdout(instanceId, stdout.toString());
}

async function uploadArtifacts({
  videoPath,
  videoUploadUrl,
  screenshots,
  screenshotUploadUrls,
}) {
  // upload video
  if (videoUploadUrl) {
    await uploadFile(videoPath, videoUploadUrl);
  }
  // upload screenshots
  if (screenshotUploadUrls.length) {
    await Promise.all(
      screenshots.map((screenshot, i) => {
        const url = screenshotUploadUrls.find(
          (urls) => urls.screenshotId === screenshot.screenshotId
        ).uploadUrl;
        if (!url) {
          console.warn("Cannot find upload url for screenshot", screenshot);
        }
        return uploadFile(screenshot.path, url);
      })
    );
  }
}

const uploadStdout = async (instanceId, stdout) => {
  console.log("Uploading stdout...", instanceId);
  const res = await axios.put(
    `http://localhost:1234/instances/${instanceId}/stdout`,
    {
      stdout,
    }
  );
  console.log("Done uploading stdout", instanceId);
  return res.data;
};
// this one need testing with real data
const getInstanceTestsPayload = (runResult, config) => {
  return {
    config,
    tests:
      runResult.tests?.map((test, i) => ({
        title: test.title,
        config: test.config ?? {},
        body: test.body,
        clientId: `r${i}`,
      })) ?? [],
  };
};

const getInstanceResultPayload = (runResult) => {
  return {
    stats: getStats(runResult.stats),
    reporterStats: runResult.reporterStats,
    exception: runResult.error ?? null,
    video: runResult.video,
    screenshots: getScreenshotsSummary(runResult.tests ?? []),
    tests:
      runResult.tests?.map((test, i) => ({
        diplayError: test.displayError,
        state: test.state,
        attempts: test.attempts?.map(getTestAttempts) ?? [],
        clientId: `r${i}`,
      })) ?? [],
  };
};

const getScreenshotsSummary = (tests = []) => {
  return tests.flatMap((test, i) =>
    test.attempts.flatMap((a, ai) =>
      a.screenshots.flatMap((s) => ({
        ...s,
        testId: `r${i}`,
        testAttemptIndex: ai,
        screenshotId: nanoid(),
      }))
    )
  );
};

const getStats = (stats) => {
  return {
    ...stats,
    wallClockDuration: stats.duration,
    wallClockStartedAt: stats.startedAt,
    wallClockEndedAt: stats.endedAt,
  };
};

const getTestAttempts = (attempt) => {
  return {
    ...attempt,
    wallClockDuration: attempt.duration,
    wallClockStartedAt: attempt.startedAt,
  };
};

async function uploadFile(file, url) {
  console.log("Uploading file...", file);
  const f = await readFile(file);
  await axios.put(url, f);
  console.log("Done uploading file", file);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
