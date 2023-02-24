# Example Usage of Cypress Cloud (@currents/cypress)

## CLI Usage

To run the example, make sure that you have an account at https://app.currents.dev (or Sorry Cypress instance).

### E2E tests

Update `currents.config.js` with the `projectId` obtained from a cloud orchestration service.

```sh
npm install
npx cypress-cloud --parallel --record --key your_key  --ci-build-id hello-cypress-cloud
```

### Component tests

```sh
npm install
npm run build && npm run start
npx cypress-cloud --parallel --record --key your_key --component  --ci-build-id hello-cypress-cloud
```

## API Usage

Take a look at [`./scripts/currents-script.ts`](./scripts/currents-script.ts) with the record key and the projectId you've obtained from a cloud orchestration service.

```sh
npm run cypress:script
```
