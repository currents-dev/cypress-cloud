const { defineConfig } = require("cypress");
const { loadEnvConfig } = require("@next/env");
const { currents } = require("cypress-runner/plugin");

function loadEnvVariables() {
  const projectDir = process.cwd();
  loadEnvConfig(projectDir);
}

loadEnvVariables();
// const projectId = process.env.CYPRESS_PROJECT_ID;

module.exports = defineConfig({
  e2e: {
    supportFile: false,
    specPattern: (function () {
      return "cypress/e2e/*.spec.js";
    })(),
    setupNodeEvents(on, config) {
      currents(on, config);
      // implement node event listeners here
    },
  },
});
