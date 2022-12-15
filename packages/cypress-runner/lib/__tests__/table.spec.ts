import { summaryTable } from "../table";

describe("Table", () => {
  it("renders table with failed tests correctly", () => {
    const result = summaryTable({
      "spec.a.js": {
        totalDuration: 42343,
        totalPassed: 1,
        totalFailed: 0,
        totalPending: 0,
        totalSkipped: 0,
        totalTests: 1,
      },
      "spec.b.js": {
        totalDuration: 112332,
        totalPassed: 4,
        totalFailed: 5,
        totalPending: 3,
        totalSkipped: 1,
        totalTests: 13,
      },
      "spec.c.js": {
        totalDuration: 33,
        totalPassed: 4,
        totalFailed: 5,
        totalPending: 0,
        totalSkipped: 0,
        totalTests: 9,
      },
    });
    expect(result).toMatchSnapshot();
  });

  it("renders table with only successful tests correctly", () => {
    const result = summaryTable({
      "spec.a.js": {
        totalDuration: 42343,
        totalPassed: 1,
        totalFailed: 0,
        totalPending: 0,
        totalSkipped: 0,
        totalTests: 1,
      },
      "spec.b.js": {
        totalDuration: 112332,
        totalPassed: 4,
        totalFailed: 0,
        totalPending: 3,
        totalSkipped: 0,
        totalTests: 7,
      },
      "spec.c.js": {
        totalDuration: 343,
        totalPassed: 4,
        totalFailed: 0,
        totalPending: 0,
        totalSkipped: 0,
        totalTests: 4,
      },
    });
    expect(result).toMatchSnapshot();
  });

  it("renders common path stripped", () => {
    const result = summaryTable({
      "cypress/b/spec.a.js": {
        totalDuration: 42343,
        totalPassed: 1,
        totalFailed: 0,
        totalPending: 0,
        totalSkipped: 0,
        totalTests: 1,
      },
      "cypress/b/spec.b.js": {
        totalDuration: 112332,
        totalPassed: 4,
        totalFailed: 0,
        totalPending: 3,
        totalSkipped: 0,
        totalTests: 7,
      },
      "cypress/a/spec.c.js": {
        totalDuration: 343,
        totalPassed: 4,
        totalFailed: 0,
        totalPending: 0,
        totalSkipped: 0,
        totalTests: 4,
      },
    });
    expect(result).toMatchSnapshot();
  });
});
