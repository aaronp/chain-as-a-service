import { ethers } from "ethers";
const provider = new ethers.JsonRpcProvider("http://localhost:8546");
const signer = await provider.getSigner(0);

// Use the deployed ERC20 address from previous step!
const erc20 = new ethers.Contract("<DEPLOYED_ADDRESS>", ERC20.abi, signer);

const tx = await erc20.transfer("0xRecipientAddress...", 100);
const receipt = await tx.wait();
console.log("Transfer TX hash:", receipt.hash);
