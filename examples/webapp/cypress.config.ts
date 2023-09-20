import grepPlugin from "@cypress/grep/src/plugin";
import { defineConfig } from "cypress";
import { cloudPlugin } from "cypress-cloud/plugin";
import patchCypressOn from "cypress-on-fix";

module.exports = defineConfig({
  e2e: {
    projectId: !!(process.env.GITHUB_ACTION || process.env.CIRCLE_BRANCH)
      ? "Ij0RfK"
      : "l4zuz8",
    baseUrl: "https://todomvc.com/examples/vanillajs",
    videoUploadOnPasses: false,
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/*/**/*.spec.js",
    async setupNodeEvents(cyOn, config) {
      const on = patchCypressOn(cyOn);
      grepPlugin(config);
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
