const assert = require("assert");
const cloudPluginExport = require("@deploysentinel/cypress-parallel/plugin");

assert(typeof cloudPluginExport.default === "function");
assert(typeof cloudPluginExport.cloudPlugin === "function");
