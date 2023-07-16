import {
  SpecWithRelativeRoot,
  ValidatedCurrentsParameters,
} from "cypress-cloud/types";
import path from "path";
import { getCapturedOutput, resetCapture } from "../capture";
import { getCypressRunResultForSpec } from "../results";

import Debug from "debug";
import {
  createBatchedInstances,
  createInstance,
  CreateInstancePayload,
  InstanceResponseSpecDetails,
} from "../api";

import { runSpecFilesSafe, runSpecFilesSafeWithRetry } from "../cypress";
import { isCurrents } from "../env";
import { notEmpty } from "../lang";
import { divider, info, title } from "../log";
import { ConfigState, ExecutionState } from "../state";
import { createReportTask, reportTasks } from "./reportTask";

const debug = Debug("currents:runner");

export async function runTillDone(
  executionState: ExecutionState,
  configState: ConfigState,
  {
    runId,
    groupId,
    machineId,
    platform,
    specs: allSpecs,
  }: CreateInstancePayload & {
    specs: SpecWithRelativeRoot[];
  },
  params: ValidatedCurrentsParameters
) {
  let hasMore = true;

  while (hasMore) {
    const newTasks = await runBatch(executionState, configState, {
      runMeta: {
        runId,
        groupId,
        machineId,
        platform,
      },
      allSpecs,
      params,
    });
    if (!newTasks.length) {
      debug("No more tasks to run. Uploads queue: %d", reportTasks.length);
      hasMore = false;
      break;
    }
    newTasks.forEach((t) =>
      createReportTask(configState, executionState, t.instanceId)
    );
  }
}

async function runBatch(
  executionState: ExecutionState,
  configState: ConfigState,
  {
    runMeta,
    params,
    allSpecs,
  }: {
    runMeta: {
      runId: string;
      groupId: string;
      machineId: string;
      platform: CreateInstancePayload["platform"];
    };
    allSpecs: SpecWithRelativeRoot[];
    params: ValidatedCurrentsParameters;
  }
) {
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

  /**
   * Batch can have multiple specs. While running the specs,
   * cypress can hard-crash without reporting any result.
   *
   * When crashed, ideally, we need to:
   * - determine which spec crashed
   * - associate the crash with the spec
   * - run the rest of unreported specs in the batch
   *
   * But detecting the crashed spec is error-prone and inaccurate,
   * so we fall back to reporting hard crash for all subsequent
   * specs in the batch.
   *
   * Worst-case scenario: we report hard crash for all specs in the batch.
   *
   * UPDATE July 15: We now have a better way to detect crashed specs via spec:before
   */

  batch.specs.forEach((i) =>
    executionState.initInstance({
      ...i,
      spec:
        allSpecs.find((s) => s.relative === i.spec) ??
        getFakeSpecDescriptor(i.spec),
    })
  );

  divider();
  info(
    "Running: %s (%d/%d)",
    batch.specs.map((s) => s.spec).join(", "),
    batch.claimedInstances,
    batch.totalInstances
  );

  function getRawResult() {
    const specRetries = params.experimentalSpecRetries;
    if (!!specRetries) {
      return runSpecFilesSafeWithRetry(
        configState,
        executionState,
        batch.specs
          .map((bs) => allSpecs.find((i) => i.relative === bs.spec))
          .filter(notEmpty),
        params
      );
    }
    return runSpecFilesSafe(
      batch.specs
        .map((bs) => allSpecs.find((i) => i.relative === bs.spec))
        .filter(notEmpty),
      params
    );
  }
  const rawResult = await getRawResult();

  title("blue", "Reporting results and artifacts in background...");

  const output = getCapturedOutput();

  batch.specs.forEach((spec) => {
    executionState.setInstanceOutput(spec.instanceId, output);
    if (!rawResult) {
      return;
    }
    const specRunResult = getCypressRunResultForSpec(spec.spec, rawResult);
    if (!specRunResult) {
      return;
    }
    executionState.setInstanceResult(spec.instanceId, specRunResult);
  });

  resetCapture();

  return batch.specs;
}

function getFakeSpecDescriptor(spec: string) {
  return {
    relative: spec,
    absolute: spec,
    relativeToCommonRoot: spec,
    specFileExtension: path.extname(spec),
    fileExtension: path.extname(spec),
    baseName: path.basename(spec),
    fileName: path.basename(spec),
    name: path.basename(spec),
    specType: "integration" as const,
  };
}
