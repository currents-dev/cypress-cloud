import { defineConfig } from "cypress";
import { cloudPlugin } from "cypress-cloud/plugin";

// @ts-ignore
import patchCypressOn from "cypress-on-fix";
// @ts-ignore
import * as happoTask from "happo-cypress/task";

import installTerminal from "cypress-terminal-report/src/installLogsPrinter";

module.exports = defineConfig({
  e2e: {
    baseUrl: "https://todomvc.com/examples/backbone/dist",
    videoUploadOnPasses: false,
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/*/**/*.spec.js",
    async setupNodeEvents(cyOn, config) {
      const on = patchCypressOn(cyOn);

      installTerminal(on, {
        printLogsToConsole: "always",
      });
      happoTask.register(on, config);

      return await cloudPlugin(on, config);
    },
  },
});
