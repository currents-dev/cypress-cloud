# Example Usage of cypress-cloud

To run the example, make sure that you have an account at https://app.currents.dev or Sorry Cypress instance. You can start a basic local instance of sorry-cypress:

```sh
docker run -p 1234:1234 --platform linux/amd64 agoldis/sorry-cypress-director
```

## Configuration

Update `currents.config.js` with the `projectId`, `recordKey` obtained from a cloud orchestration service. Sorry Cypress users - use the director service URL as `cloudServiceUrl`.

```js
// currents.config.js
module.exports = {
  projectId: "yyy", // the projectId, can be any values for sorry-cypress users
  recordKey: "xxx", // the record key, can be any value for sorry-cypress users
  cloudServiceUrl: "http://localhost:1234", // Sorry Cypress users - set the director service URL, Currents customer - remove this option
};
```

## CLI Usage

Use the following commands to run cypress tests

### E2E tests

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
