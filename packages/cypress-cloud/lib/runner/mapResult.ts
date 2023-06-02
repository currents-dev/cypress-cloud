import {
  CypressScreenshot,
  CypressTest,
  CypressTestAttempt,
} from "cypress-cloud/types";

import * as SpecAfter from "./spec.type";
import { getConfig } from "./state";

function getScreenshot(s: SpecAfter.Screenshot): CypressScreenshot {
  return {
    ...s,
    name: s.name ?? "screenshot",
  };
}

function getTestAttempt(
  attempt: SpecAfter.TestAttempt,
  screenshots: SpecAfter.Screenshot[]
): CypressTestAttempt {
  return {
    ...attempt,
    startedAt: attempt.wallClockStartedAt,
    duration: attempt.wallClockDuration,
    screenshots: screenshots.map(getScreenshot),
  };
}

function getTest(
  t: SpecAfter.Test,
  screenshots: SpecAfter.Screenshot[]
): CypressTest {
  const _screenshots = screenshots.filter((s) => s.testId === t.testId);
  return {
    ...t,
    attempts: t.attempts.map((a, i) =>
      getTestAttempt(
        a,
        _screenshots.filter((s) => s.testAttemptIndex === i)
      )
    ),
  };
}

export function specResultsToCypressResults(
  specAfterResult: SpecAfter.SpecResult
): CypressCommandLine.CypressRunResult {
  return {
    status: "finished",
    // @ts-ignore
    config: getConfig(),
    totalDuration: specAfterResult.stats.wallClockDuration,
    totalSuites: specAfterResult.stats.suites,
    totalTests: specAfterResult.stats.tests,
    totalFailed: specAfterResult.stats.failures,
    totalPassed: specAfterResult.stats.passes,
    totalPending: specAfterResult.stats.pending,
    totalSkipped: specAfterResult.stats.skipped,
    startedTestsAt: specAfterResult.stats.wallClockStartedAt,
    endedTestsAt: specAfterResult.stats.wallClockEndedAt,
    runs: [
      {
        stats: {
          ...specAfterResult.stats,
          startedAt: specAfterResult.stats.wallClockStartedAt,
          endedAt: specAfterResult.stats.wallClockEndedAt,
          duration: specAfterResult.stats.wallClockDuration,
        },
        reporter: specAfterResult.reporter,
        reporterStats: specAfterResult.reporterStats ?? {},
        spec: specAfterResult.spec,
        error: specAfterResult.error,
        video: specAfterResult.video,
        shouldUploadVideo: true, // not really used
        // @ts-ignore
        // wrong typedef for CypressCommandLine.CypressRunResult
        // actual HookName is "before all" | "before each" | "after all" | "after each"
        hooks: specAfterResult.hooks,
        tests: (specAfterResult.tests ?? []).map((t) =>
          getTest(t, specAfterResult.screenshots)
        ),
      },
    ],
  };
}
