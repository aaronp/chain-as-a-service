import { execa } from "execa";
import { writeFile } from "fs/promises";

/**
 * This script is used to extract the private keys from the evm-as-a-service container and write them to a file.
 * It is used to get the private keys for the accounts that are created by the evm-as-a-service container.
 * It is also used to get the private key for the deployer account.
 * 
 * It is used in the deploy.sh script to get the private key for the deployer account.
 * 
 * It is used in the parseDeploy.ts script to get the private keys for the accounts that are created by the evm-as-a-service container.
 */
async function main() {
    // Get the logs from the evm-as-a-service container
    const { stdout } = await execa("docker", ["logs", "evm-as-a-service"]);

    // Find the section with Private Keys
    const lines = stdout.split("\n");
    const startIdx = lines.findIndex(l => l.includes("Private Keys"));
    if (startIdx === -1) throw new Error("Could not find 'Private Keys' in logs");

    // The keys are the next 10 lines after the header and separator
    const keyLines = lines.slice(startIdx + 2, startIdx + 12);
    const keys = keyLines
        .map(l => l.match(/\((\d+)\)\s+(0x[0-9a-fA-F]{64})/))
        .filter(Boolean)
        .map(match => match![2]);

    if (keys.length === 0) throw new Error("No private keys found in logs");

    // Write all keys to ./anvil_state_bootstrap/keys.json
    await writeFile("./anvil_state_bootstrap/keys.json", JSON.stringify(keys, null, 2));

    // Write the first key to id.json
    await writeFile("id.json", JSON.stringify({ privateKey: keys[0] }, null, 2));

    console.log(`Extracted ${keys.length} private keys. First key written to id.json.`);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}); 