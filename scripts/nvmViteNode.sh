#!/bin/bash
set -euo pipefail

scriptPath=$1
shift

# See this github discussion for how to pass arguments to vite-node
# https://github.com/vitest-dev/vitest/issues/1178#issuecomment-1212361397

export IS_LOCAL=true
export FRIENDLY_NAME=script

if [ -f ".node-version" ]; then
  NODE_VERSION_FILE=".node-version"
elif [ -f ".nvmrc" ]; then
  NODE_VERSION_FILE=".nvmrc"
else
  echo "Unable to find .node-version or .nvmrc in $(pwd)." >&2
  exit 1
fi

NODE_VERSION="$(tr -d '[:space:]' < "$NODE_VERSION_FILE")"
NODE_VERSION="${NODE_VERSION#v}"

RUNNER=""
if command -v fnm >/dev/null 2>&1; then
  RUNNER="fnm"
  NODE_BINARY="$(fnm exec --using "$NODE_VERSION" bash -lc 'command -v node')"
elif [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
  RUNNER="nvm"
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
  nvm use "$NODE_VERSION" >/dev/null
  NODE_BINARY="$(command -v node)"
else
  echo "Unable to find fnm or nvm to run vite-node with Node $NODE_VERSION." >&2
  exit 1
fi

echo "Using Node binary: $NODE_BINARY"
echo "Running vite-node with SST bound via $RUNNER"

FORWARDED_ARGS=""
if [ "$#" -gt 0 ]; then
  printf -v FORWARDED_ARGS '%q ' "$@"
  FORWARDED_ARGS="${FORWARDED_ARGS% }"
fi

VITE_NODE_COMMAND="$NODE_BINARY --max-old-space-size=16384"
if [ "${NODE_DEBUG:-false}" = "true" ]; then
  echo "Debug mode enabled"
  VITE_NODE_COMMAND="$VITE_NODE_COMMAND --inspect-brk"
fi

VITE_NODE_COMMAND="$VITE_NODE_COMMAND node_modules/.bin/vite-node ${scriptPath}"
if [ -n "$FORWARDED_ARGS" ]; then
  VITE_NODE_COMMAND="$VITE_NODE_COMMAND -- $FORWARDED_ARGS"
fi

if [ "$RUNNER" = "fnm" ]; then
  exec fnm exec --using "$NODE_VERSION" node_modules/.bin/sst bind --profile rc "$VITE_NODE_COMMAND"
fi

exec node_modules/.bin/sst bind --profile rc "$VITE_NODE_COMMAND"
