#!/bin/bash
set -e

# Source NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use # Use the version of node specified in .nvmrc

PNPM_BINARY="$NVM_BIN/pnpm"
echo "Using Pnpm binary: $PNPM_BINARY"
echo "Running using the NVM version of Pnpm"

$PNPM_BINARY run "$@"