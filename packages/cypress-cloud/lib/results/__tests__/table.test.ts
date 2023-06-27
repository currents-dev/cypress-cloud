import { expect } from "@jest/globals";
import { MergedConfig } from "../../config";
import { summarizeTestResults } from "../results";
import { summaryTable } from "../table";
import commonPath from "./fixtures/payloads/cypressResult/no-exception/common-path";
import mixedResults from "./fixtures/payloads/cypressResult/no-exception/mixed";
import singleFailed from "./fixtures/payloads/cypressResult/no-exception/single-failed";
import singlePassed from "./fixtures/payloads/cypressResult/no-exception/single-passed";

describe("Table", () => {
  it("renders table with failed tests correctly", () => {
    const result = summaryTable(
      // @ts-ignore
      summarizeTestResults(Object.values(singleFailed), {} as MergedConfig)
    );

    expect(result).toMatchSnapshot();
  });

  it("renders table with only successful tests correctly", () => {
    const result = summaryTable(
      // @ts-ignore
      summarizeTestResults(Object.values(singlePassed), {} as MergedConfig)
    );
    expect(result).toMatchSnapshot();
  });

  it("renders table with mixed results ", () => {
    const result = summaryTable(
      // @ts-ignore
      summarizeTestResults(Object.values(mixedResults), {} as MergedConfig)
    );
    expect(result).toMatchSnapshot();
  });

  it("renders common path stripped", () => {
    const result = summaryTable(
      // @ts-ignore
      summarizeTestResults(Object.values(commonPath), {} as MergedConfig)
    );
    expect(result).toMatchSnapshot();
  });
});
