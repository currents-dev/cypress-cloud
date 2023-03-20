import { CypressResult, ScreenshotArtifact } from "cypress-cloud/types";
import { match, P } from "ts-pattern";

import Debug from "debug";
import _ from "lodash";
import { nanoid } from "nanoid";
import { SetInstanceTestsPayload, UpdateInstanceResultsPayload } from "../api";
import { MergedConfig } from "../config/config";
import { SpecResult, TestAttempt, TestState } from "../result.types";

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
      a.screenshots?.flatMap(
        (s) =>
          ({
            ...s,
            testId: `r${i}`,
            testAttemptIndex: ai,
            screenshotId: nanoid(),
          } ?? [])
      )
    )
  );
};

export const getScreenshotsSummary = (
  tests: CypressCommandLine.TestResult[] = []
): ScreenshotArtifact[] => {
  return tests.flatMap((test, i) =>
    test.attempts.flatMap((a, ai) =>
      a.screenshots?.flatMap(
        (s) =>
          ({
            ...s,
            testId: `r${i}`,
            testAttemptIndex: ai,
            screenshotId: nanoid(),
          } ?? [])
      )
    )
  );
};

export const getTestAttempt = (
  attempt: CypressCommandLine.AttemptResult | TestAttempt
): TestAttempt =>
  match(attempt)
    .with(
      {
        wallClockDuration: P.number,
        wallClockStartedAt: P.string,
      },
      (attempt) => attempt
    )
    .with(
      {
        duration: P.number,
      },
      (attempt) => ({
        ...attempt,
        state: attempt.state as TestState,
        failedFromHookId: null,
        wallClockDuration: attempt.duration,
        wallClockStartedAt: attempt.startedAt,
        timings: null,
      })
    )
    .otherwise((attempt) => ({
      ...attempt,
      failedFromHookId: attempt.failedFromHookId ?? null,
      wallClockDuration: null,
      wallClockStartedAt: null,
      timings: null,
    }));

export const getInstanceResultPayload = (
  runResult: CypressCommandLine.RunResult | SpecResult
): UpdateInstanceResultsPayload => {
  const altTests = [];
  if (runResult.error && !runResult.tests?.length) {
    altTests.push(getFakeTestFromException(runResult.error, runResult.stats));
  }
  return {
    stats: getStats(runResult.stats),
    reporterStats: runResult.reporterStats,
    exception: runResult.error ?? null,
    video: runResult.video,
    // result from after:spec has screenshots, fron `run` doesn't
    screenshots:
      // @ts-ignore
      runResult.screenshots ?? getScreenshotsSummary(runResult.tests ?? []),
    tests:
      runResult.tests?.map((test, i) => ({
        title: test.title,
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
  stats: CypressCommandLine.RunResult["stats"] | SpecResult["stats"]
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
        startedAt: stats.wallClockStartedAt ?? stats.startedAt,
        videoTimestamp: 0,
      }),
    ],
    clientId: "r0",
  };
}

export const getInstanceTestsPayload = (
  runResult: CypressCommandLine.RunResult | SpecResult,
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

export function normalizeRunResult(
  rawResult: CypressResult,
  specs: string[],
  config: MergedConfig
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
