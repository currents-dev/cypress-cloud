# Debug, troubleshoot and record Cypress CI tests in Cloud

Integrate Cypress with alternative cloud services like Currents or Sorry Cypress.

**[Currents](https://currents.dev/?utm_source=cypress-cloud)** - a drop-in replacement for Cypress Dashboard. Run, debug, troubleshoot and analyze parallel CI tests in cloud. This is an enhanced version of Sorry Cypress with better security, performance, analytics, integrations and support.

**[Sorry Cypress](https://sorry-cypress.dev/?utm_source=cypress-cloud)** - is an open-source, free alternative to Cypress Dashboard that unlocks unlimited parallelization, test recordings, and integration with GitHub, Slack and more.

<p align="center">
  <img width="830" src="https://user-images.githubusercontent.com/1637928/213367982-78987b7a-411a-4d2e-9486-ca204847022e.png" />
</p>

<p align="center">
<a href="../CHANGELOG.md">Changelog</a> | <a href="https://currents.dev/readme/guides/cypress-compatibility">Compatibility</a> |
<a href="https://currents.dev/readme">Documentation</a> | <a href="./packages/cypress-cloud/LICENSE.md">License</a>

</p>

## Requirements

The package requires cypress version 10+ and NodeJS 14.7.0+

## Setup

Install the package:

```sh
npm install cypress-cloud
```

Create a new configuration file: `currents.config.js` in the project’s root, set the `projectId` and the record key obtained from [Currents](https://app.currents.dev) or your self-hosted instance of Sorry Cypress:

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

See all the available options `npx cypress-cloud --help`. Learn more about [CI Build ID](https://currents.dev/readme/guides/cypress-ci-build-id).

## Example

See an example in [examples/webapp](https://github.com/currents-dev/cypress-cloud/blob/main/examples/webapp) directory.

## Configuration

```js
// currents.config.js
module.exports = {
  projectId: "Ij0RfK", // ProjectID obtained from https://app.currents.dev or Sorry Cypress
  recordKey: "XXXXXXX", // Record key obtained from https://app.currents.dev, any value for Sorry Cypress
  cloudServiceUrl: "https://cy.currents.dev", // Sorry Cypress users - the director service URL
  e2e: {
    batchSize: 3, // orchestration batch size for e2e tests (Currents only, read below)
  },
  component: {
    batchSize: 5, // orchestration batch size for component tests (Currents only, read below)
  },
};
```

Override the default configuration values via environment variables:

- `CURRENTS_API_URL` - sorry-cypress users - set the URL of your director service
- `CURRENTS_PROJECT_ID` - set the `projectId`
- `CURRENTS_RECORD_KEY` - cloud service record key

## Batched Orchestration

This package uses its own orchestration and reporting protocol that is independent of cypress native implementation. The new [orchestration protocol](https://currents.dev/readme/integration-with-cypress/cypress-cloud#batched-orchestration) allows multiple spec files to be batched together for better efficiency. You can adjust the batching configuration in `cypress.config.js` and use different values for e2e and component tests.

## API

### `run`

Run Cypress tests programmatically

```ts
run(params: CurrentsRunParameters): Promise<CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult>
```

- `params` - [CurrentsRunParameters](./packages/cypress-cloud/types.ts#L123) list of params compatible with Cypress [Module API](https://docs.cypress.io/guides/guides/module-api)

- returns results as a [CypressRunResult](https://github.com/cypress-io/cypress/blob/19e091d0bc2d1f4e6a6e62d2f81ea6a2f60d531a/cli/types/cypress-npm-api.d.ts#L277)

Example:

```ts
import { run } from "cypress-cloud";

const results = await run({
  reporter: "junit",
  browser: "chrome",
  config: {
    baseUrl: "http://localhost:8080",
    video: true,
  },
});
```

## Troubleshooting

Enable the debug mode and run the command:

```sh
DEBUG=currents:* npx cypress-cloud run ...
```

Capture all the logs in a plain text file and submit an issue.

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
