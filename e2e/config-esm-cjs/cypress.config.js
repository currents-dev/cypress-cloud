import grepPlugin from "@cypress/grep/src/plugin.js";
import { defineConfig } from "cypress";
import currents from "cypress-cloud/plugin";
import terminalPlugin from "cypress-terminal-report/src/installLogsPrinter.js";

export default defineConfig({
  e2e: {
    baseUrl: "https://todomvc.com/examples/backbone/dist",
    videoUploadOnPasses: false,
    supportFile: "cypress/support/e2e.js",
    specPattern: "cypress/*/**/*.spec.js",
    setupNodeEvents(on, config) {
      grepPlugin(config);
      terminalPlugin(on);
      return currents(on, config);
    },
  },

  component: {
    specPattern: ["pages/__tests__/*.spec.tsx"],
    setupNodeEvents(on, config) {
      return currents(on, config);
    },
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});
