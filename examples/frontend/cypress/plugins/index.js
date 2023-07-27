const { cloudPlugin } = require("cypress-cloud/plugin");
module.exports = (on, config) => {
  cloudPlugin(on, config);
  require("@cypress/code-coverage/task")(on, config);
  //Used to instrument code tested like unit tests
  on("file:preprocessor", require("@cypress/code-coverage/use-babelrc"));
  return config;
};
