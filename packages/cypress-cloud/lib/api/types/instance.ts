import { Platform, ScreenshotArtifact } from "cypress-cloud/types";
import { ReporterStats, Screenshot, Stats, Test } from "../../result.types";
import { SetTestsPayload } from "./test";

export interface CypressConfig {
  video: boolean;
  videoUploadOnPasses: boolean;
  [key: string]: any;
}

export interface InstanceResult {
  stats: Stats;
  tests: Test[];
  error?: string;
  reporterStats: ReporterStats;
  exception: null | string;
  cypressConfig?: PickedCypressConfig | null;
  screenshots: Screenshot[];
  video: string | null;
}

// as reported by after:spec

export interface AssetUploadInstruction {
  uploadUrl: string;
  readUrl: string;
}

export interface ScreenshotUploadInstruction extends AssetUploadInstruction {
  screenshotId: string;
}

export type SetResultsTestsPayload = Pick<
  Test,
  "state" | "displayError" | "attempts" | "title" | "testId" | "hookIds"
> & { clientId: string };

export interface SetInstanceTestsPayload {
  config: PickedCypressConfig;
  tests: Array<SetTestsPayload>;
  hooks: CypressCommandLine.RunResult["hooks"];
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

export type CreateInstanceCyPayload = CreateInstancePayload & {
  batchSize: number;
};
export type CreateInstanceResponse = {
  spec: string | null;
  instanceId: string | null;
  claimedInstances: number;
  totalInstances: number;
};

export type InstanceResponseSpecDetails = {
  spec: string;
  instanceId: string;
};
export type CreateInstancesResponse = {
  specs: Array<InstanceResponseSpecDetails>;
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

export type UpdateInstanceResultsMergedPayload = {
  tests: SetInstanceTestsPayload;
  results: UpdateInstanceResultsPayload;
};

export interface UpdateInstanceResultsResponse {
  videoUploadUrl?: string | null;
  screenshotUploadUrls: ScreenshotUploadInstruction[];
}
