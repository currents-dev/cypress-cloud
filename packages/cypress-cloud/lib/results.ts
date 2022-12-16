import {
  CypressResult,
  ScreenshotArtifact,
  TestsResult,
} from "cypress-cloud/types";
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
  const runResult = results.runs[0];
  if (!runResult) {
    throw new Error("No run found in Cypress results");
  }

  await setInstanceTests(
    instanceId,
    getInstanceTestsPayload(results.runs[0], results.config)
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

export function getFailedDummyResult({
  spec,
  error,
  config,
}: {
  spec: string;
  error: string;
  config: any; // TODO tighten this up
}): CypressCommandLine.CypressRunResult {
  const start = new Date().toISOString();
  const end = new Date().toISOString();
  return {
    config,
    status: "finished",
    startedTestsAt: new Date().toISOString(),
    endedTestsAt: new Date().toISOString(),
    totalDuration: 0,
    totalSuites: 1,
    totalFailed: 1,
    totalPassed: 0,
    totalPending: 0,
    totalSkipped: 0,
    totalTests: 1,
    browserName: "unknown",
    browserVersion: "unknown",
    browserPath: "unknown",
    osName: "unknown",
    osVersion: "unknown",
    cypressVersion: "unknown",
    runs: [
      {
        stats: {
          suites: 1,
          tests: 1,
          passes: 0,
          pending: 0,
          skipped: 0,
          failures: 1,
          startedAt: start,
          endedAt: end,
          duration: 0,
        },
        reporter: "spec",
        reporterStats: {},
        hooks: [],
        error,
        video: null,
        spec: {
          name: spec,
          relative: "",
          absolute: "",
          relativeToCommonRoot: "",
        },
        tests: [
          {
            title: ["Automatically dummy generated test"],
            state: "failed",
            body: "// This test is automatically generated due to execution failure",
            displayError: error,
            attempts: [
              {
                state: "failed",
                startedAt: start,
                duration: 0,
                videoTimestamp: 0,
                screenshots: [],
                error: {
                  name: "CloudExecutionError",
                  message: error,
                  stack: "",
                },
              },
            ],
          },
        ],
        shouldUploadVideo: false,
        skippedSpec: false,
      },
    ],
  };
}
