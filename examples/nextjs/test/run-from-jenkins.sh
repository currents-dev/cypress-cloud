#!/bin/bash

export JENKINS_URL=http://jenkins.com
export JENKINS_HOME=/
export JENKINS_VERSION=1
export BUILD_NUMBER=123

DEBUG=currents:cypress node ../../packages/cypress-cloud/out/bin/index.js --parallel --record --key ${CURRENTS_RECORD_KEY}
