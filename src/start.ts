import { execa } from "execa";
import { mkdir } from "fs/promises";

const stateDir = "./state";
await execa("mkdir", ["-p", stateDir, "./out"]);
await execa("mkdir", ["-p", stateDir, "./cache"]);
// Ensure out directory exists for build artifacts
await mkdir("./out", { recursive: true });

// const image = "ghcr.io/foundry-rs/foundry:latest"
const image = "evm-as-a-service:latest"

// Start Anvil, dump state to mounted host folder
const cmd = [
    "run", "--rm", "-d",
    // "--platform", "linux/amd64",
    "--name", "evm-as-a-service",
    "-p", "8545:8545",
    "-v", `${process.cwd()}/${stateDir}/output:/output`,
    "-v", `${process.cwd()}/${stateDir}/cache:/cache`,
    // Mount the project root for id.json and contract sources
    "-v", `${process.cwd()}:/project`,
    // Mount the scripts directory for deploy.sh and config
    "-v", `${process.cwd()}/scripts:/scripts`,
    // Mount the contracts directory
    "-v", `${process.cwd()}/src/contracts:/contracts`,
    // Mount the OpenZeppelin contracts
    "-v", `${process.cwd()}/src/contracts/openzeppelin-contracts:/openzeppelin-contracts`,
    // Mount the out directory for build artifacts
    "-v", `${process.cwd()}/state/out:/out`,
    // Mount the remappings.txt file
    "-v", `${process.cwd()}/remappings.txt:/remappings.txt`,
    image,
    "anvil", "--host", "0.0.0.0", "--dump-state", "/output/state.json"
];
console.log(`🦊 Starting Anvil EVM API with command:\ndocker ${cmd.join(" ")}`);
await execa("docker", cmd);

// Wait a bit for node to boot
await new Promise(res => setTimeout(res, 1500));

