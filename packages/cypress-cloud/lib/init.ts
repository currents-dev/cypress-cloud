import "./stdout";
import "./ws";

import cypressPckg from "cypress/package.json";
import { version } from "../package.json";
import { initCapture } from "./capture";
import { setCurrentsVersion, setCypressVersion } from "./httpClient";

initCapture();
setCypressVersion(cypressPckg.version);
setCurrentsVersion(version);
