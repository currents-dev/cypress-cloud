import assert from "assert";
import cloudPluginDefault, { cloudPlugin } from "cypress-cloud/plugin";

assert(typeof cloudPluginDefault === "function");
assert(typeof cloudPlugin === "function");
assert(cloudPluginDefault === cloudPlugin);
