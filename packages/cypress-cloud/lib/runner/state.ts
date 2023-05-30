import { SummaryResult } from "cypress-cloud/types";
import { warn } from "../log";
export const summary: SummaryResult = {};
export const uploadTasks: Promise<any>[] = [];

type InstanceId = string;
type InstanceExecutionState = {
  spec: string;
  output?: string;
  instanceId?: string;
  specBefore?: Date;
  createdAt: Date;
  instanceResults?: unknown;
  instanceResultsReportedAt?: Date;
  specAfter?: Date;
  specAfterResults?: unknown;
};
export const executionState: Record<InstanceId, InstanceExecutionState> = {};

function getExecutionStateSpec(spec: string) {
  return Object.values(executionState).find((i) => i.spec === spec);
}

export const setSpecBefore = (spec: string) => {
  const i = getExecutionStateSpec(spec);
  if (!i) {
    warn('Cannot find execution state for spec "%s"', spec);
    return;
  }

  i.specBefore = new Date();
};

export const setSpecAfter = (spec: string, results: unknown) => {
  const i = getExecutionStateSpec(spec);
  if (!i) {
    warn('Cannot find execution state for spec "%s"', spec);
    return;
  }
  i.specAfter = new Date();
  i.specAfterResults = results;
};

export const setInstanceResults = (instanceId: string, results: unknown) => {
  const i = executionState[instanceId];
  if (!i) {
    warn('Cannot find execution state for instance "%s"', instanceId);
    return;
  }
  i.instanceResults = results;
  i.instanceResultsReportedAt = new Date();
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
    (i) => i.spec === spec && i.instanceResults
  );
};
