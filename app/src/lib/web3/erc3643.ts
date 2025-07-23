import { ethers } from "ethers";
import { ensureETH, providerForChain } from "./web3";
import { PrivateAccount } from "@/ui/wallet/accounts";

import TREXFactory from "@/contracts/erc3643/contracts/factory/TREXFactory.sol/TREXFactory.json";
import TrustedIssuersRegistry from "@/contracts/erc3643/contracts/proxy/TrustedIssuersRegistryProxy.sol/TrustedIssuersRegistryProxy.json";

// import IdentityRegistry from "@/contracts/erc3643/IdentityRegistry.json";
// import IdentityRegistryStorage from "@/contracts/erc3643/IdentityRegistryStorage.json";
// import ModularCompliance from "@/contracts/erc3643/ModularCompliance.json";
// import Token from "@/contracts/erc3643/Token.json";
// import TrustedIssuersRegistry from "@/contracts/erc3643/TrustedIssuersRegistry.json";


import { client } from "@/api/client";

const deployContract = async (account: PrivateAccount,
    chainId: string,
    factory: ethers.ContractFactory,
    contractType: string,
    parameters: any) => {
    const contract = await factory.deploy(parameters);
    console.log("Waiting for deployment...");
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log(contractType, "deployed at", contractAddress, "on chain", chainId);

    const registerResult = await client().registerContract({
        chainId,
        issuerAddress: account.address,
        contractAddress,
        contractType: contractType,
        parameters: parameters,
    })
    return registerResult;
}


export const getSigner = async (account: PrivateAccount, chainId: string) => {
    const provider = await providerForChain(chainId);

    await ensureETH(account.address, chainId);

    const signer = new ethers.Wallet(account.privateKey, provider);
    return signer;
}

export const deployTREXFactory = async (account: PrivateAccount, chainId: string) => {
    // const signer = ;

    // Load artifacts
    const IAFactoryArtifact = await import("@/contracts/erc3643/contracts/proxy/authority/IAFactory.sol/IAFactory.json");
    const TREXImplementationAuthorityArtifact = await import("@/contracts/erc3643/contracts/proxy/authority/TREXImplementationAuthority.sol/TREXImplementationAuthority.json");
    const TREXFactoryArtifact = await import("@/contracts/erc3643/contracts/factory/TREXFactory.sol/TREXFactory.json");

    // 1. Deploy IAFactory with zero address (since TREXFactory doesn't exist yet)
    const iaFactory = await new ethers.ContractFactory(
        IAFactoryArtifact.abi,
        IAFactoryArtifact.bytecode,
        await getSigner(account, chainId)
    ).deploy(ethers.ZeroAddress);
    console.log("Waiting for IAFactory deployment...");
    await iaFactory.waitForDeployment();
    console.log("IAFactory deployed");
    const iaFactoryAddress = await iaFactory.getAddress();
    console.log("IAFactory address:", iaFactoryAddress);

    // 2. Deploy TREXImplementationAuthority with referenceStatus=true, trexFactory=0, iaFactory=iaFactoryAddress
    const trexImplementationAuthority = await new ethers.ContractFactory(
        TREXImplementationAuthorityArtifact.abi,
        TREXImplementationAuthorityArtifact.bytecode,
        await getSigner(account, chainId)
    ).deploy(true, ethers.ZeroAddress, iaFactoryAddress);
    console.log("Waiting for TREXImplementationAuthority deployment...");
    await trexImplementationAuthority.waitForDeployment();
    console.log("TREXImplementationAuthority deployed");
    const trexImplementationAuthorityAddress = await trexImplementationAuthority.getAddress();
    console.log("TREXImplementationAuthority address:", trexImplementationAuthorityAddress);

    // 3. Deploy TREXFactory with implementationAuthority and iaFactory addresses
    const trexFactory = await new ethers.ContractFactory(
        TREXFactoryArtifact.abi,
        TREXFactoryArtifact.bytecode,
        await getSigner(account, chainId)
    ).deploy(trexImplementationAuthorityAddress, iaFactoryAddress);
    console.log("Waiting for TREXFactory deployment...");
    await trexFactory.waitForDeployment();
    console.log("TREXFactory deployed");
    const trexFactoryAddress = await trexFactory.getAddress();
    console.log("TREXFactory address:", trexFactoryAddress);
    // Return addresses for test verification
    return {
        trexFactory: trexFactoryAddress,
        trexImplementationAuthority: trexImplementationAuthorityAddress,
        iaFactory: iaFactoryAddress,
    };
}

// export const deployTrustedIssuersRegistry = async (account: PrivateAccount, chainId: string) => {
//     const factory = new ethers.ContractFactory(TrustedIssuersRegistry.abi, TrustedIssuersRegistry.bytecode, await getSigner(account, chainId));
//     return deployContract(account, chainId, factory, "TrustedIssuersRegistry", {});
// }
export const deployER3543Suite = async (account: PrivateAccount, chainId: string) => {
    const signer = await getSigner(account, chainId);

    const trexFactory = await deployContract(account, chainId, new ethers.ContractFactory(TREXFactory.abi, TREXFactory.bytecode, signer), "TREXFactory", {});
    // const identityRegistry = await deployContract(account, chainId, new ethers.ContractFactory(IdentityRegistry.abi, IdentityRegistry.bytecode, signer), "IdentityRegistry", {});
    // const identityRegistryStorage = await deployContract(account, chainId, new ethers.ContractFactory(IdentityRegistryStorage.abi, IdentityRegistryStorage.bytecode, signer), "IdentityRegistryStorage", {});
    // const modularCompliance = await deployContract(account, chainId, new ethers.ContractFactory(ModularCompliance.abi, ModularCompliance.bytecode, signer), "ModularCompliance", {});
    // const token = await deployContract(account, chainId, new ethers.ContractFactory(Token.abi, Token.bytecode, signer), "Token", {});

    // return { claimTopicsRegistry, identityRegistry, identityRegistryStorage, modularCompliance, token };
    return { trexFactory };
}

export const trustedIssuersRegistry = async (
    account: PrivateAccount,
    chainId: string,
    contractAddress: string
) => {
    const provider = await providerForChain(chainId);
    const wallet = new ethers.Wallet(account.privateKey, provider);
    const registry = new ethers.Contract(contractAddress, TrustedIssuersRegistry.abi, wallet);

    return {
        addTrustedIssuer: async (trustedIssuer: string, claimTopics: bigint[] | number[]) =>
            await registry.addTrustedIssuer(trustedIssuer, claimTopics),
        removeTrustedIssuer: async (trustedIssuer: string) =>
            await registry.removeTrustedIssuer(trustedIssuer),
        updateIssuerClaimTopics: async (trustedIssuer: string, claimTopics: bigint[] | number[]) =>
            await registry.updateIssuerClaimTopics(trustedIssuer, claimTopics),
        getTrustedIssuers: async (): Promise<string[]> =>
            await registry.getTrustedIssuers(),
        getTrustedIssuersForClaimTopic: async (claimTopic: bigint | number): Promise<string[]> =>
            await registry.getTrustedIssuersForClaimTopic(claimTopic),
        isTrustedIssuer: async (issuer: string): Promise<boolean> =>
            await registry.isTrustedIssuer(issuer),
        getTrustedIssuerClaimTopics: async (trustedIssuer: string): Promise<(bigint[] | number[])> =>
            await registry.getTrustedIssuerClaimTopics(trustedIssuer),
        hasClaimTopic: async (issuer: string, claimTopic: bigint | number): Promise<boolean> =>
            await registry.hasClaimTopic(issuer, claimTopic),
        owner: async (): Promise<string> =>
            await registry.owner(),
    };
}

