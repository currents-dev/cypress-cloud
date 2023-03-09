import {
  CypressResult,
  ScreenshotArtifact,
  TestsResult,
} from "cypress-cloud/types";
import Debug from "debug";
import { nanoid } from "nanoid";
import {
  SetInstanceTestsPayload,
  TestState,
  UpdateInstanceResultsPayload,
} from "../api";
import { ResolvedConfig } from "../config";

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

export const getTestAttempt = (attempt: CypressCommandLine.AttemptResult) => {
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
  const altTests = [];
  if (runResult.error && !runResult.tests?.length) {
    altTests.push(getFakeTestFromException(runResult.error, runResult.stats));
  }
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
        hooks: runResult.hooks,
        attempts: test.attempts?.map(getTestAttempt) ?? [],
        clientId: `r${i}`,
      })) ?? altTests,
  };
};

function getFakeTestFromException(
  error: string,
  stats: CypressCommandLine.RunResult["stats"]
) {
  return {
    title: ["Unknown"],
    body: "",
    displayError: error.split("\n")[0],
    state: "failed",
    hooks: [],
    attempts: [
      getTestAttempt({
        state: "failed",
        duration: 0,
        error: {
          name: "Error",
          message: error.split("\n")[0],
          stack: error,
        },
        screenshots: [],
        startedAt: stats.startedAt,
        videoTimestamp: 0,
      }),
    ],
    clientId: "r0",
  };
}

export const getInstanceTestsPayload = (
  runResult: CypressCommandLine.RunResult,
  config: Cypress.ResolvedConfigOptions
): SetInstanceTestsPayload => {
  const altTests = [];
  if (runResult.error && !runResult.tests?.length) {
    altTests.push(getFakeTestFromException(runResult.error, runResult.stats));
  }
  return {
    config,
    tests:
      runResult.tests?.map((test, i) => ({
        title: test.title,
        config: null,
        body: test.body,
        clientId: `r${i}`,
        hookIds: [],
      })) ?? altTests,
    hooks: runResult.hooks,
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
      failures: acc.failures + totalFailed,
      skipped: acc.skipped + totalSkipped,
      passes: acc.passes + totalPassed,
      tests: acc.tests + totalTests,
    }),
    {
      pending: 0,
      failures: 0,
      skipped: 0,
      passes: 0,
      tests: 0,
    }
  );
};

export function getFailedDummyResult({
  specs,
  error,
  config,
}: {
  specs: string[];
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
    runs: specs.map((s) => ({
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
        name: s,
        relative: "",
        absolute: "",
        relativeToCommonRoot: "",
      },
      tests: [
        {
          title: ["Unknown"],
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
    })),
  };
}

export function normalizeRawResult(
  rawResult: CypressResult,
  specs: string[],
  config: ResolvedConfig
): CypressCommandLine.CypressRunResult {
  if (!isSuccessResult(rawResult)) {
    return getFailedDummyResult({
      specs,
      error: rawResult.message,
      config,
    });
  }
  return rawResult;
}

export function getSummaryForSpec(
  spec: string,
  runResult: CypressCommandLine.CypressRunResult
) {
  const run = runResult.runs.find((r) => r.spec.relative === spec);
  if (!run) {
    return;
  }
  const stats = getStats(run.stats);
  // adjust the result for singe spec
  return {
    ...runResult,
    runs: [run],
    totalSuites: 1,
    totalDuration: stats.wallClockDuration,
    totalTests: stats.tests,
    totalFailed: stats.failures,
    totalPassed: stats.passes,
    totalPending: stats.pending,
    totalSkipped: stats.skipped,
    startedTestsAt: stats.wallClockStartedAt,
    endedTestsAt: stats.wallClockEndedAt,
  };
}
