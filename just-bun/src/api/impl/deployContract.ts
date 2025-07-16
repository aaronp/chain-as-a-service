import { DeployRequest, DeployResponse } from '../chain';
import { execute } from './execute';
import { ErrorResponse, isErrorResponse } from '../error';
import { withAnvil } from './anvil';
import path from 'path';

type DeployOutput = {
    contractAddress: string;
    txHash: string;
    deployerAddress: string;
}

/**
 * Deploys a contract using deploy.sh and returns the deployment result.
 * @param contractJsonPath Path to the contract JSON (e.g. /contracts/erc20/MyToken.sol:MyToken)
 * @param name Token name
 * @param symbol Token symbol
 * @param initialSupply Initial supply for the token
 * @returns DeployResponse with result string (deployed address or error)
 */
export async function deployContract(request: DeployRequest): Promise<DeployResponse | ErrorResponse> {

    const { contractType, name, symbol, initialSupply, previousState } = request;
    if (contractType !== "ERC20") {
        return { error: "Unsupported contract type: " + contractType }
    }

    const anvilResult = await withAnvil<DeployOutput>(previousState, async () => {
        const erc20dir = path.resolve(process.cwd(), "contracts/erc20");
        console.log("executing deploy in erc20dir", erc20dir);
        const result = await execute({
            commandLine: `./deploy.sh ${name} ${symbol} ${initialSupply}`, timeout: 10000, dir: erc20dir
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


const parseDeployOutput = (scriptStdout: string): DeployOutput | ErrorResponse => {

    console.log("parsing deploy output", scriptStdout);
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