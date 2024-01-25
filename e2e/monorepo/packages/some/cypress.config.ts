import { defineConfig } from "cypress";
import currents from "cypress-cloud/plugin";

module.exports = defineConfig({
  e2e: {
    baseUrl: "https://todomvc.com/examples/backbone/dist",
    videoUploadOnPasses: false,
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/*/**/*.spec.js",
    setupNodeEvents(on, config) {
      require("@cypress/grep/src/plugin")(config);
      require("cypress-terminal-report/src/installLogsPrinter")(on);
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
