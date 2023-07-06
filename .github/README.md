# Debug, troubleshoot and record Cypress CI tests in Cloud

Integrate Cypress with alternative cloud services like Currents or Sorry Cypress.

**[Currents](https://currents.dev/?utm_source=cypress-cloud)** - a drop-in replacement for Cypress Dashboard. Run, debug, troubleshoot and analyze parallel CI tests in cloud. This is an enhanced version of Sorry Cypress with better security, performance, analytics, integrations and support.

**[Sorry Cypress](https://sorry-cypress.dev/?utm_source=cypress-cloud)** - is an open-source, free alternative to Cypress Dashboard that unlocks unlimited parallelization, test recordings, and integration with GitHub, Slack and more.

<p align="center">
  <img width="830" src="https://user-images.githubusercontent.com/1637928/213367982-78987b7a-411a-4d2e-9486-ca204847022e.png" />
</p>

<p align="center">
<a href="../CHANGELOG.md">Changelog</a> | <a href="https://currents.dev/readme/guides/cypress-compatibility">Compatibility</a> |
<a href="https://currents.dev/readme">Documentation</a> | <a href="./LICENSE.md">License</a>

</p>

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

```js
// cypress.config.js
const { defineConfig } = require("cypress");
const { cloudPlugin } = require("cypress-cloud/plugin");
module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      return cloudPlugin(on, config);
    },
  },
});
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

This package uses its own orchestration and reporting protocol that is independent of cypress native implementation. The new [orchestration protocol](https://currents.dev/readme/integration-with-cypress/cypress-cloud#batched-orchestration) uses cypress in "offline" mode and allows batching multiple spec files for better efficiency. You can adjust the batching configuration in `currents.config.js` and use different values for e2e and component tests.

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

### Setup with existing plugins

`cypress-cloud/plugin` needs access to certain environment variables that are injected into the `config` parameter of `setupNodeEvents(on, config)`.

Please make sure to preserve the original `config.env` parameters in case you are using additional plugins, e.g.:

```js
const { defineConfig } = require("cypress");
const { cloudPlugin } = require("cypress-cloud/plugin");

module.exports = defineConfig({
  e2e: {
    // ...
    setupNodeEvents(on, config) {
      // alternative: activate the plugin first
      // cloudPlugin(on, config)
      const enhancedConfig = {
        env: {
          // preserve the original env
          ...config.env,
          customVariable: "value",
        },
      };
      return cloudPlugin(on, enhancedConfig);
    },
  },
});
```

As an alternative, you can activate the `cloudPlugin` first, and then implement the custom setup. Please contact our support if you have a complex plugin configuration to get assistance with the setup.

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

## Disclaimer

This software is not affiliated with Cypress.io Inc. All third-party trademarks and materials (including logos, icons and labels) referenced herein are the property of their respective owners. The third-party products or services that this software connects to are subject to their respective owners, please refer to their intellectual property and terms of service agreements.
