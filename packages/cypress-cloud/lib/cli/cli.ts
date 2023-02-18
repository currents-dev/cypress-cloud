import { Command, Option } from "@commander-js/extra-typings";
import Debug from "debug";
import { isObject, omit, pickBy } from "lodash";
import {
  CurrentsRunParameters,
  StrippedCypressModuleAPIOptions,
} from "../../types";
import { getCurrentsConfig } from "../config";
import { sanitizeAndConvertNestedArgs } from "./parser";

const debug = Debug("currents:cli");

export const createProgram = (command: Command = new Command()) =>
  command
    .name("cypress-cloud")
    .description(
      "Runs Cypress tests on CI using Currents as an orchestration and reporting service"
    )
    .option(
      "-b, --browser <browser-name-or-path>",
      "runs Cypress in the browser with the given name; if a filesystem path is supplied, Cypress will attempt to use the browser at that path"
    )
    .option(
      "--ci-build-id <id>",
      "the unique identifier for a run, this value is automatically detected for most CI providers"
    )
    .addOption(
      new Option("--component", "runs Cypress component test")
        .default(false)
        .implies({
          e2e: false,
        })
    )
    .option(
      "-c, --config <config>",
      "sets Cypress configuration values. separate multiple values with a comma. overrides any value in cypress.config.{js,ts,mjs,cjs}"
    )
    .option(
      "-e, --env <env>",
      "sets environment variables. separate multiple values with a comma. overrides any value in cypress.config.{js,ts,mjs,cjs} or cypress.env.json"
    )
    .option(
      "-C, --config-file <config-file>",
      'specify Cypress config file, path to script file where Cypress configuration values are set. defaults to "cypress.config.{js,ts,mjs,cjs}"'
    )
    .addOption(new Option("--e2e", "runs end to end tests").default(true))
    .option("--group <name>", "a named group for recorded runs in Currents")
    .option(
      "-k, --key <record-key>",
      "your secret Record Key obtained from Currents. you can omit this if you set a CURRENTS_RECORD_KEY environment variable"
    )
    .option(
      "--parallel",
      "enables concurrent runs and automatic load balancing of specs across multiple machines or processes",
      false
    )
    .addOption(
      new Option(
        "-p, --port <number>",
        "runs Cypress on a specific port. overrides any value in cypress.config.{js,ts,mjs,cjs}"
      ).argParser((i) => parseInt(i, 10))
    )
    .option(
      "-P, --project <project-path>",
      "path to your Cypress project root location"
    )
    .option("-q, --quiet", "suppress verbose output from Cypress")
    .addOption(
      new Option(
        "--record [bool]",
        "records the run and sends test results, screenshots and videos to Currents"
      )
        .default(true)
        .argParser((i) => (i === "false" ? false : true))
    )
    .option(
      "-r, --reporter <reporter>",
      'use a specific mocha reporter for Cypress, pass a path to use a custom reporter, defaults to "spec"'
    )
    .option(
      "-o, --reporter-options <reporter-options>",
      'options for the mocha reporter. defaults to "null"'
    )
    .addOption(
      new Option(
        "-s, --spec <spec-pattern>",
        'define specific glob pattern for running the spec file(s), Defaults to the "specMatch" entry from the "cypress.config.{js,ts,mjs,cjs}" file'
      ).argParser(parseCommaSeparatedList)
    )
    .option(
      "-t, --tag <tag>",
      "comma-separated tag(s) for recorded runs in Currents",
      parseCommaSeparatedList
    );

const program = createProgram();

export function parseOptions(
  _program: typeof program = program,
  ...args: Parameters<typeof program.parse>
) {
  _program.parse(...args);
  debug("parsed CLI options", _program.opts());

  const { e2e, component } = _program.opts();
  if (e2e && component) {
    _program.error("Cannot use both e2e and component options");
  }

  return getRunParameters(_program.opts());
}

function parseCommaSeparatedList(value: string, previous: string[] = []) {
  if (value) {
    return previous.concat(value.split(",").map((t) => t.trim()));
  }
  return previous;
}

/**
 *
 * @returns Cypress non-empty options without the ones that are not relevant for the runner
 */
export function getStrippedCypressOptions(
  params: CurrentsRunParameters
): StrippedCypressModuleAPIOptions {
  return pickBy(
    omit(params, [
      "projectId",
      "record",
      "key",
      "group",
      "parallel",
      "tag",
      "ciBuildId",
      "spec",
      "exit",
      "headed",
      "headless",
      "testingType",
    ]),
    Boolean
  );
}

export function serializeOptions(options: Record<string, unknown>) {
  return Object.entries(options)
    .map(([key, value]) => {
      const _key = dashed(key);
      if (typeof value === "boolean") {
        return value === true ? `--${_key}` : "";
      }

      if (isObject(value)) {
        return `--${_key} ${serializeComplexParam(value)}`;
      }

      // @ts-ignore
      return `--${_key} ${value.toString()}`;
    })
    .filter(Boolean);
}

function serializeComplexParam(param: {}) {
  return JSON.stringify(param);
}

const dashed = (v: string) => v.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

/**
 * Transforms the CLI options into the format that the runner expects
 *
 * @param cliOptions
 * @returns
 */
async function getRunParameters(
  cliOptions: ReturnType<typeof program.opts>
): Promise<CurrentsRunParameters> {
  const { projectId, recordKey } = await getCurrentsConfig();
  const key = cliOptions.key ?? process.env.CURRENTS_RECORD_KEY ?? recordKey;

  if (!key) {
    return program.error(
      "Missing 'key'. Please either pass it as a cli flag '-k, --key <record-key>', set it in currents.config.js, or set CURRENTS_RECORD_KEY environment variable."
    );
  }

  const _projectId = process.env.CURRENTS_PROJECT_ID ?? projectId;

  if (!_projectId) {
    return program.error(
      "Missing projectId. Please either set it in currents.config.js, or as CURRENTS_PROJECT_ID environment variable."
    );
  }

  const result = omit({ ...cliOptions }, "e2e", "component", "tag");

  return {
    ...result,
    config: sanitizeAndConvertNestedArgs(cliOptions.config, "config"),
    env: sanitizeAndConvertNestedArgs(cliOptions.env, "env"),
    reporterOptions: sanitizeAndConvertNestedArgs(
      cliOptions.reporterOptions,
      "reporterOptions"
    ),
    tag: cliOptions.tag,
    testingType: cliOptions.component ? "component" : "e2e",
    key,
    projectId: _projectId,
  };
}
