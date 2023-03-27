import { SummaryResult, ValidatedCurrentsParameters } from "../types";
import { getCapturedOutput, resetCapture } from "./capture";
import { MergedConfig } from "./config";

import {
  getSummaryForSpec,
  getUploadResultsTask,
  normalizeRawResult,
} from "./results";

import Debug from "debug";
import {
  createBatchedInstances,
  createInstance,
  CreateInstancePayload,
  InstanceResponseSpecDetails,
} from "./api";

import { runSpecFileSafe } from "./cypress";
import { isCurrents } from "./env";
import { BPromise } from "./lang";
import { divider, error, info, title, warn } from "./log";
import { Event, pubsub } from "./pubsub";

const debug = Debug("currents:runner");

export const summary: SummaryResult = {};
export const uploadTasks: Promise<any>[] = [];

export async function runTillDoneOrCancelled(
  ...args: Parameters<typeof runTillDone>
) {
  return new Promise((_resolve, _reject) => {
    const execTask = new BPromise((resolve, reject, onCancel) => {
      if (!onCancel) {
        _reject(new Error("BlueBird is misconfigured: onCancel is undefined"));
        return;
      }
      onCancel(() => _reject());
      runTillDone(...args).then(
        () => {
          _resolve(summary);
          resolve();
        },
        () => {
          _reject();
          reject();
        }
      );
    }).finally(() => {
      pubsub.removeListener(Event.RUN_CANCELLED, onRunCancelled);
    });

    function onRunCancelled(reason: string) {
      warn(
        `Run cancelled: %s. Waiting for uploads to complete and stopping execution...`,
        reason
      );
      execTask.cancel();
    }
    pubsub.addListener(Event.RUN_CANCELLED, onRunCancelled);
  })
    .catch(() => {})
    .finally(() => {});
}

export async function runTillDone(
  {
    runId,
    groupId,
    machineId,
    platform,
    config,
  }: CreateInstancePayload & {
    config: MergedConfig;
  },
  params: ValidatedCurrentsParameters
) {
  let hasMore = true;

  while (hasMore) {
    const newTasks = await runBatch({
      runMeta: {
        runId,
        groupId,
        machineId,
        platform,
      },
      params,
      config,
    });
    if (!newTasks.length) {
      debug("No more tasks to run. Uploads queue: %d", uploadTasks.length);
      hasMore = false;
      break;
    }
    newTasks.forEach((task) => {
      if (task.summary.specSummary) {
        summary[task.summary.spec] = task.summary.specSummary;
      }
      uploadTasks.push(task.uploadTasks);
    });
  }
}

async function runBatch({
  runMeta,
  config,
  params,
}: {
  runMeta: {
    runId: string;
    groupId: string;
    machineId: string;
    platform: CreateInstancePayload["platform"];
  };
  config: MergedConfig;
  params: ValidatedCurrentsParameters;
}) {
  let batch = {
    specs: [] as InstanceResponseSpecDetails[],
    claimedInstances: 0,
    totalInstances: 0,
  };

  if (isCurrents()) {
    debug("Getting batched tasks: %d", params.batchSize);
    batch = await createBatchedInstances({
      ...runMeta,
      batchSize: params.batchSize,
    });
    debug("Got batched tasks: %o", batch);
  } else {
    const response = await createInstance(runMeta);

    if (response.spec !== null && response.instanceId !== null) {
      batch.specs.push({
        spec: response.spec,
        instanceId: response.instanceId,
      });
    }
    batch.claimedInstances = response.claimedInstances;
    batch.totalInstances = response.totalInstances;
  }

  if (batch.specs.length === 0) {
    return [];
  }

  divider();
  info(
    "Running: %s (%d/%d)",
    batch.specs.map((s) => s.spec).join(", "),
    batch.claimedInstances,
    batch.totalInstances
  );

  const rawResult = await runSpecFileSafe(
    { spec: batch.specs.map((s) => s.spec).join(",") },
    params
  );
  const normalizedResult = normalizeRawResult(
    rawResult,
    batch.specs.map((s) => s.spec),
    config
  );

  title("blue", "Reporting results and artifacts in background...");

  const output = getCapturedOutput();
  resetCapture();

  const batchResult = batch.specs.map((spec) => {
    const specSummary = getSummaryForSpec(spec.spec, normalizedResult);
    if (!specSummary) {
      warn('Cannot find run result for spec "%s"', spec.spec);
    }

    return {
      summary: {
        spec: spec.spec,
        specSummary,
      },
      uploadTasks: getUploadResultsTask({
        ...spec,
        runResult: normalizedResult,
        output,
      }).catch(error),
    };
  });

  return batchResult;
}
