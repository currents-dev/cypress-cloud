import { expect } from "@jest/globals";
import { createProgram, parseOptions } from "..";

const getProgram = () =>
  createProgram()
    .exitOverride()
    .configureOutput({
      writeOut: () => {},
      writeErr: () => {},
      outputError: () => {},
    });

const p = (args: string[]) =>
  parseOptions(getProgram(), ["program", "command", ...args]);

const defaults = {
  parallel: false,
  record: true,
  testingType: "e2e",
};
describe("CLI", () => {
  it("has defaults", () => expect(p([])).toMatchObject(defaults));
  it("parses browser", () => {
    expect(p(["--browser", "some"])).toMatchObject({
      browser: "some",
    });
  });

  it("parses --ci-build-id", () => {
    expect(p(["--ci-build-id", "some"])).toMatchObject({
      ciBuildId: "some",
    });
  });

  it("parses spec into an array", async () => {
    expect(p(["--spec", "a,b", "--spec", "c"])).toMatchObject({
      spec: ["a", "b", "c"],
    });
  });

  it("parses empty spec into nothing", async () => {
    expect(p([])).toMatchObject({
      spec: undefined,
    });
  });

  it("parses --component", async () => {
    expect(p(["--component"])).toMatchObject({
      testingType: "component",
    });
  });

  it("parses --e2e", async () => {
    expect(p(["--e2e"])).toMatchObject({
      testingType: "e2e",
    });
  });

  it("parses --config comma-separated", async () => {
    expect(p(["--config", "a=b,c=d"])).toMatchObject({
      config: {
        a: "b",
        c: "d",
      },
    });
  });

  xit("parses --config json", async () => {
    expect(p(["--config", `c={'a': 'b'}`])).toMatchObject({
      config: {
        a: "b",
      },
    });
  });

  it("parses --env comma-separated", async () => {
    expect(p(["--env", "a=b,c=d"])).toMatchObject({
      env: {
        a: "b",
        c: "d",
      },
    });
  });

  it("parses -C", async () => {
    expect(p(["-C", "some"])).toMatchObject({
      configFile: "some",
    });
  });

  it("parses --group", async () => {
    expect(p(["--group", "some"])).toMatchObject({
      group: "some",
    });
  });

  it("parses --key", async () => {
    expect(p(["--key", "some"])).toMatchObject({
      key: "some",
    });
  });

  it("parses --parallel", async () => {
    expect(p(["--parallel"])).toMatchObject({
      parallel: true,
    });
  });

  it("parses no --parallel", async () => {
    expect(p([])).toMatchObject({
      parallel: false,
    });
  });

  it("parses --port", async () => {
    expect(p(["--port", "8080"])).toMatchObject({
      port: 8080,
    });
  });

  it("parses --P", async () => {
    expect(p(["-P", "some"])).toMatchObject({
      project: "some",
    });
  });

  it("parses --record", async () => {
    expect(p(["--record"])).toMatchObject({
      record: true,
    });
  });

  it("parses no --record", async () => {
    expect(p([""])).toMatchObject({
      record: true,
    });
  });

  it("parses tags into an array", async () => {
    expect(p(["--tag", "a,b", "--tag", "c", "--key", "a"])).toMatchObject({
      tags: ["a", "b", "c"],
    });
  });

  it("cannot use --e2e and --component together", async () => {
    expect(() =>
      parseOptions(getProgram(), [
        "program",
        "command",
        "--component",
        "--e2e",
        "--key",
        "a",
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"Cannot use both e2e and component options"`
    );
  });

  it("e2e is the default, when no explicit params", async () => {
    const parsedOptions = parseOptions(getProgram(), [
      "program",
      "command",
      "--key",
      "a",
    ]);
    expect(parsedOptions).toMatchObject({
      testingType: "e2e",
    });
  });

  it("using component implies testingType is 'component'", async () => {
    expect(
      parseOptions(getProgram(), [
        "program",
        "command",
        "--component",
        "--key",
        "a",
      ])
    ).toMatchObject({
      testingType: "component",
    });
  });

  it("using e2e implies testingType is 'e2e'", async () => {
    expect(
      parseOptions(getProgram(), ["program", "command", "--e2e", "--key", "a"])
    ).toMatchObject({
      testingType: "e2e",
    });
  });
});
