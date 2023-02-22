export type TestingType = Cypress.TestingType;
export type SpecType = "component" | "integration";

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
  failed: number;
  skipped: number;
  passed: number;
  total: number;
}

export type SummaryResults = Record<
  string,
  CypressCommandLine.CypressRunResult
>;

// All the cypress flags without cloud-related flags. We explicitly filter them out to avoid confusion and prevent accidental usage
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

// The parameters Currents accepts via its run API.
// Explicitly add cloud-related parameters to avoid confusion with CypressModuleAPIRunOptions
export type CurrentsRunParameters = StrippedCypressModuleAPIOptions & {
  parallel?: boolean;
  ciBuildId?: string;
  group?: string;
  testingType: TestingType;
  record: boolean;
  env?: Record<string, unknown>;
  spec?: string[];
  tag?: string[];

  /**  The record key to use */
  key: string;

  /** The project ID to use. If not specified, will use the projectId from currents.config.js or process.env.CURRENTS_PROJECT_ID */
  projectId: string;

  /** The batch size defines how many spec files will be served in one orchestration "batch". If not specified, will use the projectId from currents.config.js, the default value is 3 */
  batchSize: number;
};
