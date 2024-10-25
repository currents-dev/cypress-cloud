import { getCommitDefaults } from "../merge";

describe("ciProvider", () => {
  it("should resolve when provider is null and ghaEventDatais null", () => {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    process.env.TEAMCITY_VERSION = "1";
    const result = getCommitDefaults({
      ghaEventData: null,
    });
    expect(result).toEqual({
      ghaEventData: null,
    });
  });
});
