import Debug from "debug";
import fs from "fs";
import path from "path";
import { setRunCoverage } from "../api";
import { error } from "../log";

const debug = Debug("currents:coverage");

export interface CoverageStats {
  total: number;
  covered: number;
  skipped: number;
  pct: number | "Unknown";
}
export interface CoverageSummary {
  total: {
    lines: CoverageStats;
    statements: CoverageStats;
    functions: CoverageStats;
    branches: CoverageStats;
    branchesTrue: CoverageStats;
  };
  [x: string]: any;
}

export async function handleCoverageIfExists(
  runId: string,
  config: Cypress.ResolvedConfigOptions
) {
  debug("handling the coverage if exists");
  // check if code coverage tasks were registered
  // https://github.com/cypress-io/code-coverage/blob/319f7a3968b0e34c73109ab57e72489d0b578be4/task.js#L242
  if (!config.env.codeCoverageTasksRegistered) {
    debug("coverage tasks were not registered: %o", config.env);
    return;
  }

  const coverage = readCoverageSummaryFile();

  if (!coverage?.total) {
    debug("coverage summary malformed: %o", coverage);
    return;
  }

  try {
    debug("coverage summary total: %o", coverage.total);
    await setRunCoverage(runId, {
      coverage: coverage.total,
    });
    debug("success setting the run coverage");
  } catch (err) {
    error("Failed to set run coverage: %o", err);
  }
}

function readCoverageSummaryFile() {
  const coverageDir = "coverage";
  const coverageSummaryReport = "coverage-summary.json";
  const coverageSummaryReportPath = path.join(
    process.cwd(),
    coverageDir,
    coverageSummaryReport
  );

  try {
    const jsonString = fs.readFileSync(coverageSummaryReportPath, "utf-8");
    const jsonData = JSON.parse(jsonString) as CoverageSummary;
    return jsonData;
  } catch (err) {
    error(
      "Cannot read the coverage summary report file from path: %s",
      coverageSummaryReportPath
    );
    error(err);
  }
}
