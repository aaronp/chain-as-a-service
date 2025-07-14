import { DeployRequest, DeployResponse } from '../chain';
import { writeFile } from 'fs/promises';
import { execute } from './execute';

const withAnvil = async (fn: () => Promise<DeployResponse>) => {
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


/**
 * Deploys a contract using deploy.sh and returns the deployment result.
 * @param contractJsonPath Path to the contract JSON (e.g. /contracts/erc20/MyToken.sol:MyToken)
 * @param name Token name
 * @param symbol Token symbol
 * @param decimals Number of decimals (supply will be 10^decimals)
 * @returns DeployResponse with result string (deployed address or error)
 */
export async function deployContract(request: DeployRequest): Promise<DeployResponse> {

    const { contractType, name, symbol, decimals } = request;
    if (contractType !== "ERC20") {
        throw new Error("Unsupported contract type: " + contractType)
    }

    const contractJsonPath = `./ui/contracts/erc20/MyToken.sol:MyToken`;

    // note: this is coupled with the anvil seed key
    // hard-coded seed key for anvil
    const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

    //--private-key "$PRIVATE_KEY" \
    const result = await withAnvil(async () => {
        const result = await execute({
            commandLine: `forge create 
            --rpc-url http://127.0.0.1:8545
            --private-key "${privateKey}" 
            --broadcast 
            ${contractJsonPath}
            --constructor-args "${name}" "${symbol}" "${decimals}" `, timeout: 10000, env: {
                FOUNDRY_REMAPPINGS: "@openzeppelin/contracts/=/openzeppelin-contracts/contracts/"
            }
        });
        console.log("deploy result", result);
        return { result: result.stdout || result.stderr };
    });
    return result;
}
