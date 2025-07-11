import { ethers } from "ethers";
import { readFile } from "fs/promises";

async function main() {
    // Load deployer private key
    const id = JSON.parse(await readFile("id.json", "utf8"));
    const privateKey = id.privateKey;

    // Connect to remote EVM
    const provider = new ethers.JsonRpcProvider("http://localhost:8585");
    const wallet = new ethers.Wallet(privateKey, provider);

    // Load contract artifact
    const artifact = JSON.parse(
        await readFile("./src/contracts/erc20/MyToken.json", "utf8")
    );
    const { abi, bytecode } = artifact;

    // Set deployment args (edit as needed)
    const name = "MyToken";
    const symbol = "MTK";
    const supply = ethers.parseUnits("10000", 18); // 10000 tokens, 18 decimals

    // Deploy contract
    const factory = new ethers.ContractFactory(abi, bytecode.object || bytecode, wallet);
    const contract = await factory.deploy(name, symbol, supply);
    const deploymentTx = contract.deploymentTransaction();
    if (deploymentTx) {
        console.log("Deploying... TX:", deploymentTx.hash);
    } else {
        console.log("Deploying... (no deployment transaction hash available)");
    }
    await contract.waitForDeployment();
    console.log("Deployed to:", contract.target);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
