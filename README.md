# Cypress Cloud

### Currents Example

```
cd packages/cypress-runner
yarn build
```

... then in another terminal

```
cd examples/nextjs
node ../../packages/cypress-runner --parallel --record --key xxx --ci-build-id parallel-05
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
