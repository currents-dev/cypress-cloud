import Debug from "debug";
import path from "path";
import VError from "verror";
import { CypressModuleAPIRunOptions, TestingType } from "../types";
import { bootCypress } from "./bootstrap";
import { getRandomPort } from "./utils";
const debug = Debug("currents:config");

// TODO: Add strict types for Currents configuration options
type CurrentsConfig = { projectId?: string };
export async function getCurrentsConfig(): Promise<CurrentsConfig> {
  const configFilePath = await getConfigFilePath();
  debug("loading currents config file from '%s'", configFilePath);

  let config: CurrentsConfig = {};
  try {
    config = require(configFilePath);
    return config;
  } catch (e) {
    return {};
  }
}

export async function mergeConfig(
  testingType: TestingType,
  projectId: string,
  cypressRunOptions: CypressModuleAPIRunOptions
) {
  debug("resolving cypress config");
  const cypressResolvedConfig: Cypress.ResolvedConfigOptions & {
    projectRoot: string;
    rawJson: Record<string, unknown>;
  } = await bootCypress(getRandomPort(), cypressRunOptions);

  // @ts-ignore
  const rawE2EPattern = cypressResolvedConfig.rawJson?.e2e?.specPattern;
  let additionalIgnorePattern: string[] = [];
  if (testingType === "component" && rawE2EPattern) {
    // @ts-ignore
    additionalIgnorePattern = rawE2EPattern;
  }

  const result = {
    projectRoot: cypressResolvedConfig.projectRoot || process.cwd(),
    projectId,
    specPattern: cypressResolvedConfig.specPattern,
    // @ts-ignore
    excludeSpecPattern: cypressResolvedConfig.resolved.excludeSpecPattern.value,
    additionalIgnorePattern,
    resolved: cypressResolvedConfig,
  };
  debug("merged config: %O", result);
  return result;

  // see https://github.com/cypress-io/cypress/blob/ed0668e24c2ee6753bbd25ae467ce94ae5857741/packages/config/src/options.ts#L457
  // and https://github.com/cypress-io/cypress/blob/develop/packages/config/src/project/utils.ts#L412

  // let additionalIgnorePattern = [];
  // @ts-ignore
  if (testingType === "component" && config.e2e && config.e2e.specPattern) {
    // @ts-ignore
    additionalIgnorePattern = config.e2e.specPattern;
  }
  const resolvedConfig = {
    e2e: {
      // @ts-ignore
      projectId: config.projectId,
      specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
      excludeSpecPattern: "*.hot-update.js",
      // @ts-ignore
      ...config.e2e,
      additionalIgnorePattern,
    },
    component: {
      // @ts-ignore
      projectId: config.projectId,
      specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
      excludeSpecPattern: "*.hot-update.js",
      // @ts-ignore
      ...config.component,
      additionalIgnorePattern,
    },
  };

  if (testingType === "e2e") {
    return resolvedConfig.e2e;
  }
  return resolvedConfig.component;
}

function getConfigFilePath(explicitLocation = null) {
  return path.resolve(explicitLocation ?? process.cwd(), "currents.config.js");
}
