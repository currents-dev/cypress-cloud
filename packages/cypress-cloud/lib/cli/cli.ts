import { Command, Option } from "@commander-js/extra-typings";
import cypress from "cypress";
import Debug from "debug";
import { omit, pickBy } from "lodash";
import { CypressModuleAPIRunOptions } from "../../types";

const debug = Debug("currents:cli");

/**
 Ignored values - those are irrelevant for the CI runner
  --headed                                   displays the browser instead of running headlessly
  --headless                                 hide the browser instead of running headed (default for cypress run)
  --no-exit                                  keep the browser open after tests finish
 */
const program = new Command()
  .name("currents")
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
  .option(
    "-p, --port <port>",
    "runs Cypress on a specific port. overrides any value in cypress.config.{js,ts,mjs,cjs}"
  )
  .option(
    "-P, --project <project-path>",
    "path to your Cypress project root location"
  )
  .option("-q, --quiet", "suppress verbose output from Cypress")
  .option(
    "--record [bool]",
    "records the run and sends test results, screenshots and videos to Currents",
    true
  )
  .option(
    "-r, --reporter <reporter>",
    'use a specific mocha reporter for Cypress, pass a path to use a custom reporter, defaults to "spec"'
  )
  .option(
    "-o, --reporter-options <reporter-options>",
    'options for the mocha reporter. defaults to "null"'
  )
  .option(
    "-s, --spec <spec-pattern>",
    'define specific glob pattern for running the spec file(s), Defaults to the "specMatch" entry from the "cypress.config.{js,ts,mjs,cjs}" file',
    parseCommaSeparatedList
  )
  .option(
    "-t, --tag <tag>",
    "comma-separated tag(s) for recorded runs in Currents",
    parseCommaSeparatedList
  );

export async function parseOptions(
  _program: typeof program = program,
  ...args: Parameters<typeof program.parse>
) {
  _program.parse(...args);
  debug("parsed CLI options", _program.opts());
  const { e2e, component } = _program.opts();
  if (e2e && component) {
    _program.error("Cannot use both e2e and component options");
  }
  const cypressRunArguments = await getCypressRunArguments();

  const { key } = _program.opts();
  return { ...cypressRunArguments, key };
}

async function getCypressRunArguments() {
  let argv = process.argv.slice(2);
  if (argv[0] !== "cypress" && argv[0] !== "run") {
    argv = ["run", ...argv];
  }
  return await cypress.cli.parseRunArguments(argv);
}

function parseCommaSeparatedList(value?: string, previous: string[] = []) {
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
  runOptions: CypressModuleAPIRunOptions
): CypressModuleAPIRunOptions {
  return pickBy(
    omit(runOptions, [
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
    ]),
    Boolean
  );
}

export function serializeOptions(options: Record<string, unknown>) {
  return Object.entries(options)
    .map(([key, value]) => {
      if (typeof value === "boolean") {
        return value === true ? `--${key}` : "";
      }
      // @ts-ignore
      return `--${key} ${value.toString()}`;
    })
    .filter(Boolean);
}
