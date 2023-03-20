import { uploadArtifacts, uploadStdoutSafe } from "../artifacts";
import { warn } from "../log";
import { SpecResult } from "../result.types";
import { getInstanceResultPayload, getInstanceTestsPayload } from "../results";
import { getExecutionConfig } from "./config";
import { getInstanceId } from "./instances";

interface CachedResult {
  result: CypressCommandLine.RunResult;
  stdout: string;
}

const results: Map<string, CachedResult> = new Map();

export function setSpecResult(
  spec: string,
  result: SpecResult,
  stdout: string
) {
  results.set(spec, {
    result,
    stdout,
  });
}

export function setRunResult(
  spec: string,
  result: CypressCommandLine.RunResult,
  stdout: string
) {
  results.set(spec, {
    result,
    stdout,
  });
}

export function setResults(
  spec: string,
  // CypressCommandLine.RunResult is from `run`
  // InstanceResult is from `spec:after`
  result: CypressCommandLine.RunResult | SpecResult,
  stdout: string
) {
  // summary table is manager by batched results processor
  const instanceResult = getInstanceResultPayload(result);
  const instanceTests = getInstanceTestsPayload(result, getExecutionConfig());

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
