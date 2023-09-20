# Debug, troubleshoot and record Cypress CI tests in Cloud

Integrate Cypress with alternative cloud services like Currents or Sorry Cypress.

**[Currents](https://currents.dev/?utm_source=cypress-cloud)** - a drop-in replacement for Cypress Dashboard. Run, debug, troubleshoot and analyze parallel CI tests in cloud. This is an enhanced version of Sorry Cypress with better security, performance, analytics, integrations and support.

**[Sorry Cypress](https://sorry-cypress.dev/?utm_source=cypress-cloud)** - is an open-source, free alternative to Cypress Dashboard that unlocks unlimited parallelization, test recordings, and integration with GitHub, Slack and more.

<p align="center">
  <img width="830" src="https://user-images.githubusercontent.com/1637928/213367982-78987b7a-411a-4d2e-9486-ca204847022e.png" />
</p>

<p align="center">
<a href="../CHANGELOG.md">Changelog</a> | <a href="https://currents.dev/readme/guides/cypress-compatibility">Compatibility</a> |
<a href="https://currents.dev/readme">Documentation</a> | <a href="https://github.com/currents-dev/cypress-cloud/blob/main/LICENSE.md">License</a>

</p>

## Table of Contents

- [Requirements](#requirements)
- [Setup](#setup)
- [Usage](#usage)
- [Example](#example)
- [Configuration](#configuration)
  - [Configuration File Discovery](#configuration-file-discovery)
  - [Configuration Overrides](#configuration-overrides)
- [Batched Orchestration](#batched-orchestration)
- [API](#api)
  - [`run`](#run)
- [Guides](#guides)
  - [Usage with `@cypress/grep`](#usage-with-cypressgrep)
  - [Setup with existing plugins](#setup-with-existing-plugins)
    - [Preserving `config.env` values](#preserving-configenv-values)
    - [Chaining `config`](#chaining-config)
    - [Event callbacks for multiple plugins](#event-callbacks-for-multiple-plugins)
- [Spec files discovery](#spec-files-discovery)
- [Usage with ESM project](#usage-with-esm-project)
- [Troubleshooting](#troubleshooting)
- [Testing](#testing)
- [Releasing](#releasing)
  - [Beta channel](#beta-channel)
  - [Latest channel](#latest-channel)
  - [Localhost](#localhost)

## Requirements

- Cypress version 10+
- NodeJS 14.7.0+

## Setup

Install the package:

```sh
npm install cypress-cloud
```

- Create a new configuration file: `currents.config.js|mjs|cjs` in the Cypress project’s root. Use `--cloud-config-file` to explicitly provide the configuration file. Using ESM project? See the guide below.
- Set the `projectId` and the record key obtained from [Currents](https://app.currents.dev) or your self-hosted instance of Sorry Cypress:

```js
// currents.config.js
module.exports = {
  projectId: "Ij0RfK",
  recordKey: "xxx",
  // Sorry Cypress users - set the director service URL
  cloudServiceUrl: "https://cy.currents.dev",
};
```

Add `cypress-cloud/plugin` to `cypress.config.{js|ts|mjs}`

```ts
// cypress.config.js
import { defineConfig } from "cypress";
import { cloudPlugin } from "cypress-cloud/plugin";
export default defineConfig({
  e2e: {
    async setupNodeEvents(on, config) {
      const result = await cloudPlugin(on, config);
      return result;
    },
  },
});
```

Add `cypress-cloud/support` to Cypress Support file (matching your test type - e2e or component, or both)

```ts
import "cypress-cloud/support";
```

## Usage

```sh
npx cypress-cloud --parallel --record --key <your_key> --ci-build-id hello-cypress-cloud
```

`cypress-cloud` is designed for use in a headless mode in a CI environment, it provides the same flags and options as `cypress` command, but certain flags are preset and hidden. See all the available options `npx cypress-cloud --help`.

Learn more about [CI Build ID](https://currents.dev/readme/guides/cypress-ci-build-id) and [Parallelization](https://currents.dev/readme/guides/parallelization).

## Example

See an example in [examples/webapp](https://github.com/currents-dev/cypress-cloud/blob/main/examples/webapp) directory.

## Configuration

```js
// currents.config.js
module.exports = {
  projectId: "Ij0RfK", // Project Id obtained from https://app.currents.dev or Sorry Cypress
  recordKey: "XXXXXXX", // Record key obtained from https://app.currents.dev, any value for Sorry Cypress
  cloudServiceUrl: "https://cy.currents.dev", // Sorry Cypress users - the director service URL
  // Additional headers for network requests, undefined by default
  networkHeaders: {
    "User-Agent": "Custom",
    "x-ms-blob-type": "BlockBlob"
  }
  e2e: {
    batchSize: 3, // orchestration batch size for e2e tests (Currents only, read below)
  },
  component: {
    batchSize: 5, // orchestration batch size for component tests (Currents only, read below)
  },
};
```

### Configuration File Discovery

`cypress-cloud` will search for a configuration file as follows:

- if `--cloud-config-file <string>` is defined, use its value

  - use it as-is for absolute paths
  - if it's a relative path, use the project's root location (defined with `-P --project` CLI option) as the base directory

- otherwise, use the default filenames in the project's root location (defined with `-P --project` CLI option) in the following order:
  - `currents.config.js`
  - `currents.config.cjs`
  - `currents.config.mjs`

The configuration file will be read using [`import()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import) expression. Please make sure to use the correct syntax if you're using ESM modules (see the guide below).

### Configuration Overrides

You can override the configuration values via environment variables:

- `CURRENTS_API_URL` - sorry-cypress users - set the URL of your director service
- `CURRENTS_PROJECT_ID` - set the `projectId`
- `CURRENTS_RECORD_KEY` - cloud service record key

The configuration variables will resolve as follows:

- the corresponding CLI flag or `run` function parameter, otherwise
- environment variable if exist, otherwise
- configuration file `currents.config.js|cjs|mjs` value, otherwise
- the default value, otherwise throw

## Batched Orchestration

This package uses its own orchestration and reporting protocol that is independent of cypress native implementation. The new [orchestration protocol]([https://currents.dev/readme/integration-with-cypress/cypress-cloud#batched-orchestration](https://currents.dev/readme/integration-with-cypress/cypress-cloud/batched-orchestration)) uses cypress in "offline" mode and allows batching multiple spec files for better efficiency. You can adjust the batching configuration in `currents.config.js` and use different values for e2e and component tests.

## API

### `run`

Run Cypress tests programmatically. See [`./examples/webapp/scripts`](https://github.com/currents-dev/cypress-cloud/blob/main/examples/webapp/scripts) for examples.

```ts
run(params: CurrentsRunAPI): Promise<CypressCommandLine.CypressRunResult | undefined>
```

- `params` - [`CurrentsRunAPI`](./packages/cypress-cloud/types.ts) list of params. It is an extended version of Cypress [Module API](https://docs.cypress.io/guides/guides/module-api)
- return execution results as [`CypressCommandLine.CypressRunResult | undefined`](./packages/cypress-cloud/types.ts)

Example:

```ts
import { run } from "cypress-cloud";

const results = await run({
  recordKey: "some",
  reporter: "junit",
  browser: "chrome",
  config: {
    baseUrl: "http://localhost:8080",
    video: true,
  },
});
```

## Guides

### Usage with `@cypress/grep`

The package is compatible with [`@cypress/grep`](https://www.npmjs.com/package/@cypress/grep).

`@cypress/grep` modifies cypress configuration and alters `specPattern` property. Install `@cypress/grep` **before** `cypress-cloud/plugin` to apply the modified configuration. For example:

```ts
import { defineConfig } from "cypress";
import grepPlugin from "@cypress/grep/src/plugin";
import { cloudPlugin } from "cypress-cloud/plugin";

export default defineConfig({
  e2e: {
    // ...
    async setupNodeEvents(on, config) {
      grepPlugin(config);
      const result = await cloudPlugin(on, config);
      return result;
    },
  },
});
```

Please refer to the [issue](https://github.com/currents-dev/cypress-cloud/issues/50#issuecomment-1645095284) for details.

### Setup with existing plugins

#### Preserving `config.env` values

The `config` parameter of `setupNodeEvents(on, config)` has pre-defined `config.env` values. Please make sure to preserve the original `config.env` value when altering the property. For example:

```ts
import { defineConfig } from "cypress";
import { cloudPlugin } from "cypress-cloud/plugin";

export default defineConfig({
  e2e: {
    // ...
    async setupNodeEvents(on, config) {
      const enhancedConfig = {
        env: {
          ...config.env, // 👈🏻 preserve the original env
          customVariable: "value",
        },
      };
      const result = await cloudPlugin(on, enhancedConfig);
      return result;
    },
  },
});
```

#### Chaining `config`

Certain plugins (e.g. `@cypress/grep`) modify or alter the `config` parameter and change the default Cypress behaviour. Make sure that `cypress-cloud` is initialized with the most recently updated `config`, e.g.:

```ts
import { defineConfig } from "cypress";
import { cloudPlugin } from "cypress-cloud/plugin";

export default defineConfig({
  e2e: {
    // ...
    async setupNodeEvents(on, config) {
      const configA = pluginA(on, config); // configA has the modified config from pluginA
      const configB = pluginB(on, configA); // configA has the modified config from pluginA + pluginB
      // ...
      const configX = pluginX(on, configY); // configX has the modified config from all preceding plugins
      const result = await cloudPlugin(on, configX); // cloudPlugin has the accumulated config from all plugins
      return result;
    },
  },
});
```

#### Event callbacks for multiple plugins

`cypress-cloud/plugin` uses certain Cypress Plugin events. Unfortunately if there are mutliple listeners for an event, only the last listener is called (see the [GitHub issue](https://github.com/cypress-io/cypress/issues/22428)). Setups with multiple plugins can create conflicts - one plugin can replace listeners of others.

The existing workaround is to patch the `on` function by using either of:

- https://github.com/bahmutov/cypress-on-fix
- https://github.com/elaichenkov/cypress-plugin-init

For example:

```ts
import { defineConfig } from "cypress";
import { cloudPlugin } from "cypress-cloud/plugin";
import patchCypressOn from "cypress-on-fix";

export default defineConfig({
  e2e: {
    // ...
    async setupNodeEvents(cypressOn, config) {
      const on = patchCypressOn(cypressOn);
      // the rest of the plugins use the patched "on" function
      const configAlt = somePlugin(on, config);
      const result = await cloudPlugin(on, configAlt);
      return result;
    },
  },
});
```

### Spec files discovery

`cypress-cloud` discovers the spec files using [`globby`](https://www.npmjs.com/package/globby) patterns according to the following logic:

- if no `--spec` is provided, use the `specPattern` defined in `cypress.config.{jt}s`
- if `--spec` flag is provided, use the intersection of `specPattern` and `--spec`
- if no spec files were discovered, halt the execution and show a warning

Enable the debug mode to troubleshoot files discovery: `DEBUG=currents:specs npx cypress-cloud ...`

### Usage with ESM project

For ESM projects (`"type": "module"` in `package.json`) you can use one of the following formats:

- `currents.config.cjs` - CommonJS formatted file
- `currents.config.js` - ESM formatted file (i.e. no `require` statements)
- `currents.config.mjs` - ESM formatted file (i.e. no `require` statements)

Also, make sure that your `cypress.config.js|mjs|cjs|ts` is formatted accordingly. See examples in [`./e2e`](./e2e) directory.

## Troubleshooting

Enable the debug mode by adding `--cloud-debug true | all | cypress | currents | commit-info` flag

- `true | all` enable debug mode for all the tools
- `cypress` activate debug mode for cypress only
- `currents` activate the debug mode for currents only
- `commit-info` activate the debug mode for git commit info only

```sh
# show all the debug information
npx cypress-cloud run ... --cloud-debug

# show only currents related debug information
npx cypress-cloud run ... --cloud-debug currents,commit-info
```

Capture all the logs as a plain text file and share it with the support team for further troubleshooting.

## Testing

```sh
npm run test
```

> Please note, we use `esbuild` for building and `swc` for testing. In addition, jest has built-in module aliases, but eslint does not. Beware of importing aliases in non-testing code.

## Releasing

### Beta channel

```sh
cd packages/cypress-cloud
npm run release -- --preRelease=beta && npm run release:npm -- -t beta
```

### Latest channel

```sh
cd packages/cypress-cloud
npm run release && npm run release:npm -- -t latest
```

### Localhost

Publishing from `packages/cypress-cloud`:

```sh
docker run -it --rm --name verdaccio -p 4873:4873 verdaccio/verdaccio
npm adduser --registry http://localhost:4873
npm login --registry http://localhost:4873
npm_config_registry=http://localhost:4873  npm run release:npm -- --tag latest
```

Using:

```sh
npm install cypress-cloud --registry http://localhost:4873
```

## License

GNU General Public License Version 3

Copyright (C) 2023 Currents Software Inc https://currents.dev.

This is free software, and you are welcome to redistribute it under certain
conditions. This program comes with no warranty. Parts of this program are MIT
licensed. Refer to the license for details
https://github.com/currents-dev/cypress-cloud/blob/main/LICENSE.md

## Disclaimer

This software is not affiliated with Cypress.io Inc. All third-party trademarks and materials (including logos, icons and labels) referenced herein are the property of their respective owners. The third-party products or services that this software connects to are subject to their respective owners, please refer to their intellectual property and terms of service agreements.
