#!/bin/bash

export JENKINS_URL=http://jenkins.com
export JENKINS_HOME=/
export JENKINS_VERSION=1
export BUILD_NUMBER=123
export CURRENTS_PROJECT_ID=
export CURRENTS_RECORD_KEY=
npx cypress-cloud --parallel --record --key ${CURRENTS_RECORD_KEY}
