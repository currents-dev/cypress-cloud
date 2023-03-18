import Debug from "debug";
import path from "path";
import { CurrentsRunParameters, DetectedBrowser } from "../../types";
import { bootCypress } from "../bootstrap";
import { warn } from "../log";
import { getRandomPort } from "../utils";
const debug = Debug("currents:config");

export type E2EConfig = {
  batchSize: number;
};
export type ComponentConfig = {
  batchSize: number;
};
export type CurrentsConfig = {
  projectId?: string;
  recordKey?: string;
  cloudServiceUrl: string;
  e2e: E2EConfig;
  component: ComponentConfig;
};

let _config: CurrentsConfig | null = null;
export function getCurrentsConfig(): CurrentsConfig {
  if (_config) {
    return _config;
  }

  const configFilePath = getConfigFilePath();
  debug("loading currents config file from '%s'", configFilePath);

  const defaultConfig: CurrentsConfig = {
    e2e: {
      batchSize: 3,
    },
    component: {
      batchSize: 5,
    },
    cloudServiceUrl: "https://cy.currents.dev",
  };

  try {
    const fsConfig = require(configFilePath);
    _config = {
      ...defaultConfig,
      ...fsConfig,
    } as CurrentsConfig;
    return _config;
  } catch (e) {
    warn("failed to load config file: %s", configFilePath);
    debug("failure details: %s", e);
    _config = defaultConfig;
    return _config;
  }
}

export type MergedConfig = Awaited<ReturnType<typeof getMergedConfig>>;
export async function getMergedConfig(params: CurrentsRunParameters) {
  debug("resolving cypress config ");
  const cypressResolvedConfig:
    | (Cypress.ResolvedConfigOptions & {
        projectRoot: string;
        rawJson: Record<string, unknown>;
        browsers: DetectedBrowser[];
      })
    | undefined = await bootCypress(getRandomPort(), params);

  debug("cypress resolvedConfig: %O", cypressResolvedConfig);

  // @ts-ignore
  const rawE2EPattern = cypressResolvedConfig.rawJson?.e2e?.specPattern;
  let additionalIgnorePattern: string[] = [];
  if (params.testingType === "component" && rawE2EPattern) {
    // @ts-ignore
    additionalIgnorePattern = rawE2EPattern;
  }

  const result = {
    projectRoot: cypressResolvedConfig?.projectRoot || process.cwd(),
    projectId: params.projectId,
    specPattern: cypressResolvedConfig?.specPattern || "**/*.*",
    excludeSpecPattern:
      // @ts-ignore
      cypressResolvedConfig?.resolved.excludeSpecPattern.value ?? [],
    additionalIgnorePattern,
    resolved: cypressResolvedConfig,
  };
  debug("merged config: %O", result);
  return result;

  // see https://github.com/cypress-io/cypress/blob/ed0668e24c2ee6753bbd25ae467ce94ae5857741/packages/config/src/options.ts#L457
  // and https://github.com/cypress-io/cypress/blob/develop/packages/config/src/project/utils.ts#L412
}

function getConfigFilePath(explicitLocation = null) {
  return path.resolve(explicitLocation ?? process.cwd(), "currents.config.js");
}
