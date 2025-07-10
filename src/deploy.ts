import { Wallet, JsonRpcProvider, ContractFactory } from "ethers";
import { readFile, writeFile } from "fs/promises";
// @ts-expect-error: clack/prompts may not have types in Bun
import { text, intro, outro } from "clack/prompts";

// ---- Config ----
const RPC_URL = "http://localhost:8545"; // Change if needed
const CONTRACT_ARTIFACT = "./contracts/erc20/MyToken.json";
const ID_FILE = "./id.json";
const DEPLOY_INFO = "./deployed_token.json";

// ---- Main ----
async function main() {
    intro("ERC20 Token Deployment");

    // Prompt for ID file
    const idFile = await text({
        message: "Path to identity file:",
        placeholder: "id.json",
        defaultValue: "id.json"
    }) || "id.json";

    // Prompt for token details
    const name = await text({
        message: "Token name:",
        placeholder: "MyToken",
        defaultValue: "MyToken"
    }) || "MyToken";
    const symbol = await text({
        message: "Token symbol:",
        placeholder: "MTK",
        defaultValue: "MTK"
    }) || "MTK";
    const decimalsStr = await text({
        message: "Decimals:",
        placeholder: "18",
        defaultValue: "18",
        validate: (v: string) => isNaN(Number(v)) ? "Enter a number" : undefined
    }) || "18";
    const decimals = Number(decimalsStr);
    const supplyStr = await text({
        message: "Initial supply:",
        placeholder: "1000000",
        defaultValue: "1000000",
        validate: (v: string) => isNaN(Number(v)) ? "Enter a number" : undefined
    }) || "1000000";
    const supply = Number(supplyStr);

    // Load identity
    const { privateKey } = JSON.parse(await readFile(idFile, "utf-8"));

    // Setup provider/wallet
    const provider = new JsonRpcProvider(RPC_URL);
    const wallet = new Wallet(privateKey, provider);

    // Load contract artifact (ABI + bytecode)
    const artifact = JSON.parse(await readFile(CONTRACT_ARTIFACT, "utf-8"));
    const { abi, bytecode } = artifact;

    // Prepare contract factory
    const factory = new ContractFactory(abi, bytecode, wallet);

    // Deploy (adjust constructor args as needed)
    const token = await factory.deploy(
        name,      // name
        symbol,    // symbol
        decimals,  // decimals (if your constructor uses this)
        supply     // supply (adjust for your contract)
    );
    console.log("Deploying... TX:", token.deploymentTransaction()?.hash);

    // Wait for on-chain deployment
    await token.waitForDeployment();
    const address = await token.getAddress();
    console.log(`Deployed MyToken at: ${address}`);

    // Save info
    await writeFile(DEPLOY_INFO, JSON.stringify({
        address,
        deployer: wallet.address,
        txHash: token.deploymentTransaction()?.hash
    }, null, 2));

    console.log(`Deployment info saved to ${DEPLOY_INFO}`);
    outro("Deployment complete.");
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
