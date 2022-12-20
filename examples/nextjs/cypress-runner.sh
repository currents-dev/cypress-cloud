#!/bin/bash

export CURRENTS_API_BASE_URL=http://localhost:1234

yarn cypress-cloud --parallel --record --key 3RvHxaHTXzeOWZiT --ci-build-id $(date +%s)
