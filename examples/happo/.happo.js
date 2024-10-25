// .happo.js
const { RemoteBrowserTarget } = require("happo.io");

module.exports = {
  apiKey: process.env.HAPPO_API,
  apiSecret: process.env.HAPPO_SECRET,
  targets: {
    chrome: new RemoteBrowserTarget("chrome", {
      viewport: "1024x768",
    }),
  },
};
