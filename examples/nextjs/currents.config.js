const { loadEnvConfig } = require("@next/env");

function loadEnvVariables() {
  const projectDir = process.cwd();
  loadEnvConfig(projectDir);
}

loadEnvVariables();

module.exports = {
  projectId: process.env.CURRENTS_PROJECT_ID,
  projectRoot: process.cwd(),
};
