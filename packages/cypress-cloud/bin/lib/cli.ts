import { CurrentsRunParameters, TestingType } from "cypress-cloud/types";
import Debug from "debug";
import { activateDebug } from "../../lib/debug";
import { sanitizeAndConvertNestedArgs } from "./parser";
import { program } from "./program";

const debug = Debug("currents:cli");

export function parseCLIOptions(
  _program: typeof program = program,
  ...args: Parameters<typeof program.parse>
) {
  const opts = _program.parse(...args).opts();

  activateDebug(opts.cloudDebug);
  debug("parsed CLI flags %o", opts);

  const { e2e, component } = opts;
  if (e2e && component) {
    _program.error("Cannot use both e2e and component options");
  }

  return getRunParametersFromCLI(opts);
}

/**
 * Transforms the CLI options into the format that the `run` API expects
 *
 * @param cliOptions
 * @returns Currents run parameters
 */
export function getRunParametersFromCLI(
  cliOptions: ReturnType<typeof program.opts>
): CurrentsRunParameters {
  const { component, e2e, ...restOptions } = cliOptions;
  const testingType: TestingType = component ? "component" : "e2e";

  const result: Partial<CurrentsRunParameters> = {
    ...restOptions,
    config: sanitizeAndConvertNestedArgs(cliOptions.config, "config"),
    env: sanitizeAndConvertNestedArgs(cliOptions.env, "env"),
    reporterOptions: sanitizeAndConvertNestedArgs(
      cliOptions.reporterOptions,
      "reporterOptions"
    ),
    testingType,
    recordKey: cliOptions.key,
  };

  debug("parsed run params: %o", result);
  return result;
}
