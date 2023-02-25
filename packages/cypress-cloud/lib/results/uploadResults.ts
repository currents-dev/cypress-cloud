import Debug from "debug";
import { CypressRun } from "../../types";
import {
  reportInstanceResultsMerged,
  setInstanceTests,
  updateInstanceResults,
} from "../api";
import { uploadArtifacts, uploadStdoutSafe } from "../artifacts";
import { getInitialOutput } from "../capture";
import { isCurrents } from "../env";
import { warn } from "../log";
import { getInstanceResultPayload, getInstanceTestsPayload } from "./results";
const debug = Debug("currents:results");

export async function getUploadResultsTask({
  instanceId,
  spec,
  runResult,
  output,
}: {
  instanceId: string;
  spec: string;
  runResult: CypressCommandLine.CypressRunResult;
  output: string;
}) {
  const run = runResult.runs.find((r) => r.spec.relative === spec);
  if (!run) {
    warn('Cannot determine run result for spec "%s"', spec);
    return;
  }
  return processCypressResults(
    instanceId,
    {
      // replace the runs with the runs for the specified spec
      ...runResult,
      runs: [run],
    },
    output
  );
}

export async function processCypressResults(
  instanceId: string,
  results: CypressCommandLine.CypressRunResult,
  stdout: string
) {
  const runResult = results.runs[0];
  if (!runResult) {
    throw new Error("No run found in Cypress results");
  }
  const resultPayload = getInstanceResultPayload(runResult);
  debug("result payload %o", resultPayload);

  const { videoUploadUrl, screenshotUploadUrls } = await reportResults(
    instanceId,
    runResult,
    results.config
  );

  debug("instance %s artifact upload instructions %o", instanceId, {
    videoUploadUrl,
    screenshotUploadUrls,
  });

  await Promise.all([
    uploadArtifacts({
      videoUploadUrl,
      videoPath: runResult.video,
      screenshotUploadUrls,
      screenshots: resultPayload.screenshots,
    }),
    uploadStdoutSafe(instanceId, getInitialOutput() + stdout),
  ]);
}

async function reportResults(
  instanceId: string,
  run: CypressRun,
  config: Cypress.ResolvedConfigOptions
) {
  const resultPayload = getInstanceResultPayload(run);
  debug("result payload %o", resultPayload);

  if (isCurrents()) {
    return reportInstanceResultsMerged(instanceId, {
      tests: getInstanceTestsPayload(run, config),
      results: resultPayload,
    });
  }

  await setInstanceTests(instanceId, getInstanceTestsPayload(run, config));

  return updateInstanceResults(instanceId, resultPayload);
}
