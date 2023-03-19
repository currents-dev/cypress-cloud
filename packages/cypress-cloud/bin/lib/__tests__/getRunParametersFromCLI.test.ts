import { expect } from "@jest/globals";
import { getRunParametersFromCLI } from "../cli";

describe("getRunParametersFromCLI", () => {
  it("should omit e2e", async () => {
    expect(
      // @ts-expect-error
      getRunParametersFromCLI({
        e2e: true,
      })
    ).not.toHaveProperty("e2e");
  });

  it("should omit component", async () => {
    expect(
      // @ts-expect-error
      getRunParametersFromCLI({
        component: true,
      })
    ).not.toHaveProperty("component");
  });

  it("should set config", async () => {
    expect(
      // @ts-expect-error
      getRunParametersFromCLI({
        config: JSON.stringify({
          a: "b",
          c: 1,
          d: {
            nested: true,
          },
        }),
      })
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

  it("should set testing type for e2e", async () => {
    expect(
      // @ts-expect-error
      getRunParametersFromCLI({
        e2e: true,
      })
    ).toMatchObject({
      testingType: "e2e",
    });
  });

  it("should set testing type for component", async () => {
    expect(
      // @ts-expect-error
      getRunParametersFromCLI({
        component: true,
      })
    ).toMatchObject({
      testingType: "component",
    });
  });
  it("should set recordKey", async () => {
    expect(
      // @ts-expect-error
      getRunParametersFromCLI({
        key: "cliKey",
      })
    ).toMatchObject({
      recordKey: "cliKey",
    });
  });
});
