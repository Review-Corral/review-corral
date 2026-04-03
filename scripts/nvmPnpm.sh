#!/bin/bash
set -euo pipefail

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

if command -v fnm >/dev/null 2>&1; then
  echo "Running pnpm with fnm and Node $NODE_VERSION"
  exec fnm exec --using "$NODE_VERSION" pnpm run "$@"
fi

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
  nvm use "$NODE_VERSION" >/dev/null
  echo "Running pnpm with nvm and Node $(node -v)"
  exec pnpm run "$@"
fi

echo "Unable to find fnm or nvm to run pnpm with Node $NODE_VERSION." >&2
exit 1
