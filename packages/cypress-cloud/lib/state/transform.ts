import { ArrayItemType, CypressRun } from "cypress-cloud/types";
import { Screenshot, SpecResult, Test, TestAttempt } from "../result.types";

type CypressRunTest = ArrayItemType<CypressRun["tests"]>;
type CypressRunTestAttempt = ArrayItemType<CypressRunTest["attempts"]>;
type CypressRunScreenshot = ArrayItemType<CypressRunTestAttempt["screenshots"]>;
type CypressRunHook = ArrayItemType<CypressRun["hooks"]>;

export function getCypressRunResult(specResult: SpecResult): CypressRun {
  return {
    spec: specResult.spec,
    error: specResult.error,
    video: specResult.video,
    stats: getStats(specResult.stats),
    reporter: specResult.reporter,
    reporterStats: specResult.reporterStats,
    hooks: specResult.hooks.map(getHook),
    tests: specResult.tests.map((t) => getTest(t, specResult.screenshots)),
  };
}

function getSpec();
function getHook(hook: CypressRunHook): CypressRunHook {
  return hook;
}

function getStats(stats: SpecResult["stats"]): CypressRun["stats"] {
  return {
    ...stats,
    duration: stats.wallClockDuration,
    startedAt: stats.wallClockStartedAt,
    endedAt: stats.wallClockEndedAt,
  };
}

function getTest(test: Test, screenshots: Screenshot[]): CypressRunTest {
  return {
    ...test,
    attempts: test.attempts.map((attempt, attemptIndex) =>
      getTestAttempt(attempt, attemptIndex, screenshots)
    ),
  };
}

function getTestAttempt(
  attempt: TestAttempt,
  attemptIndex: number,
  screenshots: Screenshot[]
): CypressRunTestAttempt {
  return {
    ...attempt,
    startedAt: attempt.wallClockStartedAt ?? new Date().toISOString(),
    duration: attempt.wallClockDuration ?? 0,
    videoTimestamp: attempt.videoTimestamp ?? 0,
    screenshots: screenshots
      .filter((s) => s.testAttemptIndex === attemptIndex)
      .map(getScreenshot),
  };
}

function getScreenshot(s: Screenshot): CypressRunScreenshot {
  return {
    ...s,
    name: s.name ?? s.path,
  };
}
