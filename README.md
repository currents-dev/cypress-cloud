# Cypress Cloud (@currents/cypress)

Integrate Cypress with alternative cloud services like Currents or Sorry Cypress.

---

**[Currents.dev](https://currents.dev/?utm_source=cy2)** - is a hosted cloud service used to run millions of Cypress tests without breaking the bank. This is an enhanced version of Sorry Cypress with better security, performance, analytics, integrations and support.

**[Sorry Cypress](https://sorry-cypress.dev/?utm_source=cy2)** - is an open-source, free alternative to Cypress Cloud that unlocks unlimited parallelization, test recordings, and integration with GitHub, Slack and more.

---

[Changelog](./CHANGELOG.md) | [License](./LICENSE)

## Setup

Install the package

```sh
npm install @currents/cypress
```

Create a new configuration file: `currents.config.js` in the project’s root and set the `projectId` and the record key obtained from [Currents](https://app.currents.dev) or your self-hosted instance of Sorry Cypress:

```js
module.exports = {
  projectId: "Ij0RfK",
  recordKey: "xxx",
};
```

Add `@currents/cypress/plugin` plugin to `cypress.config.{js|ts|mjs}`

```js
// cypress.config.js
const { defineConfig } = require("cypress");
const { cloudPlugin } = require("@currents/cypress/plugin");
module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      cloudPlugin(on, config);
    },
  },
});
```

## Usage

Obtain the record key from https://app.currents.dev (or use any value for Sorry Cypress)

```sh
npx cypress-cloud --parallel --record --key <your_key> --ci-build-id hello-cypress-cloud
```

See all the available options `npx cypress-cloud --help`

## Example

See an example in [examples/webapp](./example/webapp) directory

## Configuration

```js
// currents.config.js
module.exports = {
  projectId: "Ij0RfK",
  recordKey: "the record key from currents.dev",
};
```

Override the default configuration values via environment variables:

- `CURRENTS_API_URL` - sorry-cypress users - set the URL of your director service
- `CURRENTS_PROJECT_ID` - set the `projectId`
- `CURRENTS_RECORD_KEY` - cloud service record key

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
import { run } from "@currents/cypress";

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

Enable the debug mode and run the command

```sh
DEBUG=currents:* npx cypress-cloud run ...
```

## Testing

```sh
npm run test
```

> Please note, we use `esbuild` for building and `swc` for testing. In addition, jest has built-in module aliases, but eslint does not. Beware of importing aliases in non-testing code.
