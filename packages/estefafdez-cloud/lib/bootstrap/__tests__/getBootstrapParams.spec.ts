import { expect } from "@jest/globals";
import { getBootstrapArgs } from "../serializer";

const defaultEnv = {
  currents_temp_file: "tempFilePath",
  currents_debug_enabled: false,
};

const defaultArgs = {
  tempFilePath: "tempFilePath",
};
describe("getBootstrapArgs", () => {
  it('should have "--record false" param', () => {
    const result = getBootstrapArgs({
      ...defaultArgs,
      params: {
        testingType: "e2e",
      },
    });
    expect(result).toEqual(expect.arrayContaining(["--record", false]));
  });
  it("should add the default currents params", () => {
    const result = getBootstrapArgs({
      ...defaultArgs,
      params: {
        testingType: "e2e",
      },
    });
    expect(result).toEqual(
      expect.arrayContaining([
        "--env",
        JSON.stringify(defaultEnv),
        "--spec",
        expect.any(String),
        "--e2e",
      ])
    );
  });

  it("should add 'component' testing type", () => {
    const result = getBootstrapArgs({
      ...defaultArgs,
      params: {
        testingType: "component",
      },
    });
    expect(result).toEqual(expect.arrayContaining(["--component"]));
  });

  it("should add 'e2e' testing type", () => {
    const result = getBootstrapArgs({
      ...defaultArgs,
      params: {
        testingType: "e2e",
      },
    });
    expect(result).toEqual(expect.arrayContaining(["--e2e"]));
  });

  it("should handle spaces in env variables", () => {
    const env = {
      "foo bar": "baz",
      foo: "bar baz",
      grepTags: "no @tagA",
      grepFilterSpecs: true,
    };

    const result = getBootstrapArgs({
      ...defaultArgs,
      params: {
        testingType: "e2e",
        env,
      },
    });

    expect(result).toEqual(
      expect.arrayContaining([
        "--env",
        JSON.stringify({
          ...env,
          ...defaultEnv,
        }),
        "--spec",
        expect.any(String),
        "--e2e",
      ])
    );
  });

  it("should handle reporter options", () => {
    const reporterOptions = {
      "foo bar": "baz",
    };
    const result = getBootstrapArgs({
      ...defaultArgs,
      params: {
        reporterOptions,
        testingType: "e2e",
      },
    });

    expect(result).toEqual(
      expect.arrayContaining([
        "--reporter-options",
        JSON.stringify(reporterOptions),
        "--env",
        JSON.stringify(defaultEnv),
        "--spec",
        expect.any(String),
        "--e2e",
      ])
    );
  });

  it("should handle config options", () => {
    const config = {
      slowTestThreshold: 1000,
    };
    const result = getBootstrapArgs({
      ...defaultArgs,
      params: {
        config,
        testingType: "e2e",
      },
    });

    expect(result).toEqual(
      expect.arrayContaining([
        "--config",
        JSON.stringify(config),
        "--env",
        JSON.stringify(defaultEnv),
        "--spec",
        expect.any(String),
        "--e2e",
      ])
    );
  });
});
