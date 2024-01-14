#!/bin/bash

# Script should be called like so
# ./connectDatabase.sh {environment} --profile {profile}
# e.g. sh connect-database.sh staging --profile main

SCRIPT_DIR="$( cd "$(dirname "$0")" || exit ; pwd -P )"

run_torpedo() {
  local start_time
  start_time=$(date +%s)

  AWS_PROFILE=$PROFILE "${SCRIPT_DIR}/../bin/torpedo" client --port 5433
  local exit_status=$?
  local end_time
  end_time=$(date +%s)

  local elapsed=$(( end_time - start_time ))
  if [[ $exit_status -ne 0 && $elapsed -le 2 ]]; then
    echo "❌ The Torpedo process failed to start. Please check the Torpedo binary in your System Settings (Security & Privacy) and approve it if necessary."
    exit 1
  fi
}

main() {
  PROFILE="rc"

  run_torpedo
}

main "$@"
