import path from "path";
import { TestingType } from "../types";

const getConfigFile = async (explicitLocation = null) => {
  if (explicitLocation) {
    return "explicit location";
  }
  return path.resolve(process.cwd(), "currents.config.js");
};

export const getConfig = async (testingType: TestingType) => {
  const configFile = await getConfigFile();
  let config = {};
  try {
    config = require(configFile);
  } catch (e) {
    console.warn(
      "Cannot load loading config file from '%s' using defaults",
      configFile
    );
  }

  // see https://github.com/cypress-io/cypress/blob/ed0668e24c2ee6753bbd25ae467ce94ae5857741/packages/config/src/options.ts#L457
  // and https://github.com/cypress-io/cypress/blob/develop/packages/config/src/project/utils.ts#L412

  let additionalIgnorePattern = [];
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
