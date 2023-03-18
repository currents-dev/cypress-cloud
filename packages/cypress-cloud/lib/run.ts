import Debug from "debug";
import { CurrentsRunParameters } from "../types";
import { createRun } from "./api";
import { cutInitialOutput } from "./capture";
import { getCI } from "./ciProvider";
import { getMergedConfig, validateParams } from "./config";
import { getGitInfo } from "./git";
import { setAPIBaseUrl, setRunId } from "./httpClient";
import { bold, divider, info, spacer, title } from "./log";
import { getPlatform } from "./platform";
import { summarizeTestResults } from "./results";
import { runTillDone } from "./runner";
import { getSpecFiles } from "./specMatcher";
import { summaryTable } from "./table";

const debug = Debug("currents:run");

export async function run(params: CurrentsRunParameters) {
  debug("run params %o", params);

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
  info("Discovered %d spec files", specs.length);
  info(
    `Tags: ${tag?.join(",") ?? false}; Group: ${group ?? false}; Parallel: ${
      parallel ?? false
    }; Batch Size: ${batchSize}`
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
  });

  info("🎥 Run URL:", bold(run.runUrl));

  setRunId(run.runId);

  cutInitialOutput();

  const results = await runTillDone(
    {
      runId: run.runId,
      groupId: run.groupId,
      machineId: run.machineId,
      platform,
      config,
    },
    validatedParams
  );

  divider();

  console.dir(results, { depth: null });
  const summary = summarizeTestResults(Object.values(results), config);

  title("white", "Cloud Run Finished");
  console.log(summaryTable(summary));
  info("🏁 Recorded Run:", bold(run.runUrl));

  spacer();
  return summary;
}
