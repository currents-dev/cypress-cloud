import currents from "@currents/cypress/plugin";
import { defineConfig } from "cypress";

module.exports = defineConfig({
  e2e: {
    projectId: !!(process.env.GITHUB_ACTION || process.env.CIRCLE_BRANCH)
      ? "Ij0RfK"
      : "s0LBur",
    baseUrl: "https://todomvc.com/examples/vanillajs",
    videoUploadOnPasses: false,
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/*/*.spec.js",
    setupNodeEvents(on, config) {
      require("cypress-terminal-report/src/installLogsPrinter")(on);
      return currents(on, config);
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
