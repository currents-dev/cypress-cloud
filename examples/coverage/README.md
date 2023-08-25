# Recording Cypress Tests Coverage to Currents

Tests `--experimental-coverage-recording` option.

## Setup

See the example configuration file ['cypress.config.ts]('cypress.config.ts) and [examples/coverage/cypress/support/commands.js](examples/coverage/cypress/support/commands.js)

### Install @cypress/code-coverage plugin

Install the official [@cypress/code-coverage](https://www.npmjs.com/package/@cypress/code-coverage) plugin together with the `@cypress/code-coverage/support` support file.

Add [code instrumentation](https://github.com/cypress-io/code-coverage#instrument-your-application) and optionally add `@cypress/code-coverage/use-babelrc` for on-the-fly preprocessing.

### Install `cypress-cloud`

Install `cypress-cloud` plugin **after** `@cypress/code-coverage`.

Provide `coverageFile` cypress environment property in `cypress.config.{jt}s` file for a custom location of the coverage files. The default value is `./.nyc_output/out.json`

### Start Example Server

```sh
npm run start
```

### Start `cypress-cloud` execution

```sh
npx cypress-cloud run --parallel --record --key currents_key --ci-build-id `date +%s` --experimental-coverage-recording
```

## Development

```bash
npm run cy2
```
