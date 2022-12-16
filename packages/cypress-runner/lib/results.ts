import {
  CypressResult,
  ScreenshotArtifact,
  TestsResult,
} from "cypress-runner/types";
import Debug from "debug";
import { nanoid } from "nanoid";
import {
  setInstanceTests,
  SetInstanceTestsPayload,
  TestState,
  updateInstanceResults,
  UpdateInstanceResultsPayload,
} from "./api";
import { uploadArtifacts, uploadStdoutSafe } from "./artifacts";
import { getCapturedOutput, getInitialOutput } from "./capture";
import { warn } from "./log";

const debug = Debug("currents:results");

export const isSuccessResult = (
  result: CypressResult
): result is CypressCommandLine.CypressRunResult => {
  return result.status === "finished";
};

export const getScreenshotsSummary = (
  tests: CypressCommandLine.TestResult[] = []
): ScreenshotArtifact[] => {
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

export const getStats = (stats: CypressCommandLine.RunResult["stats"]) => {
  return {
    ...stats,
    wallClockDuration: stats.duration,
    wallClockStartedAt: stats.startedAt,
    wallClockEndedAt: stats.endedAt,
  };
};

export const getTestAttempts = (attempt: CypressCommandLine.AttemptResult) => {
  return {
    ...attempt,
    state: attempt.state as TestState,
    wallClockDuration: attempt.duration,
    wallClockStartedAt: attempt.startedAt,
  };
};

export const getInstanceResultPayload = (
  runResult: CypressCommandLine.RunResult
): UpdateInstanceResultsPayload => {
  return {
    stats: getStats(runResult.stats),
    reporterStats: runResult.reporterStats,
    exception: runResult.error ?? null,
    video: !!runResult.video, // Did the instance generate a video?
    screenshots: getScreenshotsSummary(runResult.tests ?? []),
    tests:
      runResult.tests?.map((test, i) => ({
        displayError: test.displayError,
        state: test.state as TestState,
        attempts: test.attempts?.map(getTestAttempts) ?? [],
        clientId: `r${i}`,
      })) ?? [],
  };
};

// TODO this one need testing with real data
export const getInstanceTestsPayload = (
  runResult: CypressCommandLine.RunResult,
  config: Cypress.ResolvedConfigOptions
): SetInstanceTestsPayload => {
  return {
    config,
    tests:
      runResult.tests?.map((test, i) => ({
        title: test.title,
        config: null,
        body: test.body,
        clientId: `r${i}`,
        hookIds: [],
      })) ?? [],
    hooks: [],
  };
};

export const summarizeTestResults = (
  input: CypressCommandLine.CypressRunResult[]
): TestsResult => {
  return input.reduce(
    (
      acc,
      { totalFailed, totalPassed, totalPending, totalSkipped, totalTests }
    ) => ({
      pending: acc.pending + totalPending,
      failed: acc.failed + totalFailed,
      skipped: acc.skipped + totalSkipped,
      passed: acc.passed + totalPassed,
      total: acc.total + totalTests,
    }),
    {
      pending: 0,
      failed: 0,
      skipped: 0,
      passed: 0,
      total: 0,
    }
  );
};

export async function processCypressResults(
  instanceId: string,
  results: CypressCommandLine.CypressRunResult
) {
  const [runResult] = results.runs;

  await setInstanceTests(
    instanceId,
    getInstanceTestsPayload(runResult, results.config)
  );

  const resultPayload = getInstanceResultPayload(runResult);
  debug("result payload %o", resultPayload);
  const uploadInstructions = await updateInstanceResults(
    instanceId,
    resultPayload
  );

  const { videoUploadUrl, screenshotUploadUrls } = uploadInstructions;
  debug("artifact upload instructions %o", uploadInstructions);
  await uploadArtifacts({
    videoUploadUrl,
    videoPath: runResult.video,
    screenshotUploadUrls,
    screenshots: resultPayload.screenshots,
  });
  debug("uploading stdout for instanceId %s", instanceId);
  // keep last because of stdout
  await uploadStdoutSafe(instanceId, getInitialOutput() + getCapturedOutput());
}

export async function processCypressFailedResults(
  instanceId: string,
  results: CypressCommandLine.CypressFailedRunResult
) {
  warn(
    {
      instanceId,
      error: results.message,
    },
    "Executing the spec file has failed, getting the next spec file..."
  );

  // await setInstanceTests(
  //   instanceId,
  //   config: {}, // How to get it from cypress when it's failed?
  //   tests: [], // Do we want to just put it empty?
  //   hooks:[]
  // );

  // Call updateInstanceResults?
  // Don't know if we should call this function
}
