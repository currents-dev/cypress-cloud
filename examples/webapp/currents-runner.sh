#!/bin/bash

export CURRENTS_API_URL=http://localhost:1234

npx cypress-cloud --parallel --record --key ${CURRENTS_RECORD_KEY} --ci-build-id $(date +%s)
