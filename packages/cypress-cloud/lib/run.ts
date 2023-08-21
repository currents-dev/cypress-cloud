import "./init";

import Debug from "debug";
import { getLegalNotice } from "../legal";
import { CurrentsRunParameters } from "../types";
import { createRun } from "./api";
import { cutInitialOutput, getCapturedOutput } from "./capture";
import { getCI } from "./ciProvider";
import {
  getMergedConfig,
  isOffline,
  preprocessParams,
  validateParams,
} from "./config";
import { runBareCypress } from "./cypress";
import { activateDebug } from "./debug";
import { isCurrents } from "./env";
import { getGitInfo } from "./git";
import { setAPIBaseUrl, setRunId } from "./httpClient";
import { bold, divider, info, spacer, title } from "./log";
import { getPlatform } from "./platform";
import { pubsub } from "./pubsub";
import { summarizeTestResults, summaryTable } from "./results";
import {
  createReportTaskSpec,
  reportTasks,
  runTillDoneOrCancelled,
} from "./runner";
import { shutdown } from "./shutdown";
import { getSpecFiles } from "./specMatcher";
import { ConfigState, ExecutionState } from "./state";
import { startWSS } from "./ws";
import { getCoverageFilePath } from "./coverage";

const debug = Debug("currents:run");

export async function run(params: CurrentsRunParameters = {}) {
  const executionState = new ExecutionState();
  const configState = new ConfigState();
  activateDebug(params.cloudDebug);
  debug("run params %o", params);
  params = preprocessParams(params);
  debug("params after preprocess %o", params);

  if (isOffline(params)) {
    info(`Skipping cloud orchestration because --record is set to false`);
    return runBareCypress(params);
  }

  const validatedParams = await validateParams(params);
  setAPIBaseUrl(validatedParams.cloudServiceUrl);

  if (!isCurrents()) {
    console.log(getLegalNotice());
  }

  const {
    recordKey,
    projectId,
    group,
    parallel,
    ciBuildId,
    tag,
    testingType,
    batchSize,
    autoCancelAfterFailures,
    experimentalCoverageRecording,
  } = validatedParams;

  const config = await getMergedConfig(validatedParams);
  configState.setConfig(config?.resolved);

  const { specs, specPattern } = await getSpecFiles({
    config,
    params: validatedParams,
  });

  if (specs.length === 0) {
    return;
  }

  const platform = await getPlatform({
    config,
    browser: validatedParams.browser,
  });

  info("Discovered %d spec files", specs.length);
  info(
    `Tags: ${tag.length > 0 ? tag.join(",") : false}; Group: ${
      group ?? false
    }; Parallel: ${parallel ?? false}; Batch Size: ${batchSize}`
  );
  info("Connecting to cloud orchestration service...");

  const run = await createRun({
    ci: getCI(ciBuildId),
    specs: specs.map((spec) => spec.relative),
    commit: await getGitInfo(config.projectRoot),
    group,
    platform,
    parallel: parallel ?? false,
    ciBuildId,
    projectId,
    recordKey,
    specPattern: [specPattern].flat(2),
    tags: tag,
    testingType,
    batchSize,
    autoCancelAfterFailures,
    coverageEnabled: experimentalCoverageRecording,
  });

  setRunId(run.runId);
  info("🎥 Run URL:", bold(run.runUrl));
  cutInitialOutput();

  await startWSS();
  listenToSpecEvents(
    configState,
    executionState,
    config.experimentalCoverageRecording
  );

  await runTillDoneOrCancelled(
    executionState,
    configState,
    {
      runId: run.runId,
      groupId: run.groupId,
      machineId: run.machineId,
      platform,
      specs,
    },
    validatedParams
  );

  divider();

  await Promise.allSettled(reportTasks);
  const _summary = summarizeTestResults(
    executionState.getResults(configState),
    config
  );

  title("white", "Cloud Run Finished");
  console.log(summaryTable(_summary));
  info("🏁 Recorded Run:", bold(run.runUrl));

  await shutdown();

  spacer();
  if (_summary.status === "finished") {
    return {
      ..._summary,
      runUrl: run.runUrl,
    };
  }

  return _summary;
}

function listenToSpecEvents(
  configState: ConfigState,
  executionState: ExecutionState,
  experimentalCoverageRecording?: boolean
) {
  const config = configState.getConfig();
  pubsub.on("before:spec", async ({ spec }: { spec: Cypress.Spec }) => {
    debug("before:spec %o", spec);
    executionState.setSpecBefore(spec.relative);
  });

  pubsub.on(
    "after:spec",
    async ({ spec, results }: { spec: Cypress.Spec; results: any }) => {
      debug("after:spec %o %o", spec, results);
      executionState.setSpecAfter(spec.relative, results);
      executionState.setSpecOutput(spec.relative, getCapturedOutput());
      if (experimentalCoverageRecording) {
        const coverageFilePath = await getCoverageFilePath(
          config?.env?.coverageFile
        );
        if (coverageFilePath) {
          executionState.setSpecCoverage(spec.relative, coverageFilePath);
        }
      }
      createReportTaskSpec(configState, executionState, spec.relative);
    }
  );
}
