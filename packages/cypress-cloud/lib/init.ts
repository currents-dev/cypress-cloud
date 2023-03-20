import "./stdout";
import "./ws";

// enable "require" for esm
// requires shim=true in package.json
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const cypressPkg = require("cypress/package.json");
const pkg = require("cypress-cloud/package.json");

import { initCapture } from "./capture";
import { setCurrentsVersion, setCypressVersion } from "./httpClient";

initCapture();
setCypressVersion(cypressPkg.version);
setCurrentsVersion(pkg.version);
