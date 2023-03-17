#!/usr/bin/env node
import "source-map-support/register";

import { run } from "../index";
import { parseOptions } from "../lib/cli";
import { program } from "../lib/cli/program";
import { divider, withError } from "../lib/log";

async function main() {
  return run(await parseOptions());
}

main()
  .then((result) => {
    if (!result) {
      process.exit(0);
    }

    const overallFailed = result.failures + result.skipped;
    if (overallFailed > 0) {
      process.exit(overallFailed);
    }
    process.exit(0);
  })
  .catch((err) => {
    divider();
    // error(err.stack);
    program.error(withError(err));
    // process.exit(1);
  });
