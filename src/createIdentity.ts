import { Wallet } from "ethers";
import { writeFile } from "fs/promises";

// Generate a new random wallet
const wallet = Wallet.createRandom();

const identity = {
    address: wallet.address,
    privateKey: wallet.privateKey
};

// Save to id.json (overwrite if exists)
await writeFile("id.json", JSON.stringify(identity, null, 2));

console.log("New identity generated and saved to id.json:");
console.log(identity);
