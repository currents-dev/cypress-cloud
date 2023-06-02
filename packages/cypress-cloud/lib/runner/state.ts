import { CypressRun, InstanceId } from "cypress-cloud/types";
import Debug from "debug";
import { error, warn } from "../log";
import { getFailedDummyResult, getFakeTestFromException } from "../results";
import { specResultsToCypressResults } from "./mapResult";
import { SpecResult } from "./spec.type";

const debug = Debug("currents:state");

// Careful here - it is a global mutable state 🐲
type InstanceExecutionState = {
  instanceId: InstanceId;
  spec: string;
  output?: string;
  specBefore?: Date;
  createdAt: Date;
  runResults?: CypressCommandLine.CypressRunResult;
  runResultsReportedAt?: Date;
  specAfter?: Date;
  specAfterResults?: SpecResult;
  reportStartedAt?: Date;
};

const executionState: Record<InstanceId, InstanceExecutionState> = {};

export const getExecutionStateResults = () =>
  Object.values(executionState).map((i) => getInstanceResults(i.instanceId));

export const getExecutionStateSpec = (spec: string) =>
  Object.values(executionState).find((i) => i.spec === spec);

export const getExecutionStateInstance = (instanceId: InstanceId) =>
  executionState[instanceId];

export const initExecutionState = ({
  spec,
  instanceId,
}: {
  instanceId: string;
  spec: string;
}) => {
  executionState[instanceId] = {
    spec,
    instanceId,
    createdAt: new Date(),
  };
};

export const setSpecBefore = (spec: string) => {
  const i = getExecutionStateSpec(spec);
  if (!i) {
    warn('Cannot find execution state for spec "%s"', spec);
    return;
  }

  i.specBefore = new Date();
};

export const setSpecAfter = (spec: string, results: SpecResult) => {
  const i = getExecutionStateSpec(spec);
  if (!i) {
    warn('Cannot find execution state for spec "%s"', spec);
    return;
  }
  i.specAfter = new Date();
  i.specAfterResults = results;
};

export const setInstanceResult = (
  instanceId: string,
  results: CypressCommandLine.CypressRunResult
) => {
  const i = executionState[instanceId];
  if (!i) {
    warn('Cannot find execution state for instance "%s"', instanceId);
    return;
  }
  i.runResults = results;
  i.runResultsReportedAt = new Date();
};

export const setSpecOutput = (spec: string, output: string) => {
  const i = getExecutionStateSpec(spec);
  if (!i) {
    warn('Cannot find execution state for spec "%s"', spec);
    return;
  }
  setInstanceOutput(i.instanceId, output);
};

export const setInstanceOutput = (instanceId: string, output: string) => {
  const i = executionState[instanceId];
  if (!i) {
    warn('Cannot find execution state for instance "%s"', instanceId);
    return;
  }
  if (i.output) {
    debug('Instance "%s" already has output', instanceId);
    return;
  }
  i.output = output;
};

export const hasResultsForSpec = (spec: string) => {
  return Object.values(executionState).some(
    (i) => i.spec === spec && i.runResults
  );
};

export const getInstanceResults = (
  instanceId: string
): CypressCommandLine.CypressRunResult => {
  const i = getExecutionStateInstance(instanceId);

  if (!i) {
    error('Cannot find execution state for instance "%s"', instanceId);

    return getFailedDummyResult({
      specs: ["unknown"],
      error: "Cannot find execution state for instance",
    });
  }

  // use spec:after results - it can become available before run results
  if (i.specAfterResults) {
    return backfillException(specResultsToCypressResults(i.specAfterResults));
  }

  if (i.runResults) {
    return backfillException(i.runResults);
  }

  debug('No results detected for "%s"', i.spec);
  return getFailedDummyResult({
    specs: [i.spec],
    error: `No results detected for the spec file. That usually happens because of cypress crash. See the console output for details.`,
  });
};

const backfillException = (result: CypressCommandLine.CypressRunResult) => {
  return {
    ...result,
    runs: result.runs.map(backfillExceptionRun),
  };
};

const backfillExceptionRun = (run: CypressRun) => {
  if (!run.error) {
    return run;
  }

  return {
    ...run,
    tests: [getFakeTestFromException(run.error, run.stats)],
  };
};

let _config: Cypress.ResolvedConfigOptions | undefined = undefined;
export const setConfig = (c: typeof _config) => (_config = c);
export const getConfig = () => _config;
