

## [1.4.5-beta.1](https://github.com/currents-dev/cypress-cloud/compare/v1.4.4...v1.4.5-beta.1) (2023-03-16)


### Bug Fixes

* use execa to fix windows exec logic ([#86](https://github.com/currents-dev/cypress-cloud/issues/86)) ([40b99f8](https://github.com/currents-dev/cypress-cloud/commit/40b99f8a6577e9809a0dbdbbd5767720ca121e2f))
* validate params and show verbose errors ([#91](https://github.com/currents-dev/cypress-cloud/issues/91)) ([cc8bfd8](https://github.com/currents-dev/cypress-cloud/commit/cc8bfd854c76aade0c728750ec4b1b239ecf8e76))

## [1.4.5-beta.0](https://github.com/currents-dev/cypress-cloud/compare/v1.4.4...v1.4.5-beta.0) (2023-03-16)


### Bug Fixes

* esm + cjs exports. Resovle [#80](https://github.com/currents-dev/cypress-cloud/issues/80). ([1e9ba34](https://github.com/currents-dev/cypress-cloud/commit/1e9ba34e3d66bf3ba74d81fa263710a943af8ab4))
* prevent side effects on import... kind of ([3c4c794](https://github.com/currents-dev/cypress-cloud/commit/3c4c794c91f591248496211327db9da605c9f29e))
* remove bg color for pending tests in summary ([6f93815](https://github.com/currents-dev/cypress-cloud/commit/6f93815b35cdbf9bf19728f0367ade41f268bce3))
* use execa to fix windows exec logic ([#86](https://github.com/currents-dev/cypress-cloud/issues/86)) ([40b99f8](https://github.com/currents-dev/cypress-cloud/commit/40b99f8a6577e9809a0dbdbbd5767720ca121e2f))

## [1.4.4](https://github.com/currents-dev/cypress-cloud/compare/v1.4.3...v1.4.4) (2023-03-10)


### Bug Fixes

* no multiple warning for loading config file ([#74](https://github.com/currents-dev/cypress-cloud/issues/74)) ([a87ffc7](https://github.com/currents-dev/cypress-cloud/commit/a87ffc7e057a9c202791117ae8ba663fe61d3455)), closes [#68](https://github.com/currents-dev/cypress-cloud/issues/68)
* publish readme on npm ([e9b3f55](https://github.com/currents-dev/cypress-cloud/commit/e9b3f55fdce7dbf2c32f611965ee90322007db0f))

## [1.4.3](https://github.com/currents-dev/cypress-cloud/compare/v1.4.2-beta.0...v1.4.3) (2023-03-10)


### Bug Fixes

* use local @commander-js/extra-typings ([#73](https://github.com/currents-dev/cypress-cloud/issues/73)) ([1c51d66](https://github.com/currents-dev/cypress-cloud/commit/1c51d66b568553b0c946c681784e905e7d3d0a7e)), closes [#71](https://github.com/currents-dev/cypress-cloud/issues/71)

## [1.4.2](https://github.com/currents-dev/cypress-cloud/compare/v1.4.2-beta.0...v1.4.2) (2023-03-10)

### Bug Fixes

- fix TS and CJS exports for published package ([1d3eb57](https://github.com/currents-dev/cypress-cloud/commit/1d3eb5710e5a76057e51ccd5fb92658f6e14ba47))
- use release script ([8f29211](https://github.com/currents-dev/cypress-cloud/commit/8f292119e81a584d17f3c421a2f7a764bf7b27ad))

## [1.4.1](https://github.com/currents-dev/cypress-cloud/compare/v1.4.0...v1.4.1) (2023-03-09)

- Fix documentation for npm

# [1.4.0](https://github.com/currents-dev/cypress-cloud/compare/v1.3.2...v1.4.0) (2023-03-09)

### Bug Fixes

- capture output ([007cf96](https://github.com/currents-dev/cypress-cloud/commit/007cf96a3181b2248a673e27fb8cf92a427ed992))
- report results to sorry-cypress ([7d68b1c](https://github.com/currents-dev/cypress-cloud/commit/7d68b1c519b6d0a4f22694c27b7e3a43b7090b4e))
- screenshots and upload queue ([ac89d74](https://github.com/currents-dev/cypress-cloud/commit/ac89d74cc738220f7639ad11f0332b62ad45c8c6))
- unit test -- use color ([636f3bf](https://github.com/currents-dev/cypress-cloud/commit/636f3bf4c2566b00774aa7ee465fd15404fc5484))

### Features

- add benchmark CI ([fd0b6f8](https://github.com/currents-dev/cypress-cloud/commit/fd0b6f8b9f751b10a74c4261aa632b233a76ddc5))
- add message when build id is not supported ([#58](https://github.com/currents-dev/cypress-cloud/issues/58)) ([57b2b42](https://github.com/currents-dev/cypress-cloud/commit/57b2b42b4e1cc4f96aeb248fdb236834dfaac459))
- add cloudServiceUrl config option ([18c1dbd](https://github.com/currents-dev/cypress-cloud/commit/18c1dbd3a5598465a7cddc01c1dd85fb3491445c))
- optimize uploading results ([c8aa917](https://github.com/currents-dev/cypress-cloud/commit/c8aa917ddd6e780c9ee8f1cbf30ead4249e368e8))
- prepar for release ([3ee6757](https://github.com/currents-dev/cypress-cloud/commit/3ee6757f5d7ba6408f9d9b50d2308ac9478f91bd))
- refactor and add tests ([5189c61](https://github.com/currents-dev/cypress-cloud/commit/5189c61341367ee44b4a8ee8291b5303ce9417ca))
- support batched claims ([0b333e5](https://github.com/currents-dev/cypress-cloud/commit/0b333e53d8ceca54ecd49122ad79beeed29b10dd))
- use axios-retry ([b3d2fd5](https://github.com/currents-dev/cypress-cloud/commit/b3d2fd56863afdf3403ef00674ec18a8d89a01d2))

## [1.3.2](https://github.com/currents-dev/cypress-cloud/compare/v1.3.1...v1.3.2) (2022-12-29)

### Bug Fixes

- restore capturing stdout ([8c98609](https://github.com/currents-dev/cypress-cloud/commit/8c9860962a083023ac71ac01294d20c551de809c))

## [1.3.1](https://github.com/currents-dev/cypress-cloud/compare/v1.3.0...v1.3.1) (2022-12-29)

# [1.3.0](https://github.com/currents-dev/cypress-cloud/compare/v1.2.6...v1.3.0) (2022-12-29)

### Bug Fixes

- remove CYPRESS_RECORD_KEY from env vars ([3fbcb51](https://github.com/currents-dev/cypress-cloud/commit/3fbcb51749a6809aacfbd06da6b39eaee1c5aaa6))
- use run params everywhere ([133d135](https://github.com/currents-dev/cypress-cloud/commit/133d1355818ec4cd81e06347eb8bd4067fd834f7))

### Features

- add more info about script params ([#57](https://github.com/currents-dev/cypress-cloud/issues/57)) ([929f3c9](https://github.com/currents-dev/cypress-cloud/commit/929f3c90f3cb14807f0eb584c3dec0198bfb8381))

## [1.2.6](https://github.com/currents-dev/cypress-cloud/compare/v1.2.5...v1.2.6) (2022-12-18)

## [1.2.5](https://github.com/currents-dev/cypress-cloud/compare/v1.2.4...v1.2.5) (2022-12-16)

### Bug Fixes

- remove "colors" dep ([4113bf8](https://github.com/currents-dev/cypress-cloud/commit/4113bf8c7d6bd6a6940a032995ba6033477dec62))

## [1.2.4](https://github.com/currents-dev/cypress-cloud/compare/v1.2.2...v1.2.4) (2022-12-16)

## [1.2.2](https://github.com/currents-dev/cypress-cloud/compare/v1.2.1...v1.2.2) (2022-12-16)

## [1.2.1](https://github.com/currents-dev/cypress-cloud/compare/v1.2.0...v1.2.1) (2022-12-16)

# [1.2.0](https://github.com/currents-dev/cypress-cloud/compare/v1.1.2...v1.2.0) (2022-12-16)

### Bug Fixes

- hadle errors and warnings ([d7c7c04](https://github.com/currents-dev/cypress-cloud/commit/d7c7c0420a563fcf182ab10a9f6f9518d8f56619)), closes [#4](https://github.com/currents-dev/cypress-cloud/issues/4)

### Features

- handle cypress crashes ([68b933e](https://github.com/currents-dev/cypress-cloud/commit/68b933e4228cab753f1b0bcaba2b7cf06f1561da))

## [1.1.2](https://github.com/currents-dev/cypress-cloud/compare/v1.1.1...v1.1.2) (2022-12-15)

## [1.1.1](https://github.com/currents-dev/cypress-cloud/compare/v1.1.0...v1.1.1) (2022-12-15)

# [1.1.0](https://github.com/currents-dev/cypress-cloud/compare/1.0.7...v1.1.0) (2022-12-15)

### Bug Fixes

- add CURRENTS_API_URL env var ([9635424](https://github.com/currents-dev/cypress-cloud/commit/9635424b54dcea00c4fd0485060b7ec3581b8fc5))
- capture uploads stdout ([6489278](https://github.com/currents-dev/cypress-cloud/commit/648927803a6a8f43e2d6aff18fcd69c57f7be4f5))
- cypress start commands ([f79e9fd](https://github.com/currents-dev/cypress-cloud/commit/f79e9fd859f9bb8c802dbc17cd132ff5d9941eb8))
- get projectRoot from resolved cypress config ([7ada7c3](https://github.com/currents-dev/cypress-cloud/commit/7ada7c37d95ea04b185a99cc89581b87dfa7ecfa))

### Features

- add CURRENTS_API_URL to be able to change base URL ([b6b7980](https://github.com/currents-dev/cypress-cloud/commit/b6b798068c9d4afb33979dde091ce90a992b05b2))
- add initial capture to uploaded results ([b064cfc](https://github.com/currents-dev/cypress-cloud/commit/b064cfc3fd8b46e9a46bb567c5f5439cf78a2964)), closes [#37](https://github.com/currents-dev/cypress-cloud/issues/37) [#23](https://github.com/currents-dev/cypress-cloud/issues/23)
- debug and logging ([34570be](https://github.com/currents-dev/cypress-cloud/commit/34570beac3d82cdf55b4a96631b6ac9810a1eb26))

## [1.0.7](https://github.com/currents-dev/cypress-cloud/compare/1.0.6...1.0.7) (2022-12-14)

### Features

- return cypress run results & exit with the expected code ([7460781](https://github.com/currents-dev/cypress-cloud/commit/7460781299f75334829a6359a42d77e425379940))

## [1.0.6](https://github.com/currents-dev/cypress-cloud/compare/1.0.5...1.0.6) (2022-12-14)

## [1.0.5](https://github.com/currents-dev/cypress-cloud/compare/a9711bde1fbb2cd37dbc8979593159d183bfa866...1.0.5) (2022-12-14)

### Bug Fixes

- currens hostname ([b7a211a](https://github.com/currents-dev/cypress-cloud/commit/b7a211a0fbf2368d328c44e89964ca3b064cd414))
- fix cli e2e vs component tests ([27e519f](https://github.com/currents-dev/cypress-cloud/commit/27e519f8859c348155365dabcd43d3f96510297c))
- set the correct precedence when using axios config ([7d2da9a](https://github.com/currents-dev/cypress-cloud/commit/7d2da9aea83c53ac29658bc442f03fc9f99d19cd))
- turborepo env variables ([9c4abc6](https://github.com/currents-dev/cypress-cloud/commit/9c4abc6f510a7947428f71ab68d5fa04c08794ca))

### Features

- add CI provider info ([403be98](https://github.com/currents-dev/cypress-cloud/commit/403be9807a09fd1aad806ba51bd989a8992f7705))
- capture projectId from config or from env variable ([f0910ed](https://github.com/currents-dev/cypress-cloud/commit/f0910ed9210929a484cca35aa810bab0b172aa7d))
- guess browser ([ad11a40](https://github.com/currents-dev/cypress-cloud/commit/ad11a407becef77f815d8991e29699cae2f6f87f))
- implement generic http client with retries ([a9711bd](https://github.com/currents-dev/cypress-cloud/commit/a9711bde1fbb2cd37dbc8979593159d183bfa866))
- improve setup steps ([9bf16fe](https://github.com/currents-dev/cypress-cloud/commit/9bf16fe5f3773db4aa2f169515303ea6d0973da6))
- separate stdout per spec file ([a9d01c3](https://github.com/currents-dev/cypress-cloud/commit/a9d01c349cbfe140a568a452b0e7163e6d27f2db))
- setup github actions ([d439f56](https://github.com/currents-dev/cypress-cloud/commit/d439f5660698177087fcc2e7a61c64ea263816f6))