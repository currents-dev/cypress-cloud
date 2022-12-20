import { createProgram, parseOptions } from "..";
import { expect } from "@jest/globals";

const getProgram = () =>
  createProgram()
    .exitOverride()
    .configureOutput({
      writeOut: () => {},
      writeErr: () => {},
      outputError: () => {},
    });

describe("CLI", () => {
  it("parses spec into an array", async () => {
    expect(
      parseOptions(getProgram(), [
        "program",
        "command",
        "--spec",
        "a,b",
        "--key",
        "a",
      ])
    ).toMatchObject({
      spec: ["a", "b"],
    });
  });

  it("parses tags into an array", async () => {
    expect(
      parseOptions(getProgram(), [
        "program",
        "command",
        "--tag",
        "a,b",
        "--tag",
        "c",
        "--key",
        "a",
      ])
    ).toMatchObject({
      tag: ["a", "b", "c"],
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
