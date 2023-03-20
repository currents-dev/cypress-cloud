import Debug from "debug";
import {
  reportInstanceResultsMerged,
  setInstanceTests,
  SetInstanceTestsPayload,
  updateInstanceResults,
  UpdateInstanceResultsPayload,
} from "../api";
import { isCurrents } from "../env";
import { warn } from "../log";
import { setResults } from "../state";
const debug = Debug("currents:results");

export async function getUploadResultsTask({
  spec,
  runResult,
  output,
}: {
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
    {
      // replace the runs with the run for the specified spec
      ...runResult,
      runs: [run],
    },
    output
  );
}

export async function processCypressResults(
  results: CypressCommandLine.CypressRunResult,
  stdout: string
) {
  const run = results.runs[0];
  if (!run) {
    throw new Error("No run found in Cypress results");
  }
  return setResults(run.spec.name, run, stdout);
}

export async function uploadSpecResults(
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
