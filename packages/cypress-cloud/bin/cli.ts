#!/usr/bin/env node
import "source-map-support/register";

import { parseCLIOptions } from "../lib/cli";
import { program } from "../lib/cli/program";
import { withError } from "../lib/log";
import { run } from "../lib/run";

async function main() {
  return run(parseCLIOptions());
}

main()
  .then((result) => {
    if (!result) {
      process.exit(0);
    }

    const overallFailed = result.totalFailed + result.totalSkipped;
    if (overallFailed > 0) {
      process.exit(overallFailed);
    }
    process.exit(0);
  })
  .catch((err) => {
    program.error(withError(err));
  });
