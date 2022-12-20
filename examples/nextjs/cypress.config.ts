import { defineConfig } from "cypress";
import { loadEnvConfig } from "@next/env";
import currents from "cypress-cloud/plugin";

function loadEnvVariables() {
  const projectDir = process.cwd();
  loadEnvConfig(projectDir);
}

loadEnvVariables();

module.exports = defineConfig({
  e2e: {
    videoUploadOnPasses: false,
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/*.spec.js",
    setupNodeEvents(on, config) {
      currents(on, config);
      require("cypress-terminal-report/src/installLogsPrinter")(on);
    },
  },

  component: {
    specPattern: "cypress/component/*.spec.js",
    setupNodeEvents(on, config) {
      currents(on, config);
    },
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});
