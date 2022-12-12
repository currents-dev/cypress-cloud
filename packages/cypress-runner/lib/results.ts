import { nanoid } from "nanoid";
import { CypressResult, ScreenshotArtifact } from "../types";

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
    wallClockDuration: attempt.duration,
    wallClockStartedAt: attempt.startedAt,
  };
};

export const getInstanceResultPayload = (
  runResult: CypressCommandLine.RunResult
) => {
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

// this one need testing with real data
export const getInstanceTestsPayload = (
  runResult: CypressCommandLine.RunResult,
  config: Cypress.ResolvedConfigOptions
) => {
  return {
    config,
    tests:
      runResult.tests?.map((test, i) => ({
        title: test.title,
        config: {},
        body: test.body,
        clientId: `r${i}`,
      })) ?? [],
  };
};
