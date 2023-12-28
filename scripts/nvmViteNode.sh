#!/bin/bash

scriptPath=$1 # Get the script path from command line arguments

shift # Remove the first command line argument

# See this github discussion for how to pass arguments to vite-node
# https://github.com/vitest-dev/vitest/issues/1178#issuecomment-1212361397

export IS_LOCAL=true
export FRIENDLY_NAME=script

# Source NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use # Use the version of node specified in .nvmrc

NODE_BINARY=$(nvm which --silent)
echo "Using Node binary: $NODE_BINARY"
echo "Running using the NVM version of Vite-Node with SST bound"

# shellcheck disable=SC2145
if [ "$NODE_DEBUG" == "true" ]
then
  echo "Debug mode enabled"
  $NODE_BINARY node_modules/.bin/sst bind --profile main \
    "$NODE_BINARY --max-old-space-size=16384 --inspect-brk node_modules/.bin/vite-node ${scriptPath} -- $@"
else
  $NODE_BINARY node_modules/.bin/sst bind --profile main \
    "$NODE_BINARY --max-old-space-size=16384 node_modules/.bin/vite-node ${scriptPath} -- $@"
fi
