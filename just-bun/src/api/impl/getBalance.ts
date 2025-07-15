import { GetBalanceRequest, GetBalanceResponse } from "../erc20";
import { withAnvil } from "./anvil";
import path from "path";
import { execute } from "./execute";
import { ethers } from "ethers";
import fs from "fs";

export const getBalance = async (request: GetBalanceRequest) => {
    const { previousState, address } = request;
    const anvilResult = await withAnvil<GetBalanceResponse | { error: string }>(previousState, async () => {
        try {
            // Load ABI
            const abiPath = path.resolve(process.cwd(), "./contracts/erc20/out/MyToken.sol/MyToken.json");
            if (!fs.existsSync(abiPath)) {
                return { error: "ABI not found at " + abiPath };
            }
            const abiJson = JSON.parse(fs.readFileSync(abiPath, "utf-8"));
            const abi = abiJson.abi;
            // Connect to Anvil
            const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
            // The contract address should be provided in the request (address is the user, not contract)
            // For demo, require contract address in request.contractAddress
            const contractAddress = address;
            if (!contractAddress) {
                return { error: "Missing contractAddress in request" };
            }
            const contract = new ethers.Contract(contractAddress, abi, provider);
            const balance: bigint = await contract.balanceOf(address);
            return { balance: Number(balance) };
        } catch (e: any) {
            return { error: e.message || String(e) };
        }
    });
    return anvilResult;
}