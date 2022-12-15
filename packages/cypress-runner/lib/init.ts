import "./stdout";

import cypressPckg from "cypress/package.json";
import { version } from "../package.json";
import { setCurrentsVersion, setCypressVersion } from "./httpClient";

setCypressVersion(cypressPckg.version);
setCurrentsVersion(version);
