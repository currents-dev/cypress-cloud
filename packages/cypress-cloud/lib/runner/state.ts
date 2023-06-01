import { error, warn } from "../log";
import { getFailedDummyResult } from "../results";
import { specResultsToCypressResults } from "./mapResult";
import { SpecResult } from "./spec.type";

export const reportTasks: Promise<any>[] = [];

type InstanceId = string;
type InstanceExecutionState = {
  instanceId: string;
  spec: string;
  output?: string;
  specBefore?: Date;
  createdAt: Date;
  runResults?: CypressCommandLine.CypressRunResult;
  runResultsReportedAt?: Date;
  specAfter?: Date;
  specAfterResults?: SpecResult;
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

export const setInstanceOutput = (instanceId: string, output: string) => {
  const i = executionState[instanceId];
  if (!i) {
    warn('Cannot find execution state for instance "%s"', instanceId);
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
      error: "cypress-cloud: Cannot find execution state for instance",
      config: {},
    });
  }

  if (i.specAfterResults) {
    return specResultsToCypressResults(i.specAfterResults);
  }
  if (i.runResults) {
    return i.runResults;
  }

  return getFailedDummyResult({
    specs: [i.spec],
    error: "cypress-cloud: Cannot find execution state for instance",
    config: {},
  });
};
