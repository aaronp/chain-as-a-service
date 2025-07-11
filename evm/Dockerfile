FROM ghcr.io/foundry-rs/foundry:latest

USER root
RUN apt-get update && apt-get install -y socat bash

USER foundry
# Start socat and anvil in background, wait for either to exit
CMD ["echo", "hello EVM world"]

