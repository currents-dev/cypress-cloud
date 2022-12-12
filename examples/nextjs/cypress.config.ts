const { defineConfig } = require("cypress");
const { loadEnvConfig } = require("@next/env");

function loadEnvVariables() {
  const projectDir = process.cwd();
  loadEnvConfig(projectDir);
}

loadEnvVariables();
const projectId = process.env.CYPRESS_PROJECT_ID;

module.exports = defineConfig({
  projectId,
  e2e: {
    supportFile: false,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
