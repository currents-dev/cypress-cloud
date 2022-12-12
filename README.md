### Currents 2.0

This is an experimental package that integrates cypress with Currents (and sorry cypress). It implements the orchestration protocol and results reporting, mimicking the internal cypress implementation. It runs cypress in "local" mode, explicitly providing the specific spec file to run each time.

The flow is:

- Get resolved cypress configuration
  - Run cypress as a child process with non-existing spec file
  - Dump the resolved config to a temp file (using the cypress plugin)
  - Collect resolved configuration from a temp file
- Discover spec files that need to run using the config file
- Create a new run in dashboard, start running spec files, invoking cypress from scratch for each spec file
- Upload results

## Setup

See an example setup in `examples/nextjs` directory:

- note the "plugin" in `examples/nextjs/cypress.config.ts`
- projectId is defined in `currents.config.js`

To run an example, make sure that currents is running locally and then:

```
cd packages/cypress-runner
yarn build
```

... then in another terminal

```
cd examples/nextjs
node ../../packages/cypress-runner --parallel --record --key xxx --ci-build-id `date +%s`
```

## What's inside?

This turborepo uses [Yarn](https://yarnpkg.com/) as a package manager. It includes the following packages/apps:

### Examples and Packages

- `nextjs`: an example [Next.js](https://nextjs.org/) app with Currents Cypress Cloud setup
- `eslint-config-custom`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)

Each package/example is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```
cd cypress-cloud
yarn run build
```

### Develop

To develop all apps and packages, run the following command:

```
cd cypress-cloud
yarn run dev
```
