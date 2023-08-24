import coveragePlugin from "@cypress/code-coverage/task";
import coverageInstrumenter from "@cypress/code-coverage/use-babelrc";

import { defineConfig } from "cypress";

import { cloudPlugin } from "cypress-cloud/plugin";

export default defineConfig({
  fixturesFolder: false,
  e2e: {
    async setupNodeEvents(on, config) {
      on("file:preprocessor", coverageInstrumenter);
      const tempConfig = coveragePlugin(on, config);
      return await cloudPlugin(on, tempConfig);
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
