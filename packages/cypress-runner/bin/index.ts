#!/usr/bin/env node

import { run } from "../index";

run()
  .then((result) => {
    const overallFailed = result.failed + result.skipped;
    if (overallFailed > 0) {
      process.exit(overallFailed);
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
