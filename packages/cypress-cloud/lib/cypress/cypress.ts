import cypress from "cypress";
import {
  CurrentsRunParameters,
  CypressResult,
  ValidatedCurrentsParameters,
} from "cypress-cloud/types";
import Debug from "debug";
import _ from "lodash";
import { getCurrentsConfig, getCypressRunAPIParams } from "../config";
import { safe } from "../lang";
import { warn } from "../log";
import { getWSSPort } from "../ws";
import { spawn } from "child_process";
import { readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const debug = Debug("currents:cypress");
interface RunCypressSpecFile {
  spec: string;
}

export async function runPlaywright(
  options?: any
): Promise<any> {
  const specs = options?.spec || [];
  const outputPath = join(tmpdir(), `playwright-results-${Date.now()}.json`);

  const args = ["test", ...specs, `--reporter=json`, `--output=${outputPath}`];

  return new Promise((resolve, reject) => {
    const proc = spawn("npx", ["playwright", ...args], {
      shell: true,
      stdio: "inherit",
    });

    proc.on("exit", (code) => {
      try {
        const raw = readFileSync(outputPath, "utf-8");
        const parsed = JSON.parse(raw);

        const total = parsed.suites?.reduce((acc: number, s: any) => acc + s.specs.length, 0) || 0;
        const passed = parsed.suites?.flatMap((s: any) =>
          s.specs.filter((t: any) => t.ok)
        ).length || 0;
        const failed = total - passed;

        if (code === 0) {
          resolve({
            totalTests: total,
            totalPassed: passed,
            totalFailed: failed,
            results: parsed.suites,
          });
        } else {
          resolve({
            failures: failed,
            message: "Some tests failed",
            results: parsed.suites,
          });
        }
      } catch (err) {
        reject({
          failures: 1,
          message: "Failed to read or parse Playwright output",
        });
      }
    });

    proc.on("error", (err) => {
      reject({
        failures: 1,
        message: `Playwright execution failed: ${err.message}`,
      });
    });
  });
}

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
  return runPlaywright(p);
}

/**
 * Run Cypress tests, we need to pass down the stripped options as if we've received them from the CLI
 */
export async function runSpecFile(
  { spec }: RunCypressSpecFile,
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
    spec,
  };

  debug("running cypress with options %o", options);
  let result = await runPlaywright(options);

  let retries = 0;
  const currentsConfig = await getCurrentsConfig();

  while (
    currentsConfig.retry &&
    retries < (currentsConfig.retry.hardFailureMaxRetries ?? 0) &&
    result.status === "failed"
  ) {
    warn("Cypress runner failed with message: %s", result.message);
    warn(
      "[retry %d/%d] Retrying the following spec files because of retry config: %s",
      retries + 1,
      currentsConfig.retry.hardFailureMaxRetries,
      spec
        .split(",")
        .map((i) => `\n - ${i}`)
        .join("")
    );
    result = await runPlaywright(options);
    retries++;
  }

  if (currentsConfig.retry && retries > 0) {
    warn(
      "Exhausted max retries: %d/%d",
      retries,
      currentsConfig.retry.hardFailureMaxRetries
    );
  }

  if (result.status === "failed") {
    warn('Cypress runner failed with message: "%s"', result.message);
    warn(
      "The following spec files will be marked as failed: %s",
      spec
        .split(",")
        .map((i) => `\n - ${i}`)
        .join("")
    );
  }

  debug("cypress run result %o", result);
  return result;
}

export const runSpecFileSafe = (
  spec: RunCypressSpecFile,
  cypressRunOptions: ValidatedCurrentsParameters
): Promise<CypressResult> =>
  safe(
    runSpecFile,
    (error) => {
      const message = `Cypress runnner crashed with an error:\n${
        (error as Error).message
      }\n${(error as Error).stack}}`;
      debug("cypress run exception %o", error);
      warn('Cypress runner crashed: "%s"', message);
      warn(
        "The following spec files will be marked as failed: %s",
        spec.spec
          .split(",")
          .map((i) => `\n - ${i}`)
          .join("")
      );
      return {
        status: "failed" as const,
        failures: 1,
        message,
      };
    },
    () => {}
  )(spec, cypressRunOptions);
