import { DeployRequest, DeployResponse } from '../chain';
import { writeFile } from 'fs/promises';
import { execute } from './execute';
import { ErrorResponse } from '../error';
import path from 'path';
import os from 'os';

/**
 * Runs a function with anvil running in the background.
 * @param fn The function to run.
 * @returns The result of the function, or an error response if the function fails.
 */
const withAnvil = async <A>(fn: () => Promise<A | ErrorResponse>) => {
    const id = crypto.randomUUID();
    const stateFile = path.resolve(`anvil-state-${id}.json`);

    const anvilDir = path.resolve(os.homedir(), ".foundry/bin");
    console.log("anvilDir", anvilDir);
    const proc = Bun.spawn([
        "anvil",
        "--dump-state",
        stateFile
    ], {
        stdout: 'pipe',
        stderr: 'pipe',
        cwd: anvilDir
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

    let result: A | ErrorResponse;
    try {
        result = await fn();
    } catch (e) {
        console.error("anvil error", e);
        throw e;
    } finally {
        proc.kill();
    }

    if (isErrorResponse(result)) {
        return { result, state: null };
    }
    try {
        // Wait for stateFile to exist, retry up to 20 times with 50ms sleep
        let retries = 0;
        while (!(await Bun.file(stateFile).exists())) {
            if (retries++ >= 20) {
                throw new Error(`State file not found after ${retries} attempts: ${stateFile}`);
            }
            await Bun.sleep(50);
        }
        const state = await Bun.file(stateFile).json();
        console.log("returning state", state);
        return { result, state };
    } catch (e) {
        console.error("error reading state", e);
        return { result, state: null };
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

const isErrorResponse = (x: any): x is ErrorResponse => x && typeof x.error === 'string';

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

    const anvilResult = await withAnvil<DeployOutput>(async () => {
        const result = await execute({
            commandLine: `./deploy.sh ${name} ${symbol} ${decimals}`, timeout: 10000, dir: "./contracts/erc20"
        });
        const parsed = parseDeployOutput(result.stdout);
        return parsed;
    });
    if (isErrorResponse(anvilResult)) {
        return { error: anvilResult.error };
    }
    const { result: deployOutput, state } = anvilResult;
    if (isErrorResponse(deployOutput)) {
        // Defensive: should not happen, but handle just in case
        return { error: deployOutput.error };
    }
    return {
        contractAddress: deployOutput.contractAddress,
        txHash: deployOutput.txHash,
        deployerAddress: deployOutput.deployerAddress,
        state
    };
}
