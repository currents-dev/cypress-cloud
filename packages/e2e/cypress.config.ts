const { defineConfig } = require("cypress");
const { currents } = require("cypress-runner/plugin");

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
});
