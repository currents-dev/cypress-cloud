import {
  SpecWithRelativeRoot,
  ValidatedCurrentsParameters,
} from "cypress-cloud/types";
import { getCapturedOutput, resetCapture } from "../capture";

import { getCypressRunResultForSpec } from "../results";

import Debug from "debug";
import {
  createBatchedInstances,
  createInstance,
  CreateInstancePayload,
  InstanceResponseSpecDetails,
} from "../api";

import { runSpecFileSafe } from "../cypress";
import { isCurrents } from "../env";
import { divider, info, title, warn } from "../log";
import { createReportTask, reportTasks } from "./reportTask";
import {
  initExecutionState,
  setInstanceOutput,
  setInstanceResult,
} from "./state";

const debug = Debug("currents:runner");

export async function runTillDone(
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
    const newTasks = await runBatch({
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
    newTasks.forEach((t) => createReportTask(t.instanceId));
  }
}

async function runBatch({
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
   * so we fall back to reporting hard crash to all subsequent
   * specs in the batch.
   *
   * Worst-case scenario: we report hard crash to all specs in the batch.
   */

  // %state
  batch.specs.forEach(initExecutionState);

  divider();
  info(
    "Running: %s (%d/%d)",
    batch.specs.map((s) => s.spec).join(", "),
    batch.claimedInstances,
    batch.totalInstances
  );

  const rawResult = await runSpecFileSafe(
    {
      // use absolute paths - user can run the program from a different directory, e.g. nx or a monorepo workspace
      // cypress still report the path relative to the project root
      spec: batch.specs
        .map((bs) => getSpecAbsolutePath(allSpecs, bs.spec))
        .join(","),
    },
    params
  );

  title("blue", "Reporting results and artifacts in background...");

  const output = getCapturedOutput();

  // %state
  batch.specs.forEach((spec) => {
    setInstanceOutput(spec.instanceId, output);
    const specRunResult = getCypressRunResultForSpec(spec.spec, rawResult);

    if (!specRunResult) {
      return;
    }
    setInstanceResult(spec.instanceId, specRunResult);
  });

  resetCapture();

  return batch.specs;
}

function getSpecAbsolutePath(
  allSpecs: SpecWithRelativeRoot[],
  relative: string
) {
  const absolutePath = allSpecs.find((i) => i.relative === relative)?.absolute;
  if (!absolutePath) {
    warn(
      'Cannot find absolute path for spec. Spec: "%s", candidates: %o',
      relative,
      allSpecs
    );
    throw new Error(`Cannot find absolute path for spec`);
  }
  return absolutePath;
}
