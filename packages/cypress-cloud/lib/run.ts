import "./init";

import Debug from "debug";
import { CurrentsRunParameters } from "../types";
import { createRun } from "./api";
import { cutInitialOutput } from "./capture";
import { getCI } from "./ciProvider";
import { getMergedConfig, isOffline, validateParams } from "./config";
import { runBareCypress } from "./cypress";
import { getGitInfo } from "./git";
import { setAPIBaseUrl, setRunId } from "./httpClient";
import { bold, divider, info, spacer, title } from "./log";
import { getPlatform } from "./platform";
import { summarizeTestResults, summaryTable } from "./results";
import { runTillDoneOrCancelled, summary, uploadTasks } from "./runner";
import { getSpecFiles } from "./specMatcher";

const debug = Debug("currents:run");

export async function run(params: CurrentsRunParameters = {}) {
  debug("run params %o", params);

  if (isOffline(params)) {
    info(`Skipping cloud orchestration because --record is set to false`);
    return runBareCypress(params);
  }
  const validatedParams = validateParams(params);
  setAPIBaseUrl(validatedParams.cloudServiceUrl);

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
  } = validatedParams;

  const config = await getMergedConfig(validatedParams);
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

  divider();

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
  });

  info("🎥 Run URL:", bold(run.runUrl));

  setRunId(run.runId);

  cutInitialOutput();

  await runTillDoneOrCancelled(
    {
      runId: run.runId,
      groupId: run.groupId,
      machineId: run.machineId,
      platform,
      config,
      specs,
    },
    validatedParams
  );

  divider();

  await Promise.allSettled(uploadTasks);
  const _summary = summarizeTestResults(Object.values(summary), config);

  title("white", "Cloud Run Finished");
  console.log(summaryTable(_summary));
  info("🏁 Recorded Run:", bold(run.runUrl));

  spacer();
  return _summary;
}
