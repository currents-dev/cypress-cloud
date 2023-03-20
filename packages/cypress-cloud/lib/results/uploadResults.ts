import { warn } from "../log";
import { setRunResult } from "../state";

export async function getUploadResultsTask({
  spec,
  runResult,
  stdout,
}: {
  spec: string;
  runResult: CypressCommandLine.CypressRunResult;
  stdout: string;
}) {
  const run = runResult.runs.find((r) => r.spec.relative === spec);
  if (!run) {
    warn('Cannot determine run result for spec "%s"', spec);
    return;
  }
  return setRunResult(run.spec.name, run, stdout);
}
