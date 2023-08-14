import Debug from "debug";
import {
  reportInstanceResultsMerged,
  setInstanceTests,
  SetInstanceTestsPayload,
  updateInstanceResults,
  UpdateInstanceResultsPayload,
} from "../api";
import { uploadArtifacts, uploadStdoutSafe } from "../artifacts";
import { setCancellationReason } from "../cancellation";
import { getInitialOutput } from "../capture";
import { isCurrents } from "../env";
import { getInstanceResultPayload, getInstanceTestsPayload } from "./results";
const debug = Debug("currents:results");

export async function getReportResultsTask(
  instanceId: string,
  results: CypressCommandLine.CypressRunResult,
  stdout: string,
  coverageFilePath?: string
) {
  const run = results.runs[0];
  if (!run) {
    throw new Error("No run found in Cypress results");
  }
  const instanceResults = getInstanceResultPayload(run, coverageFilePath);
  const instanceTests = getInstanceTestsPayload(run, results.config);
  const { videoUploadUrl, screenshotUploadUrls, coverageUploadUrl, cloud } =
    await reportResults(instanceId, instanceTests, instanceResults);

  if (cloud?.shouldCancel) {
    debug("instance %s should cancel", instanceId);
    setCancellationReason(cloud.shouldCancel);
  }

  debug("instance %s artifact upload instructions %o", instanceId, {
    videoUploadUrl,
    screenshotUploadUrls,
    coverageUploadUrl,
  });

  return Promise.all([
    uploadArtifacts({
      videoUploadUrl,
      videoPath: run.video,
      screenshotUploadUrls,
      screenshots: instanceResults.screenshots,
      coverageUploadUrl,
      coverageFilePath,
    }),
    uploadStdoutSafe(instanceId, getInitialOutput() + stdout),
  ]);
}

async function reportResults(
  instanceId: string,
  instanceTests: SetInstanceTestsPayload,
  instanceResults: UpdateInstanceResultsPayload
) {
  debug("reporting instance %s results...", instanceId);
  if (isCurrents()) {
    return reportInstanceResultsMerged(instanceId, {
      tests: instanceTests,
      results: instanceResults,
    });
  }

  // run one after another
  await setInstanceTests(instanceId, instanceTests);
  return updateInstanceResults(instanceId, instanceResults);
}
