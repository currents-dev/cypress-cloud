import { InstanceId } from "cypress-cloud/types";
import Debug from "debug";
import { error } from "../log";
import { getReportResultsTask } from "../results";
import { ConfigState, ExecutionState } from "../state";

const debug = Debug("currents:reportTask");

export const reportTasks: Promise<any>[] = [];

export const createReportTask = (
  configState: ConfigState,
  executionState: ExecutionState,
  instanceId: InstanceId
) => {
  const instance = executionState.getInstance(instanceId);
  if (!instance) {
    error("Cannot find execution state for instance %s", instanceId);
    return;
  }
  if (instance.reportStartedAt) {
    debug("Report task already created for instance %s", instanceId);
    return;
  }

  instance.reportStartedAt = new Date();

  debug("Creating report task for instanceId %s", instanceId);
  reportTasks.push(
    getReportResultsTask(
      instanceId,
      executionState.getInstanceResults(configState, instanceId),
      instance.output ?? "no output captured"
    ).catch(error)
  );
};

export const createReportTaskSpec = (
  configState: ConfigState,
  executionState: ExecutionState,
  specRelative: string
) => {
  const i = executionState.getSpecRelative(specRelative);
  if (!i) {
    error("Cannot find execution state for spec %s", specRelative);
    return;
  }
  debug("Creating report task for spec %s", specRelative);
  return createReportTask(configState, executionState, i.instanceId);
};
