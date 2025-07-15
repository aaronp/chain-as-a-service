# syntax=docker/dockerfile:1
FROM oven/bun:latest

WORKDIR /app

# Copy lockfile and package.json for faster install
COPY bun.lock package.json bunfig.toml ./

RUN bun install

# Copy the rest of the files
COPY . .

EXPOSE 3000

CMD ["bun", "src/index.tsx"]
