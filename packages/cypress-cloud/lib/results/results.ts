import { CypressResult, ScreenshotArtifact } from "cypress-cloud/types";
import Debug from "debug";
import _ from "lodash";
import { nanoid } from "nanoid";
import {
  SetInstanceTestsPayload,
  TestState,
  UpdateInstanceResultsPayload,
} from "../api";
import { MergedConfig } from "../config";
import { ConfigState } from "../state";

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
  runResult: CypressCommandLine.RunResult,
  coverageFilePath?: string
): UpdateInstanceResultsPayload => {
  return {
    stats: getStats(runResult.stats),
    reporterStats: runResult.reporterStats,
    exception: runResult.error ?? null,
    video: !!runResult.video, // Did the instance generate a video?
    screenshots: getScreenshotsSummary(runResult.tests ?? []),
    hasCoverage: !!coverageFilePath,
    tests:
      runResult.tests?.map((test, i) => ({
        displayError: test.displayError,
        state: test.state as TestState,
        hooks: runResult.hooks,
        attempts: test.attempts?.map(getTestAttempt) ?? [],
        clientId: `r${i}`,
      })) ?? [],
  };
};

export function getFakeTestFromException(
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
    hooks: runResult.hooks,
  };
};

export const summarizeTestResults = (
  input: CypressCommandLine.CypressRunResult[],
  config: MergedConfig
): CypressCommandLine.CypressRunResult => {
  if (!input.length) {
    return getEmptyCypressResults(config);
  }

  const overall = input.reduce(
    (
      acc,
      {
        totalDuration,
        totalFailed,
        totalPassed,
        totalPending,
        totalSkipped,
        totalTests,
        totalSuites,
      }
    ) => ({
      totalDuration: acc.totalDuration + totalDuration,
      totalSuites: acc.totalSuites + totalSuites,
      totalPending: acc.totalPending + totalPending,
      totalFailed: acc.totalFailed + totalFailed,
      totalSkipped: acc.totalSkipped + totalSkipped,
      totalPassed: acc.totalPassed + totalPassed,
      totalTests: acc.totalTests + totalTests,
    }),
    emptyStats
  );
  const firstResult = input[0];
  const startItems = input.map((i) => i.startedTestsAt).sort();
  const endItems = input.map((i) => i.endedTestsAt).sort();
  const runs = input.map((i) => i.runs).flat();
  return {
    ...overall,
    runs,
    startedTestsAt: _.first(startItems) as string,
    endedTestsAt: _.last(endItems) as string,
    ..._.pick(
      firstResult,
      "browserName",
      "browserVersion",
      "browserPath",
      "osName",
      "osVersion",
      "cypressVersion",
      "config"
    ),
    status: "finished",
  };
};

export function getEmptyCypressResults(
  config: MergedConfig
): CypressCommandLine.CypressRunResult {
  return {
    ...emptyStats,
    status: "finished",
    startedTestsAt: new Date().toISOString(),
    endedTestsAt: new Date().toISOString(),
    runs: [],
    // @ts-ignore
    config,
  };
}
const emptyStats = {
  totalDuration: 0,
  totalSuites: 0,
  totalPending: 0,
  totalFailed: 0,
  totalSkipped: 0,
  totalPassed: 0,
  totalTests: 0,
};

const getDummyFailedTest = (start: string, error: string) => ({
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
        name: "CypressExecutionError",
        message: error,
        stack: "",
      },
    },
  ],
});

export function getFailedDummyResult(
  configState: ConfigState,
  {
    specs,
    error,
  }: {
    specs: string[];
    error: string;
  }
): CypressCommandLine.CypressRunResult {
  const start = new Date().toISOString();
  const end = new Date().toISOString();
  return {
    // @ts-ignore
    config: configState.getConfig() ?? {},
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
        relative: s,
        absolute: s,
        relativeToCommonRoot: s,
      },
      tests: [getDummyFailedTest(start, error)],
      shouldUploadVideo: false,
      skippedSpec: false,
    })),
  };
}

export function getCypressRunResultForSpec(
  spec: string,
  cypressResult: CypressResult
): CypressCommandLine.CypressRunResult | undefined {
  if (!isSuccessResult(cypressResult)) {
    return;
  }

  const run = cypressResult.runs.find((r) => r.spec.relative === spec);
  if (!run) {
    return;
  }
  const stats = getStats(run.stats);
  // adjust the result for singe spec
  return {
    ...cypressResult,
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
