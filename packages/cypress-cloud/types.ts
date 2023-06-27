export type InstanceId = string;
export type TestingType = Cypress.TestingType;
export type SpecType = "component" | "integration";
export type ArrayItemType<T> = T extends (infer U)[] ? U : T;
export type NonEmptyArray<T> = [T, ...T[]];

export type CypressRun = ArrayItemType<
  CypressCommandLine.CypressRunResult["runs"]
>;
export type CypressTest = ArrayItemType<CypressRun["tests"]>;
export type CypressTestAttempt = ArrayItemType<CypressTest["attempts"]>;
export type CypressScreenshot = ArrayItemType<
  CypressTestAttempt["screenshots"]
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

// Explicitly filter cypress record-related flags - prevent triggering recording mode to avoid confusion
export type StrippedCypressModuleAPIOptions = Omit<
  Partial<CypressCommandLine.CypressRunOptions>,
  | "autoCancelAfterFailures"
  | "tag"
  | "spec"
  | "exit"
  | "headed"
  | "record"
  | "headless"
  | "noExit"
  | "parallel"
  | "key"
  | "tag"
  | "group"
  | "ciBuildId"
  | "cloudConfigFile"
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

  /** Whether to activate record mode and connect to cloud orchestration service */
  record?: boolean;

  /** The URL of the currents server to use. If not specified, will use the one from currents.config.js */
  cloudServiceUrl?: string;
  /** The environment variables to use for the run */
  env?: object;

  /** The group id to use for the run */
  group?: string;

  /**  The record key to use */
  recordKey?: string;

  /** Whether to run the spec files in parallel */
  parallel?: boolean;

  /** The project ID to use. */
  projectId?: string;

  /** Comma-separated string or an array of spec glob pattern for the execution */
  spec?: string | string[];

  /** Comma-separated string or an array of tags */
  tag?: string | string[];

  /** "e2e" or "component", the default value is "e2e" */
  testingType?: TestingType;

  /** Automatically abort the run after the specified number of failed tests. Overrides the default project settings. If set, must be a positive integer or "false" to disable (Currents-only) */
  autoCancelAfterFailures?: number | false;

  /**
   * Whether to launch cypress in headed mode. If set, must be a boolean, defaults to false.
   */
  headed?: boolean;

  /**
   * Configuration file name or absolute path. Default value is 'currents.config.js', if specified, must be a string. The file will be resolved relative to the project root, unless it's an absolute path.
   */
  cloudConfigFile?: string;
};

// User-facing `run` interface
// We can resolve the projectId and recordKey from different sources, so we can't really enforce them via the type definition
export interface CurrentsRunAPI extends CurrentsRunParameters {}

// Params after validation and resolution
export interface ValidatedCurrentsParameters extends CurrentsRunParameters {
  readonly projectId: string;
  readonly cloudServiceUrl: string;
  readonly batchSize: number;
  readonly testingType: TestingType;
  readonly recordKey: string;
  readonly tag: string[];
  readonly autoCancelAfterFailures: number | false | undefined;
}
