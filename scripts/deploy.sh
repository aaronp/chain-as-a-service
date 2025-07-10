#!/bin/sh
set -e

CONFIG_FILE="$1"
if [ -z "$CONFIG_FILE" ]; then
  echo "Usage: $0 <config.json>"
  exit 1
fi

# Helper to extract a value from a JSON file (no jq)
json_extract() {
  key="$1"
  file="$2"
  grep -o '"'"$key"'"[ ]*:[ ]*"[^"]*"' "$file" | head -n1 | sed 's/.*: *"\([^"]*\)".*/\1/'
}
json_extract_num() {
  key="$1"
  file="$2"
  grep -o '"'"$key"'"[ ]*:[ ]*[0-9]*' "$file" | head -n1 | sed 's/.*: *\([0-9]*\).*/\1/'
}

ID_FILE=$(json_extract idFile "$CONFIG_FILE")
CONTRACT_PATH=$(json_extract contractPath "$CONFIG_FILE")
NAME=$(json_extract name "$CONFIG_FILE")
SYMBOL=$(json_extract symbol "$CONFIG_FILE")
SUPPLY=$(json_extract_num supply "$CONFIG_FILE")
PRIVATE_KEY=$(json_extract privateKey "$ID_FILE")

forge create \
  --rpc-url http://127.0.0.1:8545 \
  --private-key "$PRIVATE_KEY" \
  "$CONTRACT_PATH" \
  --constructor-args "$NAME" "$SYMBOL" "$SUPPLY" 