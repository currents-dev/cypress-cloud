# Happo + Currents + Cypress

An example showcasing setting up Happo with Currents.

```sh
export CURRENTS_RECORD_KEY=zzz
export HAPPO_API=yyy
export HAPPO_SECRET=xxx
npx happo-e2e -- npx cypress-cloud run --parallel --record --ci-build-id `date +%s`

[HAPPO] Listening on port 5339
Using config file: 'file:///Users/agoldis/cypress-cloud/examples/happo/currents.config.js'
Discovered 1 spec files
Tags: false; Group: false; Parallel: true; Batch Size: 2
Connecting to cloud orchestration service...

...

🏁 Recorded Run: https://app.currents.dev/run/9e2a97f99ec1ef16
[HAPPO] https://happo.io/a/1182/jobs/1338306
```

Note the use of [cypress-on-fix]() in [`cypress.config.ts`](examples/happo/cypress.config.ts) due to Cypress [bug](https://github.com/cypress-io/cypress/issues/5240)

![currents-2024-08-30-14 04 10@2x](https://github.com/user-attachments/assets/35ed8b0b-3951-406b-a1bd-0b8e9382e355)
