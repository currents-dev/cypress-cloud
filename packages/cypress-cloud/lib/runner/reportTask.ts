import { InstanceId } from "cypress-cloud/types";
import Debug from "debug";
import { error } from "../log";
import { getReportResultsTask } from "../results";
import {
  getExecutionStateInstance,
  getExecutionStateSpec,
  getInstanceResults,
} from "./state";

const debug = Debug("currents:reportTask");

export const reportTasks: Promise<any>[] = [];

export const createReportTask = (instanceId: InstanceId) => {
  const executionState = getExecutionStateInstance(instanceId);
  if (!executionState) {
    error("Cannot find execution state for instance %s", instanceId);
    return;
  }
  if (executionState.reportStartedAt) {
    debug("Report task already created for instance %s", instanceId);
    return;
  }

  executionState.reportStartedAt = new Date();

  reportTasks.push(
    getReportResultsTask(
      instanceId,
      getInstanceResults(instanceId),
      executionState.output ?? "no output captured"
    ).catch(error)
  );
};

export const createReportTaskSpec = (spec: string) => {
  const i = getExecutionStateSpec(spec);
  if (!i) {
    error("Cannot find execution state for spec %s", spec);
    return;
  }
  return createReportTask(i.instanceId);
};
