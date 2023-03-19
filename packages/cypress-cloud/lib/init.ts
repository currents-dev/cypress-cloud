import "./stdout";
import "./ws";

import cypressPkg from "cypress/package.json" assert { type: "json" };
import me from "../package.json" assert { type: "json" };
import { initCapture } from "./capture";
import { setCurrentsVersion, setCypressVersion } from "./httpClient";

initCapture();
setCypressVersion(cypressPkg.version);
setCurrentsVersion(me.version);
