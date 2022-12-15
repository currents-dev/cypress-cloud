import { Platform, ScreenshotArtifact } from "../../../types";
import { Test, TestHook } from "./test";

export interface Screenshot {
  screenshotId: string;
  name: string | null;
  testId: string;
  takenAt: string;
  height: number;
  width: number;
  screenshotURL: string;
}

export interface InstanceResultStats {
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

export interface CypressConfig {
  video: boolean;
  videoUploadOnPasses: boolean;
  [key: string]: any;
}

export interface InstanceResult {
  stats: InstanceResultStats;
  tests: Test[];
  error?: string;
  reporterStats: ReporterStats;
  exception: null | string;
  cypressConfig?: PickedCypressConfig | null;
  screenshots: Screenshot[];
  video: boolean;
  videoUrl?: string;
}

export interface AssetUploadInstruction {
  uploadUrl: string;
  readUrl: string;
}

export interface ScreenshotUploadInstruction extends AssetUploadInstruction {
  screenshotId: string;
}

export type SetTestsPayload = Pick<
  Test,
  "body" | "title" | "config" | "hookIds"
> & { clientId: string };

export type SetResultsTestsPayload = Pick<
  Test,
  "state" | "displayError" | "attempts"
> & { clientId: string };

export interface SetInstanceTestsPayload {
  config: PickedCypressConfig;
  tests: Array<SetTestsPayload>;
  hooks: TestHook[];
}

export type PickedCypressConfig = Pick<
  CypressConfig,
  "video" | "videoUploadOnPasses"
>;

export type CreateInstancePayload = {
  runId: string;
  groupId: string;
  machineId: string;
  platform: Platform;
};

export type CreateInstanceResponse = {
  spec: string | null;
  instanceId: string | null;
  claimedInstances: number;
  totalInstances: number;
};

export type UpdateInstanceResultsPayload = Pick<
  InstanceResult,
  "stats" | "exception" | "video"
> & {
  tests: Array<SetResultsTestsPayload> | null;
} & {
  reporterStats: CypressCommandLine.RunResult["reporterStats"] | null;
} & {
  screenshots: ScreenshotArtifact[];
};

export interface UpdateInstanceResultsResponse {
  videoUploadUrl?: string | null;
  screenshotUploadUrls: ScreenshotUploadInstruction[];
}
