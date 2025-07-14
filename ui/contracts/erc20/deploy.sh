#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo "Arguments: NAME='$1', SYMBOL='$2', SUPPLY='$3'"

NAME="$1"
SYMBOL="$2"
SUPPLY="$3"

echo "deploying ${NAME} ${SYMBOL} ${SUPPLY} to ${DIR}/src/MyToken.sol:MyToken"
  
forge create --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" \
  ${DIR}/src/MyToken.sol:MyToken \
  --constructor-args "$NAME" "$SYMBOL" "$SUPPLY" 