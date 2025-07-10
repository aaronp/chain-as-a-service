import { execa } from "execa";
import { mkdir } from "fs/promises";

const stateDir = "./anvil_state_bootstrap";
await execa("mkdir", ["-p", stateDir, "./out"]);
await execa("mkdir", ["-p", stateDir, "./cache"]);
// Ensure out directory exists for build artifacts
await mkdir("./out", { recursive: true });

// Start Anvil, dump state to mounted host folder
const cmd = [
    "run", "--rm", "-d",
    "--platform", "linux/amd64",
    "--name", "anvil_bootstrap",
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
    "-v", `${process.cwd()}/out:/out`,
    // Mount the remappings.txt file
    "-v", `${process.cwd()}/remappings.txt:/remappings.txt`,
    "ghcr.io/foundry-rs/foundry:latest",
    "anvil", "--host", "0.0.0.0", "--dump-state", "/output/state.json"
];
console.log(`🦊 Starting Anvil EVM API with command:\ndocker ${cmd.join(" ")}`);
await execa("docker", cmd);

// Wait a bit for node to boot
await new Promise(res => setTimeout(res, 1500));

