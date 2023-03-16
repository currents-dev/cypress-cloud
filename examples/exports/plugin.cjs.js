const assert = require("assert");
const cloudPluginExport = require("cypress-cloud/plugin");

assert(typeof cloudPluginExport.default === "function");
assert(typeof cloudPluginExport.cloudPlugin === "function");
