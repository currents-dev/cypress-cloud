import { require } from "./require";
import "./stdout";
import "./ws";

const cypressPkg = require("cypress/package.json");
const pkg = require("estefafdez-cloud/package.json");

import { initCapture } from "./capture";
import { setCurrentsVersion, setCypressVersion } from "./httpClient";

initCapture();
setCypressVersion(cypressPkg.version);
setCurrentsVersion(pkg.version);
