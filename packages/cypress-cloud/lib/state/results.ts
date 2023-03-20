import { InstanceResponseSpecDetails } from "../api";
import { uploadArtifacts, uploadStdoutSafe } from "../artifacts";
import { bus } from "../bus";
import { warn } from "../log";
import { SpecResult } from "../result.types";
import {
  getInstanceResultPayload,
  getInstanceTestsPayload,
  uploadSpecResults,
} from "../results";

const instanceIds: Map<string, string> = new Map();
let config: Cypress.ResolvedConfigOptions | null = null;

const results: Map<string, any> = new Map();

export function setResults(
  spec: string,
  // CypressCommandLine.RunResult is from `run`
  // InstanceResult is from `spec:after`
  result: CypressCommandLine.RunResult | SpecResult,
  stdout: string
) {
  // summary table is manager by batched results processor
  const instanceResult = getInstanceResultPayload(result);
  const instanceTests = getInstanceTestsPayload(result, config);
  if (results.has(spec)) {
    warn('Results for spec "%s" were already sent', spec);
    return;
  }
  const instanceId = getInstanceId(spec);

  if (!instanceId) {
    warn('Cannot determine instance ID for spec "%s"', spec);
    return;
  }

  warn('Uploading results for spec "%s"', spec);
  const uploadTask = uploadSpecResults(
    instanceId,
    instanceTests,
    instanceResult
  ).then(({ videoUploadUrl, screenshotUploadUrls }) =>
    Promise.allSettled([
      uploadArtifacts({
        videoUploadUrl,
        videoPath: result.video,
        screenshotUploadUrls,
        screenshots: instanceResult.screenshots,
      }),
      uploadStdoutSafe(instanceId, stdout),
    ])
  );

  results.set(spec, {
    instanceResult,
    instanceTests,
    uploadTask,
  });

  return uploadTask;
}

export function setInstanceIds(specs: InstanceResponseSpecDetails[]) {
  specs.forEach((spec) => {
    instanceIds.set(spec.spec, spec.instanceId);
  });
}

export function getInstanceId(spec: string) {
  return instanceIds.get(spec);
}

export function getExecutionConfig() {
  return config;
}

bus.on("currents:config", (_config) => {
  // @ts-ignore
  config = _config.config;
});
