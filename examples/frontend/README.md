## Coverage recording

Tests `--experimental-coverage-recording` option.

## Setup

- install [@cypress/code-coverage](https://www.npmjs.com/package/@cypress/code-coverage) plugin
- add `cypress-cloud` plugin after the `@cypress/code-coverage` plugin
- provide `coverageFile` environment option in cypress config file for a custom coverage file

## Development

```bash
npm run test
```