#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const pkg = require("./package.json");

const { Command, Option } = require("./bin/lib/@commander-js/extra-typings");

const program = new Command()
  .name("publish")
  .option("-t, --tag <beta | latest>", "npm dist-tag to publish to");

program.parse(process.argv);
const options = program.opts();

console.log(options);
if (!options.tag) {
  console.log("No tag supplied: beta or latest");
  process.exit(1);
}

const newPkg = {
  ...pkg,
  main: "./index.js",
  bin: {
    "cypress-cloud": "./bin/cli.js",
  },
  files: ["*"],
  bin: "./bin/cli.js",
  exports: {
    ".": {
      import: "./index.mjs",
      require: "./index.js",
      types: "./index.d.ts",
    },
    "./plugin": {
      import: "./plugin/index.js",
      require: "./plugin/index.js",
      types: "./plugin/index.d.ts",
    },
    "./support": {
      import: "./support/index.js",
      require: "./support/index.js",
      types: "./support/index.d.ts",
    },
    "./package.json": "./package.json",
  },
};
fs.copyFileSync("./README.md", "./dist/README.md");
fs.copyFileSync("../../LICENSE.md", "./dist/LICENSE.md");
fs.writeFileSync(
  "./dist/package.json",
  JSON.stringify(newPkg, null, 2),
  "utf-8"
);
execSync(`npm pack --dry-run && npm publish --tag ${options.tag}`, {
  cwd: "./dist",
  stdio: "inherit",
});
