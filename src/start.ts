import { execa } from "execa";

const stateDir = "./anvil_state_bootstrap";
await execa("mkdir", ["-p", stateDir]);

// Start Anvil, dump state to mounted host folder
const cmd = [
    "run", "--rm", "-d",
    "--name", "anvil_bootstrap",
    "-p", "8545:8545",
    "-v", `${process.cwd()}/${stateDir}:/output`,
    "ghcr.io/foundry-rs/foundry:latest",
    "anvil", "--host", "0.0.0.0", "--dump-state", "/output/state.json"
];
console.log(`🦊 Starting Anvil EVM API with command:\ndocker ${cmd.join(" ")}`);
await execa("docker", cmd);

// Wait a bit for node to boot
await new Promise(res => setTimeout(res, 1500));

