import { describe, expect, it } from "@jest/globals";
import { defaultFilenames, getConfigFilePath, normalizePath } from "../path";

describe("getConfigFilePath", () => {
  it.each([
    [
      "should return the default config file paths",
      { projectRoot: "root", explicitPath: undefined },
      defaultFilenames.map((p) => normalizePath("root", p)),
    ],
    [
      "should return relative path to config file",
      { projectRoot: "root", explicitPath: "explicit" },
      [normalizePath("root", "explicit")],
    ],
    [
      "should return absolute path to config file",
      { projectRoot: "root", explicitPath: "/users/a/c.js" },
      ["/users/a/c.js"],
    ],
  ])("%s", (_title, { projectRoot, explicitPath }, expected) => {
    expect(getConfigFilePath(projectRoot, explicitPath)).toMatchObject(
      // @ts-expect-error
      expected
    );
  });
});
