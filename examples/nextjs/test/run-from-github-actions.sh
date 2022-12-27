#!/bin/bash

# Main bariable based on what all others will be stored
export GITHUB_ACTIONS=1

export GITHUB_WORKFLOW=
export GITHUB_ACTION=
export GITHUB_EVENT_NAME=
export GITHUB_RUN_ID=
export GITHUB_RUN_ATTEMPT=
export GITHUB_REPOSITORY=
export GITHUB_REPOSITORY=

# Currents localhost
export CURRENTS_API_BASE_URL=http://localhost:1234

yarn cypress-cloud --parallel --record --key ${CURRENTS_RECORD_KEY} --ci-build-id $(date +%s)
