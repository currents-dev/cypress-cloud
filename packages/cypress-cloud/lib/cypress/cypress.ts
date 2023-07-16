import cypress from "cypress";
import {
  CurrentsRunParameters,
  CypressResult,
  SpecWithRelativeRoot,
  ValidatedCurrentsParameters,
} from "cypress-cloud/types";
import Debug from "debug";
import _ from "lodash";
import pidtree from "pidtree";
import { getCypressRunAPIParams } from "../config";
import { safe } from "../lang";
import { divider, info, warn } from "../log";
import { pubsub } from "../pubsub";
import { ConfigState, ExecutionState } from "../state";
import { getWSSPort } from "../ws";

const debug = Debug("currents:cypress");

export function runBareCypress(params: CurrentsRunParameters = {}) {
  // revert currents params to cypress params
  // exclude record mode params
  const p = {
    ...params,
    ciBuildId: undefined,
    tag: undefined,
    parallel: undefined,
    record: false,
    group: undefined,
    spec: _.flatten(params.spec).join(","),
  };
  debug("Running bare Cypress with params %o", p);
  return cypress.run(p);
}

/**
 * Run Cypress tests, we need to pass down the stripped options as if we've received them from the CLI
 */
export async function runSpecFile(
  spec: SpecWithRelativeRoot[],
  cypressRunOptions: ValidatedCurrentsParameters
) {
  const runAPIOptions = getCypressRunAPIParams(cypressRunOptions);

  const options = {
    ...runAPIOptions,
    config: {
      ...runAPIOptions.config,
      trashAssetsBeforeRuns: false,
    },
    env: {
      ...runAPIOptions.env,
      currents_ws: getWSSPort(),
    },
    spec: spec.map((s) => s.absolute).join(","),
  };

  debug("running cypress with options %o", options);

  pubsub.once(
    "currents:spec:retry",
    ({ spec, timeout }: { spec: SpecWithRelativeRoot; timeout: number }) => {
      divider();
      warn(
        `Terminating spec %s after timeout of %s seconds`,
        spec.absolute,
        timeout
      );
      terminateChildProcesses();
    }
  );

  const result = await cypress.run(options);

  if (result.status === "failed") {
    warn('Cypress runner failed with message: "%s"', result.message);
    warn(
      "The following spec files will be marked as failed: %s",
      spec.map((i) => `\n - ${i.absolute}`).join("")
    );
  }
  debug("cypress run result %o", result);
  return result;
}

export const runSpecFilesSafe = (
  spec: SpecWithRelativeRoot[],
  cypressRunOptions: ValidatedCurrentsParameters
): Promise<CypressResult> =>
  safe(
    runSpecFile,
    (error) => {
      const message = `Cypress runnner crashed with an error:\n${
        (error as Error).message
      }\n${(error as Error).stack}}`;

      debug("cypress run exception %o", error);
      if (!isTimeoutError(message)) {
        warn('Cypress runner crashed: "%s"', message);
        warn(
          "The following spec files will be marked as failed: %s",
          spec.map((i) => `\n - ${i.absolute}`).join("")
        );
      }

      return {
        status: "failed" as const,
        failures: 1,
        message,
      };
    },
    () => {}
  )(spec, cypressRunOptions);

export const runSpecFilesSafeWithRetry = async (
  configState: ConfigState,
  executionState: ExecutionState,
  specs: SpecWithRelativeRoot[],
  cypressRunOptions: ValidatedCurrentsParameters,
  currentRetry: number = 0
): Promise<CypressResult | null> => {
  const retryLimit = configState.getSpecRetryLimit();
  if (!_.isNumber(retryLimit)) {
    throw new Error(
      "running runSpecFilesSafeWithRetry with non-numeric retryLimit"
    );
  }

  const specsToRun = specs
    .filter(
      // don't run specs that already reported their results
      (s) => !executionState.hasSpecAfterResults(s.relative)
    )
    .filter((s) => executionState.getSpecTimeouts(s.relative) < retryLimit + 1)
    .map((s) => {
      executionState.incrementExecutionsCount(s.relative);
      return s;
    });

  debug(
    "Batch specs:",
    specs.map((s) => s.absolute)
  );

  debug(
    "Specs to run:",
    specsToRun.map((s) => s.absolute)
  );

  if (!specsToRun.length) {
    return null;
  }

  const results = await runSpecFilesSafe(specsToRun, cypressRunOptions);

  if (results.status === "failed" && isTimeoutError(results.message)) {
    info("Spec execution failed because of timeout");

    return runSpecFilesSafeWithRetry(
      configState,
      executionState,
      specs,
      cypressRunOptions,
      currentRetry + 1
    );
  }

  return results;
};

function isTimeoutError(message: string) {
  return message.includes("SIGKILL");
}

async function terminateChildProcesses() {
  const pids = await pidtree(process.pid);
  pids.forEach((pid) => {
    debug('Sending SIGKILL to "%d"', pid);
    try {
      process.kill(pid, "SIGKILL");
    } catch (e) {
      // ignore
    }
  });
}
