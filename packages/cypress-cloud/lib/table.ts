import commonPathPrefix from "common-path-prefix";
import { mapValues, sum } from "lodash";
import prettyMS from "pretty-ms";
import { table } from "table";
import { SummaryResults } from "../types";
import { cyan, gray, green, red, white } from "./log";
import { summarizeTestResults } from "./results/results";

const failureIcon = red("✖");
const successIcon = green("✔");

export const summaryTable = (r: SummaryResults) => {
  const testsOverall = summarizeTestResults(Object.values(r));
  const overallDuration = sum(Object.values(r).map((v) => v.totalDuration));
  const overallSpecCount = Object.keys(r).length;
  const failedSpecsCount = sum(
    Object.values(r)
      .filter((v) => v.totalFailed + v.totalSkipped > 0)
      .map(() => 1)
  );
  const hasFailed = failedSpecsCount > 0;
  const verdict = hasFailed
    ? red(`${failedSpecsCount} of ${overallSpecCount} failed`)
    : "All specs passed!";

  const commonPrefix = commonPathPrefix(Object.keys(r));

  const data = Object.entries(r).map(([k, v]) => [
    v.totalFailed + v.totalSkipped > 0 ? failureIcon : successIcon,
    k.replace(commonPrefix, ""),
    gray(prettyMS(v.totalDuration)),
    white(v.totalTests ?? 0),
    v.totalPassed ? green(v.totalPassed) : gray("-"),
    v.totalFailed ? red(v.totalFailed) : gray("-"),
    v.totalPending ? cyan(v.totalPending) : gray("-"),
    v.totalSkipped ? red(v.totalSkipped) : gray("-"),
  ]);

  return table(
    [
      [
        "", // marker
        gray("Spec"),
        "",
        gray("Tests"),
        gray("Passing"),
        gray("Failing"),
        gray("Pending"),
        gray("Skipped"),
      ],
      ...data,
      [
        hasFailed ? failureIcon : successIcon, // marker
        verdict,
        gray(prettyMS(overallDuration ?? 0)),
        white(testsOverall.tests ?? 0),
        testsOverall.passes ? green(testsOverall.passes) : gray("-"),
        testsOverall.failures ? red(testsOverall.failures) : gray("-"),
        testsOverall.pending ? cyan(testsOverall.pending) : gray("-"),
        testsOverall.skipped ? red(testsOverall.skipped) : gray("-"),
      ],
    ],
    {
      border,
      columnDefault: {
        width: 8,
      },
      columns: [
        { alignment: "left", width: 2 },
        { alignment: "left", width: 30 },
        { alignment: "right" },
        { alignment: "right" },
        { alignment: "right" },
        { alignment: "right" },
        { alignment: "right" },
        { alignment: "right" },
      ],
      // singleLine: true,
      drawHorizontalLine: (lineIndex, rowCount) => {
        return (
          lineIndex === 1 ||
          lineIndex === 0 ||
          lineIndex === rowCount - 1 ||
          lineIndex === rowCount
        );
      },
      drawVerticalLine: (lineIndex, rowCount) => {
        return lineIndex === 0 || rowCount === lineIndex;
      },
    }
  );
};

const border = mapValues(
  {
    topBody: `─`,
    topJoin: `┬`,
    topLeft: `  ┌`,
    topRight: `┐`,

    bottomBody: `─`,
    bottomJoin: `┴`,
    bottomLeft: `  └`,
    bottomRight: `┘`,

    bodyLeft: `  │`,
    bodyRight: `│`,
    bodyJoin: `│`,

    joinBody: `─`,
    joinLeft: `  ├`,
    joinRight: `┤`,
    joinJoin: `┼`,
  },
  (v) => gray(v)
);
