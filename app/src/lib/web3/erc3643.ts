import { ethers } from "ethers";
import { ensureETH, providerForChain } from "./web3";
import { PrivateAccount } from "@/ui/wallet/accounts";
import TrustedIssuersRegistry from "@/contracts/erc3643/TrustedIssuersRegistry.json";
import { client } from "@/api/client";


export const deployTrustedClaimIssuerRegistry = async (account: PrivateAccount, chainId: string) => {
    const provider = await providerForChain(chainId);

    await ensureETH(account.address, chainId);

    const signer = new ethers.Wallet(account.privateKey, provider);


    const factory = new ethers.ContractFactory(TrustedIssuersRegistry.abi, TrustedIssuersRegistry.bytecode, signer);

    const contract = await factory.deploy();

    console.log("Waiting for deployment...");
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log("Contract deployed at:", contractAddress);

    const registerResult = await client().registerContract({
        chainId,
        issuerAddress: account.address,
        contractAddress,
        contractType: "TrustedIssuersRegistry",
        parameters: {},
    })
    return registerResult;
}