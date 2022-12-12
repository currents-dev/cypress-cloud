import path from "path";
import { TestingType } from "../types";
import { bootCypress } from "./bootstrap";
import { getRandomPort } from "./utils";

const getConfigFile = async (explicitLocation = null) => {
  if (explicitLocation) {
    return "explicit location";
  }
  return path.resolve(process.cwd(), "currents.config.js");
};

export const getConfig = async (testingType: TestingType) => {
  const cypressConfigFile: Cypress.ResolvedConfigOptions = await bootCypress(
    getRandomPort()
  );
  const configFile = await getConfigFile();
  let config: Record<string, unknown> = {};
  try {
    config = require(configFile);
  } catch (e) {
    console.warn(
      "Cannot load loading config file from '%s' using defaults",
      configFile
    );
  }

  // @ts-ignore
  const rawE2EPattern = cypressConfigFile.rawJson?.e2e?.specPattern;
  let additionalIgnorePattern: string[] = [];
  if (testingType === "component" && rawE2EPattern) {
    // @ts-ignore
    additionalIgnorePattern = rawE2EPattern;
  }
  return {
    projectId: config.projectId,
    specPattern: cypressConfigFile.specPattern,
    // @ts-ignore
    excludeSpecPattern: cypressConfigFile.resolved.excludeSpecPattern.value,
    additionalIgnorePattern,
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
};
