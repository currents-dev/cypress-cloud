export type TestingType = Cypress.TestingType;
export type SpecType = "component" | "integration";
export type ArrayItemType<T> = T extends (infer U)[] ? U : T;
export type NonEmptyArray<T> = [T, ...T[]];

export type CypressRun = ArrayItemType<
  CypressCommandLine.CypressRunResult["runs"]
>;

export type CypressResult =
  | CypressCommandLine.CypressRunResult
  | CypressCommandLine.CypressFailedRunResult;

export type Platform = {
  osName: string;
  osVersion: string;
  browserName: string;
  browserVersion: string;
};

export interface CommitData {
  sha: string;
  branch?: string;
  authorName?: string;
  authorEmail?: string;
  message?: string;
  remoteOrigin?: string;
}

export type DetectedBrowser = {
  name: string; // or enum? not sure
  family: string;
  channel: string;
  displayName: string;
  version: string;
  path: string;
  minSupportedVersion: number;
  majorVersion: string;
};

export interface FindSpecs<T> {
  projectRoot: string;
  testingType: TestingType;
  /**
   * This can be over-ridden by the --spec argument (run mode only)
   * Otherwise it will be the same as `configSpecPattern`
   */
  specPattern: T;
  /**
   * The specPattern resolved from e2e.specPattern or component.specPattern
   * inside of `cypress.config`.
   */
  configSpecPattern: T;
  /**
   * User can opt to exclude certain patterns in cypress.config.
   */
  excludeSpecPattern: T;
  /**
   * If in component testing mode, we exclude all specs matching the e2e.specPattern.
   */
  additionalIgnorePattern: T;
}

export interface BaseSpec {
  name: string;
  relative: string;
  absolute: string;
}

export interface SpecFile extends BaseSpec {
  baseName: string;
  fileName: string;
}

export interface FoundSpec extends SpecFile {
  specFileExtension: string;
  fileExtension: string;
  specType: SpecType;
}

export interface SpecWithRelativeRoot extends FoundSpec {
  relativeToCommonRoot: string;
}

export interface ScreenshotUploadInstruction {
  screenshotId: string;
  uploadUrl: string;
  readUrl: string;
}

export type ScreenshotArtifact = CypressCommandLine.ScreenshotInformation & {
  testId: string;
  testAttemptIndex: number;
  screenshotId: string;
};

export interface TestsResult {
  pending: number;
  failures: number;
  skipped: number;
  passes: number;
  tests: number;
}

export type SummaryResult = Record<string, CypressCommandLine.CypressRunResult>;

// Explicitly filter cypress-related flags - prevent triggering recording mode  to avoid confusion
export type StrippedCypressModuleAPIOptions = Omit<
  Partial<CypressCommandLine.CypressRunOptions>,
  | "tag"
  | "spec"
  | "exit"
  | "headed"
  | "headless"
  | "noExit"
  | "parallel"
  | "record"
  | "key"
  | "tag"
  | "group"
  | "ciBuildId"
>;

// Used to run Cypress via module API and via CLI
export type CypressRunParameters = StrippedCypressModuleAPIOptions & {
  record: false;
};

export type CurrentsRunParameters = StrippedCypressModuleAPIOptions & {
  /** The CI build ID to use for the run */
  ciBuildId?: string;
  /** The batch size defines how many spec files will be served in one orchestration "batch". If not specified, will use the projectId from currents.config.js, the default value is 1 (i.e. no batching) */
  batchSize?: number;
  /** The URL of the currents server to use. If not specified, will use the one from currents.config.js */
  cloudServiceUrl?: string;
  /** The environment variables to use for the run */
  env?: Record<string, unknown>;
  /** The group id to use for the run */
  group?: string;
  /**  The record key to use */
  recordKey?: string;
  /** Whether to run the spec files in parallel */
  parallel?: boolean;
  /** The project ID to use. */
  projectId?: string;
  /** The array of spec patterns for the execution */
  spec?: string[];
  /** The array of tags for the execution */
  tag?: string[];
  /** "e2e" or "component", the default value is "e2e" */
  testingType?: TestingType;
};

// User-facing interface
export interface CurrentsRunAPI extends CurrentsRunParameters {
  readonly projectId: string;
  readonly recordKey: string;
}

// Params after validation and resolution
export interface ValidatedCurrentsParameters extends CurrentsRunParameters {
  readonly projectId: string;
  readonly cloudServiceUrl: string;
  readonly batchSize: number;
  readonly testingType: TestingType;
  readonly recordKey: string;
}
