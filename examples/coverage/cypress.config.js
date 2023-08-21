const { defineConfig } = require("cypress");

module.exports = defineConfig({
  fixturesFolder: false,
  e2e: {
    setupNodeEvents(on, config) {
      return require("./cypress/plugins/index.js")(on, config);
    },
    baseUrl: "http://localhost:8888",
    videoUploadOnPasses: false,
    supportFile: "cypress/support/e2e.js",
    specPattern: "cypress/*/**/*.cy.js",
    env: {
      // @cypress/code-coverage config
      codeCoverage: {
        exclude: ["cypress/**/*.*"],
      },
      // set custom coverage file for cypress-cloud
      coverageFile: "./.nyc_output/out.json",
    },
  },
});
