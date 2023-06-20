import assert from "assert";
import cloudPluginDefault, { cloudPlugin } from "@deploysentinel/cypress-cloud/plugin";

assert(typeof cloudPluginDefault === "function");
assert(typeof cloudPlugin === "function");
assert(cloudPluginDefault === cloudPlugin);
