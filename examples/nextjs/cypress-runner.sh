#!/bin/bash

yarn cypress-runner --parallel --record --key ${CURRENTS_RECORD_KEY} --ci-build-id $(date +%s)
