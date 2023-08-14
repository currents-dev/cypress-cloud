const { cloudPlugin } = require("cypress-cloud/plugin");
module.exports = (on, config) => {
  require("@cypress/code-coverage/task")(on, config);
  // used to instrument code tested like unit tests
  on("file:preprocessor", require("@cypress/code-coverage/use-babelrc"));
  // call cypress-cloud after the @cypress/code-coverage plugin
  return cloudPlugin(on, config);
};
