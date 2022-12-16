import { Command } from "commander";
import { attachOptions, parseOptions } from "..";

const getProgram = () =>
  attachOptions(new Command())
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
    expect(
      parseOptions(getProgram(), ["program", "command", "--key", "a"])
    ).toMatchObject({
      component: false,
      e2e: true,
    });
  });

  it("using component implies e2e is false", async () => {
    expect(
      parseOptions(getProgram(), [
        "program",
        "command",
        "--component",
        "--key",
        "a",
      ])
    ).toMatchObject({
      component: true,
      e2e: false,
    });
  });

  it("using e2e implies component false", async () => {
    expect(
      parseOptions(getProgram(), ["program", "command", "--e2e", "--key", "a"])
    ).toMatchObject({
      component: false,
      e2e: true,
    });
  });
});
