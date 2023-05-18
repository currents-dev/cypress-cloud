import Debug from "debug";
import path from "path";
import { DetectedBrowser, ValidatedCurrentsParameters } from "../../types";
import { bootCypress } from "../bootstrap";
import { warn } from "../log";
import { require } from "../require";
import { getRandomPort } from "../utils";
import fs from "fs";

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

export function getCurrentsConfig(projectRoot?: string): CurrentsConfig {
  if (_config) {
    return _config;
  }
  const defaultConfig: CurrentsConfig = {
    e2e: {
      batchSize: 3,
    },
    component: {
      batchSize: 5,
    },
    cloudServiceUrl: "https://cy.currents.dev",
  };

  const configFilePath = getConfigFilePath(projectRoot);
  try {
    const resolvedPath = path.resolve(...configFilePath);
    debug("loading currents config file from '%s'", resolvedPath);

    const fsConfig = require(resolvedPath);
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
export async function getMergedConfig(params: ValidatedCurrentsParameters) {
  debug("resolving cypress config");
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
  };
  debug("merged config: %O", result);
  return result;
}

function getConfigFilePath(projectRoot: string | null = null) {
  const filename = "currents.config";
  const extensions = ["js", "cjs", "ejs", "ts"];
  const filepaths: string[] = [];

  for (const extension of extensions) {
    const filepath = path.join(projectRoot ?? process.cwd(), `${filename}.${extension}`);
    if (fs.existsSync(filepath)) {
      filepaths.push(filepath);
    } else {
      console.warn(`${filepath} does not exist.`);
    }
  }

  return filepaths;
}
