import { DetectedBrowser, Platform } from "../types";

export function guessBrowser(
  browser: string,
  availableBrowsers: DetectedBrowser[] = []
): Pick<Platform, "browserName" | "browserVersion"> {
  // try identifying the browser by name first
  let result = availableBrowsers.find((b) => b.name === browser);

  if (result) {
    return {
      browserName: result.displayName,
      browserVersion: result.version,
    };
  }

  // otherwise, try identifying by the path
  result = availableBrowsers.find((b) => b.path === browser);
  if (result) {
    return {
      browserName: result.displayName ?? result.name,
      browserVersion: result.version,
    };
  }

  // otherwise, return dummy browser
  return {
    browserName: "unknown",
    browserVersion: "unknown",
  };
}
