import { expect } from "@jest/globals";
import { parseCLIOptions } from "../cli";
import { createProgram } from "../program";

const getProgram = () =>
  createProgram()
    .exitOverride()
    .configureOutput({
      writeOut: () => {},
      writeErr: () => {},
      outputError: () => {},
    });

const p = (args: string[]) =>
  parseCLIOptions(getProgram(), ["program", "command", ...args]);

const defaults = {
  parallel: false,
  record: true,
  testingType: "e2e",
};
describe("CLI", () => {
  beforeEach(() => {
    ["CURRENTS_RECORD_KEY"].forEach((key) => {
      process.env[key] = undefined;
      delete process.env[key];
    });
  });

  it("has defaults", async () => expect(await p([])).toMatchObject(defaults));
  it("parses browser", async () => {
    expect(await p(["--browser", "some"])).toMatchObject({
      browser: "some",
    });
  });

  it("parses --ci-build-id", async () => {
    expect(await p(["--ci-build-id", "some"])).toMatchObject({
      ciBuildId: "some",
    });
  });

  it("parses spec into an array", async () => {
    expect(await p(["--spec", "a,b", "--spec", "c"])).toMatchObject({
      spec: ["a", "b", "c"],
    });
  });

  it("parses empty spec into nothing", async () => {
    expect(await p([])).toMatchObject({});
  });

  it("parses --component", async () => {
    expect(await p(["--component"])).toMatchObject({
      testingType: "component",
    });
  });

  it("parses --e2e", async () => {
    expect(await p(["--e2e"])).toMatchObject({
      testingType: "e2e",
    });
  });

  it("parses --config comma-separated", async () => {
    expect(await p(["--config", "a=b,c=d"])).toMatchObject({
      config: {
        a: "b",
        c: "d",
      },
    });
  });

  it("parses --config json", async () => {
    expect(
      await p(["--config", `{"a": "b", "c": 1,  "d": {"nested": true } }`])
    ).toMatchObject({
      config: {
        a: "b",
        c: 1,
        d: {
          nested: true,
        },
      },
    });
  });

  it("parses --env comma-separated", async () => {
    expect(await p(["--env", "a=b,c=d"])).toMatchObject({
      env: {
        a: "b",
        c: "d",
      },
    });
  });

  it("parses -C", async () => {
    expect(await p(["-C", "some"])).toMatchObject({
      configFile: "some",
    });
  });

  it("parses --group", async () => {
    expect(await p(["--group", "some"])).toMatchObject({
      group: "some",
    });
  });

  it("parses --key", async () => {
    expect(await p(["--key", "some"])).toMatchObject({
      key: "some",
    });
  });

  it("parses --key from CURRENTS_RECORD_KEY", async () => {
    process.env.CURRENTS_RECORD_KEY = "envKey";
    expect(await p([])).toMatchObject({
      key: "envKey",
    });
  });

  it("parses --parallel", async () => {
    expect(await p(["--parallel"])).toMatchObject({
      parallel: true,
    });
  });

  it("parses no --parallel", async () => {
    expect(await p([])).toMatchObject({
      parallel: false,
    });
  });

  it("parses --port", async () => {
    expect(await p(["--port", "8080"])).toMatchObject({
      port: 8080,
    });
  });

  it("parses --P", async () => {
    expect(await p(["-P", "some"])).toMatchObject({
      project: "some",
    });
  });

  it("parses --record", async () => {
    expect(await p(["--record"])).toMatchObject({
      record: true,
    });
  });

  it("parses no --record", async () => {
    expect(await p([""])).toMatchObject({
      record: true,
    });
  });

  it("parses tags into an array", async () => {
    expect(await p(["--tag", "a,b", "--tag", "c", "--key", "a"])).toMatchObject(
      {
        tag: ["a", "b", "c"],
      }
    );
  });

  it("cannot use --e2e and --component together", async () => {
    await expect(async () =>
      p(["--component", "--e2e"])
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Cannot use both e2e and component options"`
    );
  });

  it("using component implies testingType is 'component'", async () => {
    expect(await p(["program", "command", "--component"])).toMatchObject({
      testingType: "component",
    });
  });

  it("using e2e implies testingType is 'e2e'", async () => {
    expect(await p(["--e2e"])).toMatchObject({
      testingType: "e2e",
    });
  });
});
