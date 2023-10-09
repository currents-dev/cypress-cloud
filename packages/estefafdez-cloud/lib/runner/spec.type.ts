// as reported by spec:after
export interface SpecResult {
  error: string | null;
  exception: null | string;
  hooks: TestHook[] | null;
  reporter: string;
  reporterStats: ReporterStats | null;
  screenshots: Screenshot[];
  spec: Spec;
  stats: Stats;
  tests: Test[] | null;
  video: string | null;
}

export interface Spec {
  absolute: string;
  baseName: string;
  fileExtension: string;
  fileName: string;
  name: string;
  relative: string;
  relativeToCommonRoot: string;
  specFileExtension: string;
  specType: string;
}

export interface Screenshot {
  height: number;
  name: string | null;
  path: string;
  screenshotId: string;
  takenAt: string;
  testAttemptIndex: number;
  testId: string;
  width: number;
}

export interface ReporterStats {
  suites: number;
  tests: number;
  passes: number;
  pending: number;
  failures: number;
  start: string;
  end: string;
  duration: number;
}

export interface Stats {
  suites: number;
  tests: number;
  passes: number;
  pending: number;
  skipped: number;
  failures: number;
  wallClockStartedAt: string;
  wallClockEndedAt: string;
  wallClockDuration: number;
}

export interface Test {
  attempts: TestAttempt[];
  body: string;
  displayError: string | null;
  state: TestState;
  title: string[];
  config?: null | TestConfig;
  hookIds: string[];
  hooks: TestHook[] | null;
  testId: string;
}

export interface TestHook {
  hookId: string;
  hookName: "before each" | "after each" | "before all" | "after all";
  title: string[];
  body: string;
}

interface TestConfig {
  retries:
    | {
        openMode: number;
        runMode: number;
      }
    | number;
}

export enum TestState {
  Failed = "failed",
  Passed = "passed",
  Pending = "pending",
  Skipped = "skipped",
}

export interface TestAttempt {
  error: TestError | null;
  failedFromHookId: string | null;
  state: TestState;
  timings: TestAttemptTiming | null;
  videoTimestamp: number;
  wallClockDuration: number;
  wallClockStartedAt: string;
}

export type TestError = CypressCommandLine.TestError & {
  codeFrame?: TestCodeFrame | null;
};

interface TestCodeFrame {
  line: number | null;
  column: number | null;
  originalFile: string | null;
  relativeFile: string | null;
  absoluteFile: string | null;
  frame: string | null;
  language: string | null;
}

export type TestAttemptTiming = {
  [key in HookTimingKeys]: HookTiming;
} & {
  lifecycle: number;
  test: TimingItem;
};

type HookTimingKeys = "before each" | "after each";
export interface HookTiming extends TimingItem {
  hookId: string;
}
export interface TimingItem {
  fnDuration: number;
  afterFnDuration: number;
}
