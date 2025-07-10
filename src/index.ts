import { Elysia } from "elysia";
import { execa } from "execa";
import { randomUUID } from "crypto";

const ANVIL_IMAGE = "ghcr.io/foundry-rs/foundry:latest";
const ANVIL_PORT = 8545;

// Util: Run Anvil in Docker for a single request, then kill it
async function runAnvilWithTx(seedData: any, txData: any) {
  const containerName = `anvil_${randomUUID()}`;
  // 1. Start Anvil in Docker, detached
  await execa("docker", [
    "run", "-d",
    "--name", containerName,
    "-p", `${ANVIL_PORT}:8545`,
    ANVIL_IMAGE,
    "anvil", "--host", "0.0.0.0"
  ]);
  // Wait a bit for it to boot (could do healthcheck)
  await new Promise(res => setTimeout(res, 1500));

  try {
    // 2. Seed state, send TX
    // (Example: send a JSON-RPC request, or use ethers.js/cast)
    // -- For demo, let's just fetch chain id
    const res = await fetch(`http://localhost:${ANVIL_PORT}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "eth_chainId",
        params: [],
      }),
    });
    const data = await res.json();

    // 3. TODO: Optionally dump state using `anvil_state` or expose via volume

    return { chainId: data.result };
  } finally {
    // 4. Clean up: stop and remove container
    await execa("docker", ["rm", "-f", containerName]);
  }
}

const app = new Elysia()
  .post("/run", async ({ body }) => {
    // Expect { seedData, txData }
    const { seedData, txData } = body as any;
    // For now, just run Anvil and get chainId as a demo
    const result = await runAnvilWithTx(seedData, txData);
    return result;
  })
  .listen(3000);

console.log(`🦊 Anvil EVM API running at http://localhost:3000`);
