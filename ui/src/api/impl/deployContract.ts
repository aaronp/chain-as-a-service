import { DeployRequest, DeployResponse } from '../chain';
import { writeFile } from 'fs/promises';
import { execute } from './execute';
import { ErrorResponse } from '../error';

const withAnvil = async (fn: () => Promise<DeployResponse | ErrorResponse>) => {
    console.log("starting anvil");
    const proc = Bun.spawn([
        "anvil",
        "--dump-state",
        "anvil-state.json"
    ], {
        stdout: 'pipe',
        stderr: 'pipe',
    });

    // Wait for Anvil to be ready by polling the REST endpoint
    const url = "http://127.0.0.1:8545";
    const timeoutMs = 5000;
    const pollInterval = 100;
    let ready = false;
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const res = await fetch(url, { method: "POST", body: '{"jsonrpc":"2.0","id":1,"method":"web3_clientVersion","params":[]}', headers: { 'Content-Type': 'application/json' } });
            if (res.ok) {
                ready = true;
                console.log("anvil ready:", await res.text());
                break;
            }
        } catch (e) {
            // Not ready yet
        }
        await new Promise(r => setTimeout(r, pollInterval));
    }
    if (!ready) {
        proc.kill();
        throw new Error("Anvil did not start in time");
    }

    try {
        return await fn();
    } finally {
        proc.kill();
    }
}

type DeployOutput = {
    contractAddress: string;
    txHash: string;
    deployerAddress: string;
}
const parseDeployOutput = (scriptStdout: string): DeployOutput | ErrorResponse => {
    const lines = scriptStdout.split("\n");

    const deployerAddressLine = lines.find(line => line.includes("Deployer:"));
    if (!deployerAddressLine) {
        return { error: "No deployer address found in deploy output: " + scriptStdout };
    }
    const deployerAddress = deployerAddressLine.split("Deployer:")[1].trim();

    const addressLine = lines.find(line => line.includes("Deployed to:"));
    if (!addressLine) {
        return { error: "No address found in deploy output: " + scriptStdout };
    }
    const address = addressLine.split("Deployed to:")[1].trim();

    const txHashLine = lines.find(line => line.includes("Transaction hash:"));
    if (!txHashLine) {
        return { error: "No tx hash found in deploy output: " + scriptStdout };
    }
    const txHash = txHashLine.split("Transaction hash:")[1].trim();

    return { contractAddress: address, txHash, deployerAddress: deployerAddress };
}

/**
 * Deploys a contract using deploy.sh and returns the deployment result.
 * @param contractJsonPath Path to the contract JSON (e.g. /contracts/erc20/MyToken.sol:MyToken)
 * @param name Token name
 * @param symbol Token symbol
 * @param decimals Number of decimals (supply will be 10^decimals)
 * @returns DeployResponse with result string (deployed address or error)
 */
export async function deployContract(request: DeployRequest): Promise<DeployResponse | ErrorResponse> {

    const { contractType, name, symbol, decimals } = request;
    if (contractType !== "ERC20") {
        return { error: "Unsupported contract type: " + contractType }
    }

    const result = await withAnvil(async () => {
        const result = await execute({
            commandLine: `./deploy.sh ${name} ${symbol} ${decimals}`, timeout: 10000, dir: "./contracts/erc20"
        });
        console.log("deploy result", result);
        try {
            const response: DeployOutput | ErrorResponse = parseDeployOutput(result.stdout);
            return response;
        } catch (e) {
            const response: ErrorResponse = { error: result.stderr || result.stdout }
            return response;
        }
    });
    return result;
}
