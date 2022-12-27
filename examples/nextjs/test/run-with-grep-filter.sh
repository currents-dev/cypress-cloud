#!/bin/bash

export CURRENTS_API_BASE_URL=http://localhost:1234

yarn cypress-cloud --parallel --record --key ${CURRENTS_RECORD_KEY} --env grep=hello --ci-build-id $(date +%s)  --env grepTags="tag1" --spec "cypress/e2e/tags.spec.js"
