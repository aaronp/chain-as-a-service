FROM ghcr.io/foundry-rs/foundry:latest

USER root
RUN apt-get update && apt-get install -y socat

USER foundry
# Start socat in the background, then anvil
CMD ["sh", "-c", "socat TCP-LISTEN:8545,fork,reuseaddr TCP:127.0.0.1:8545 & anvil --host 127.0.0.1"]
