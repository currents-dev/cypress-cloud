import path from "path";
import { TestingType } from "../types";
import { bootCypress } from "./bootstrap";
import { getRandomPort } from "./utils";

// TODO: Add strict types for Currents configuration options
type CurrentsConfig = Record<string, unknown>;
export async function getCurrentsConfig(): Promise<CurrentsConfig> {
  const configFile = await getConfigFile();
  let config: CurrentsConfig = {};

  try {
    config = require(configFile);
    config.projectId = process.env.CURRENTS_PROJECT_ID ?? config.projectId;
  } catch (e) {
    console.warn(
      "Cannot load loading config file from '%s', using defaults",
      configFile
    );
  }
  return config;
}

export async function mergeConfig(
  testingType: TestingType,
  currentsConfig: CurrentsConfig
) {
  const cypressResolvedConfig: Cypress.ResolvedConfigOptions =
    await bootCypress(getRandomPort());

  // @ts-ignore
  const rawE2EPattern = cypressResolvedConfig.rawJson?.e2e?.specPattern;
  let additionalIgnorePattern: string[] = [];
  if (testingType === "component" && rawE2EPattern) {
    // @ts-ignore
    additionalIgnorePattern = rawE2EPattern;
  }
  return {
    projectRoot: currentsConfig.projectRoot || process.cwd(),
    projectId: currentsConfig.projectId,
    specPattern: cypressResolvedConfig.specPattern,
    // @ts-ignore
    excludeSpecPattern: cypressResolvedConfig.resolved.excludeSpecPattern.value,
    additionalIgnorePattern,
    resolved: cypressResolvedConfig,
  };

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

async function getConfigFile(explicitLocation = null) {
  if (explicitLocation) {
    return "explicit location";
  }
  return path.resolve(process.cwd(), "currents.config.js");
}
