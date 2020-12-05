#!/usr/bin/env bash

export TESTING=true

# Exit script as soon as a command fails.
set -o errexit

if [ -z "$@" ]; then
  echo "API_URL not been provided. Use http://localhost:3000 as fallback"
else
  export API_URL="$@"
  echo "Use $API_URL as API_URL"
fi

node ./test/newman/run.js
