import { bus } from "../bus";

let config: Cypress.ResolvedConfigOptions | null = null;

export function getExecutionConfig() {
  if (!config) {
    throw new Error("Run config is not set");
  }
  return config;
}

bus.on("currents:config", (_config) => {
  // @ts-ignore
  config = _config.config;
});
