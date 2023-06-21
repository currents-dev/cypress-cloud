## Requirements
- Cypress version 10+
- NodeJS 14.7.0+

## Setup
Install the package:
```bash
npm install --save-dev @deploysentinel/cypress-parallel
```

Add `@deploysentinel/cypress-parallel/plugin` to `cypress.config.{js|ts|mjs}`
```js
// cypress.config.js
const { defineConfig } = require("cypress");
const { cloudPlugin } = require("@deploysentinel/cypress-parallel/plugin");
module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      return cloudPlugin(on, config);
    },
  },
});
```

## Usage
```
CYPRESS_DEPLOYSENTINEL_KEY=YOUR_API_KEY CYPRESS_PROJECT_ID=000000 npx cypress-parallel --parallel --record --ci-build-id JUST_TESTING_LOCALLY
```
