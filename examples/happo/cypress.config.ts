import { defineConfig } from "cypress";
import { cloudPlugin } from "cypress-cloud/plugin";
// @ts-ignore
import patchCypressOn from "cypress-on-fix";
// @ts-ignore
import * as happoTask from "happo-cypress/task";

module.exports = defineConfig({
  e2e: {
    baseUrl: "https://todomvc.com/examples/backbone/dist",
    videoUploadOnPasses: false,
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/*/**/*.spec.js",
    async setupNodeEvents(cyOn, config) {
      const on = patchCypressOn(cyOn);
      happoTask.register(on, config);
      const result = await cloudPlugin(on, config);
      return result;
    },
  },

  component: {
    specPattern: ["pages/__tests__/*.spec.tsx"],
    async setupNodeEvents(on, config) {
      const result = await cloudPlugin(on, config);
      return result;
    },
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});
