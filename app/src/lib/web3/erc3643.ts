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

// Helper to deploy a contract and return its address
async function deployImplementation(artifact: any, signer: any, ...args: any[]): Promise<string> {
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
    const contract = await factory.deploy(...args);
    await contract.waitForDeployment();
    return await contract.getAddress();
}

// Helper to register an implementation in the authority
async function registerImplementation(authority: any, fnName: string, implAddress: string) {
    const tx = await authority[fnName](implAddress);
    await tx.wait();
}

export const deployTREXFactory = async (account: PrivateAccount, chainId: string) => {


    // 1. Deploy implementation contracts
    const TokenArtifact = await import("@/contracts/erc3643/contracts/token/Token.sol/Token.json");
    const IdentityRegistryArtifact = await import("@/contracts/erc3643/contracts/registry/implementation/IdentityRegistry.sol/IdentityRegistry.json");
    const IdentityRegistryStorageArtifact = await import("@/contracts/erc3643/contracts/registry/implementation/IdentityRegistryStorage.sol/IdentityRegistryStorage.json");
    const ModularComplianceArtifact = await import("@/contracts/erc3643/contracts/compliance/modular/ModularCompliance.sol/ModularCompliance.json");
    const ClaimTopicsRegistryArtifact = await import("@/contracts/erc3643/contracts/registry/implementation/ClaimTopicsRegistry.sol/ClaimTopicsRegistry.json");
    const TrustedIssuersRegistryArtifact = await import("@/contracts/erc3643/contracts/registry/implementation/TrustedIssuersRegistry.sol/TrustedIssuersRegistry.json");

    const tokenImpl = await deployImplementation(TokenArtifact, await getSigner(account, chainId));
    const irImpl = await deployImplementation(IdentityRegistryArtifact, await getSigner(account, chainId));
    const irsImpl = await deployImplementation(IdentityRegistryStorageArtifact, await getSigner(account, chainId));
    const mcImpl = await deployImplementation(ModularComplianceArtifact, await getSigner(account, chainId));
    const ctrImpl = await deployImplementation(ClaimTopicsRegistryArtifact, await getSigner(account, chainId));
    const tirImpl = await deployImplementation(TrustedIssuersRegistryArtifact, await getSigner(account, chainId));

    // 2. Deploy IAFactory
    const IAFactoryArtifact = await import("@/contracts/erc3643/contracts/proxy/authority/IAFactory.sol/IAFactory.json");
    const iaFactory = await new ethers.ContractFactory(
        IAFactoryArtifact.abi,
        IAFactoryArtifact.bytecode,
        await getSigner(account, chainId)
    ).deploy(ethers.ZeroAddress);
    await iaFactory.waitForDeployment();
    const iaFactoryAddress = await iaFactory.getAddress();

    // 3. Deploy TREXImplementationAuthority
    const TREXImplementationAuthorityArtifact = await import("@/contracts/erc3643/contracts/proxy/authority/TREXImplementationAuthority.sol/TREXImplementationAuthority.json");
    const trexImplementationAuthority = await new ethers.ContractFactory(
        TREXImplementationAuthorityArtifact.abi,
        TREXImplementationAuthorityArtifact.bytecode,
        await getSigner(account, chainId)
    ).deploy(true, ethers.ZeroAddress, iaFactoryAddress);
    await trexImplementationAuthority.waitForDeployment();
    const trexImplementationAuthorityAddress = await trexImplementationAuthority.getAddress();
    const trexImplementationAuthorityInstance = new ethers.Contract(
        trexImplementationAuthorityAddress,
        TREXImplementationAuthorityArtifact.abi,
        await getSigner(account, chainId)
    );

    // 4. Register implementations in the authority
    await registerImplementation(trexImplementationAuthorityInstance, "setTokenImplementation", tokenImpl);
    await registerImplementation(trexImplementationAuthorityInstance, "setIRImplementation", irImpl);
    await registerImplementation(trexImplementationAuthorityInstance, "setIRSImplementation", irsImpl);
    await registerImplementation(trexImplementationAuthorityInstance, "setMCImplementation", mcImpl);
    await registerImplementation(trexImplementationAuthorityInstance, "setCTRImplementation", ctrImpl);
    await registerImplementation(trexImplementationAuthorityInstance, "setTIRImplementation", tirImpl);

    // 5. Deploy TREXFactory
    const TREXFactoryArtifact = await import("@/contracts/erc3643/contracts/factory/TREXFactory.sol/TREXFactory.json");
    const trexFactory = await new ethers.ContractFactory(
        TREXFactoryArtifact.abi,
        TREXFactoryArtifact.bytecode,
        await getSigner(account, chainId)
    ).deploy(trexImplementationAuthorityAddress, iaFactoryAddress);
    await trexFactory.waitForDeployment();
    const trexFactoryAddress = await trexFactory.getAddress();

    // 6. Set the TREXFactory address in the Implementation Authority
    const tx = await trexImplementationAuthorityInstance.setTREXFactory(trexFactoryAddress);
    await tx.wait();

    return {
        trexFactory: trexFactoryAddress,
        trexImplementationAuthority: trexImplementationAuthorityAddress,
        iaFactory: iaFactoryAddress,
        implementations: {
            tokenImpl,
            irImpl,
            irsImpl,
            mcImpl,
            ctrImpl,
            tirImpl,
        },
    };
}

// export const deployTrustedIssuersRegistry = async (account: PrivateAccount, chainId: string) => {
//     const factory = new ethers.ContractFactory(TrustedIssuersRegistry.abi, TrustedIssuersRegistry.bytecode, await getSigner(account, chainId));
//     return deployContract(account, chainId, factory, "TrustedIssuersRegistry", {});
// }
export const deployER3543Suite = async (account: PrivateAccount, chainId: string) => {


    const trexFactory = await deployContract(account, chainId, new ethers.ContractFactory(TREXFactory.abi, TREXFactory.bytecode, await getSigner(account, chainId)), "TREXFactory", {});
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

