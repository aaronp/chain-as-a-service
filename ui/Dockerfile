FROM ghcr.io/foundry-rs/foundry:latest

USER root
RUN apt-get update && apt-get install -y socat bash curl unzip

# Install Bun as root, then copy the binary to /usr/local/bin
RUN curl -fsSL https://bun.sh/install | bash && \
    cp /root/.bun/bin/bun /usr/local/bin/bun && \
    chmod +x /usr/local/bin/bun

# USER foundry

WORKDIR /home/foundry/ui
# COPY --chown=foundry:foundry . .
COPY . .

RUN bun install

EXPOSE 3000

ENTRYPOINT []
CMD ["bash", "-c", "NODE_ENV=production bun src/index.tsx"]

