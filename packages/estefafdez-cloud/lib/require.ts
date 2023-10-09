import { createRequire } from "module";
// requires shim=true in package.json
export const require = createRequire(import.meta.url);
