#!/bin/bash

# Script should be called like so
# ./connectDatabase.sh {environment} --profile {profile}
# e.g. sh connect-database.sh staging --profile main

SCRIPT_DIR="$( cd "$(dirname "$0")" || exit ; pwd -P )"

check_environment() {
  if [ -z "$1" ]; then
    echo "❌ Error: Environment must be provided."
    exit 1
  fi
  ENVIRONMENT="$1"
}

parse_arguments() {
  while [[ $# -gt 0 ]]
  do
    key="$1"
    case $key in
      --profile)
      PROFILE="$2"
      shift # past argument
      shift # past value
      ;;
      *)    # unknown option
      shift # past argument
      ;;
    esac
  done
  echo "🔧 Using profile $PROFILE"
}

fetch_secrets() {
  SECRET_NAME=$(aws cloudformation describe-stacks \
    --stack-name "${ENVIRONMENT}-client-app-MainStack" \
    --query "Stacks[0].Outputs[?OutputKey=='DbSecretsId'].OutputValue" \
    --output text \
    --profile "$PROFILE" || exit 1)

  echo "🔑 Secrets Name: $SECRET_NAME"

  SECRET_VALUE=$(aws secretsmanager get-secret-value \
    --secret-id "$SECRET_NAME" \
    --profile "$PROFILE" \
    --query SecretString \
    --output text || exit 1)

  CLUSTER_ID=$(echo "$SECRET_VALUE" | jq -r '.dbClusterIdentifier')

  WRITER_INSTANCE_ID=$(aws rds describe-db-clusters \
    --db-cluster-identifier "$CLUSTER_ID" \
    --query 'DBClusters[0].DBClusterMembers[?IsClusterWriter].DBInstanceIdentifier' \
    --output text \
    --profile "$PROFILE" || exit 1)

    echo "🔍 Select the database instance matching $WRITER_INSTANCE_ID"
}

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

  check_environment "$1"
  shift
  parse_arguments "$@"

  fetch_secrets
  run_torpedo
}

main "$@"
