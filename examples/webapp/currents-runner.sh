#!/bin/bash

export CURRENTS_API_BASE_URL=http://localhost:1234

yarn cypress-cloud --parallel --record --key ${CURRENTS_RECORD_KEY} --ci-build-id $(date +%s)
