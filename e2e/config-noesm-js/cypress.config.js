const { defineConfig } = require("cypress");
const { cloudPlugin } = require("cypress-cloud/plugin");

module.exports = defineConfig({
  e2e: {
    baseUrl: "https://todomvc.com/examples/backbone/dist",
    videoUploadOnPasses: false,
    supportFile: "cypress/support/e2e.js",
    specPattern: "cypress/*/**/*.spec.js",
    setupNodeEvents(on, config) {
      require("@cypress/grep/src/plugin")(config);
      require("cypress-terminal-report/src/installLogsPrinter")(on);
      return cloudPlugin(on, config);
    },
  },

  component: {
    specPattern: ["pages/__tests__/*.spec.tsx"],
    setupNodeEvents(on, config) {
      return cloudPlugin(on, config);
    },
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});
