# syntax=docker/dockerfile:1
FROM oven/bun:latest

WORKDIR /app


RUN apt-get update && apt-get install -y curl git
RUN curl -L https://foundry.paradigm.xyz | bash && \
    /root/.foundry/bin/foundryup

# Copy lockfile and package.json for faster install
COPY bun.lock package.json bunfig.toml ./

# Copy the rest of the files
COPY . .

RUN bun install

EXPOSE 3000

CMD ["bun", "src/index.tsx"]
