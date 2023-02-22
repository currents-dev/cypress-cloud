import currents from "@currents/cypress/plugin";
import { defineConfig } from "cypress";

module.exports = defineConfig({
  e2e: {
    projectId: "s0LBur",
    baseUrl: "https://todomvc.com/examples/vanillajs",
    videoUploadOnPasses: false,
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/*/*.spec.js",
    setupNodeEvents(on, config) {
      currents(on, config);
      require("cypress-terminal-report/src/installLogsPrinter")(on);
    },
  },

  component: {
    specPattern: "cypress/component/*.spec.js",
    setupNodeEvents(on, config) {
      return currents(on, config);
    },
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});
