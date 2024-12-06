import Debug from "debug";

import { P, match } from "ts-pattern";
import { DetectedBrowser, ValidatedCurrentsParameters } from "../../types";
import { bootCypress } from "../bootstrap";
import { info, warn } from "../log";
import { getConfigFilePath } from "./path";

const debug = Debug("currents:config");

export type E2EConfig = {
  batchSize: number;
};
export type ComponentConfig = {
  batchSize: number;
};

type RetryConfig = {
  hardFailureMaxRetries: number;
};

/**
 * This is the type for `currents.config.*s`. If you are not officially using TypeScript,
 * you can still type the exported config in your IDE by adding the following as a block comment
 * above `module.exports` / `export default`:
 *
 * `@type {import('cypress-cloud').CurrentsConfig}`
 */
export type CurrentsConfig = {
  projectId?: string;
  recordKey?: string;
  cloudServiceUrl: string;
  e2e: E2EConfig;
  component: ComponentConfig;
  networkHeaders?: Record<string, string>;
  retry?: RetryConfig;
};

let _config: CurrentsConfig | null = null;

const defaultConfig: CurrentsConfig = {
  e2e: {
    batchSize: 3,
  },
  component: {
    batchSize: 5,
  },
  cloudServiceUrl: "https://cy.currents.dev",
  networkHeaders: undefined,
};

export async function getCurrentsConfig(
  projectRoot?: string,
  explicitConfigFilePath?: string,
): Promise<CurrentsConfig> {
  if (_config) {
    return _config;
  }

  const configFilePath = getConfigFilePath(projectRoot, explicitConfigFilePath);
  // try loading possible config files
  for (const filepath of configFilePath) {
    const config = match(await loadConfigFile(filepath))
      .with({ default: P.not(P.nullish) }, (c) => c.default)
      .with(P.not(P.nullish), (c) => c)
      .otherwise(() => null);

    if (config) {
      debug("loaded currents config from '%s'\n%O", filepath, config);
      info("Using config file: '%s'", filepath);
      _config = {
        ...defaultConfig,
        ...config,
      };
      return _config;
    }
  }

  warn(
    "Failed to load config file, falling back to the default config. Attempted locations: %s",
    configFilePath,
  );
  _config = defaultConfig;
  return _config;
}

async function loadConfigFile(filepath: string) {
  try {
    debug("loading currents config file from '%s'", filepath);
    return await import(filepath);
  } catch (e) {
    debug("failed loading config file from: %s", e);
    return null;
  }
}

export type MergedConfig = Awaited<ReturnType<typeof getMergedConfig>>;
export async function getMergedConfig(params: ValidatedCurrentsParameters) {
  debug("resolving cypress config");
  const cypressResolvedConfig:
    | (Cypress.ResolvedConfigOptions & {
        projectRoot: string;
        rawJson: Record<string, unknown>;
        browsers: DetectedBrowser[];
      })
    | undefined = await bootCypress(params);

  debug("cypress resolvedConfig: %O", cypressResolvedConfig);

  // @ts-ignore
  const rawE2EPattern = cypressResolvedConfig.rawJson?.e2e?.specPattern;
  let additionalIgnorePattern: string[] = [];
  if (params.testingType === "component" && rawE2EPattern) {
    // @ts-ignore
    additionalIgnorePattern = rawE2EPattern;
  }

  // see https://github.com/cypress-io/cypress/blob/ed0668e24c2ee6753bbd25ae467ce94ae5857741/packages/config/src/options.ts#L457
  // and https://github.com/cypress-io/cypress/blob/develop/packages/config/src/project/utils.ts#L412
  const result = {
    projectRoot: cypressResolvedConfig?.projectRoot || process.cwd(),
    projectId: params.projectId,
    specPattern: cypressResolvedConfig?.specPattern || "**/*.*",
    excludeSpecPattern:
      // @ts-ignore
      cypressResolvedConfig?.resolved.excludeSpecPattern.value ?? [],
    additionalIgnorePattern,
    resolved: cypressResolvedConfig,
    experimentalCoverageRecording: params.experimentalCoverageRecording,
  };
  debug("merged config: %O", result);
  return result;
}
