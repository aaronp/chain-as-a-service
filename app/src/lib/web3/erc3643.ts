import { ensureETH, providerForChain } from "./web3";
import { createNewAccount, PrivateAccount } from '@/ui/wallet/accounts';
import { BytesLike, Contract, Interface, InterfaceAbi, id, ethers, keccak256, AbiCoder } from 'ethers';

import { client } from "@/api/client";


export type Accounts = {
    deployer: PrivateAccount;
    tokenIssuer: PrivateAccount;
    // tokenAgent: PrivateAccount;
    // tokenAdmin: PrivateAccount;
    claimIssuer: PrivateAccount;
}

export const newAccounts = async (): Promise<Accounts> => {

    return {
        deployer: await createNewAccount('Deployer'),
        tokenIssuer: await createNewAccount('TokenIssuer'),
        // tokenAgent: await createNewAccount('TokenAgent'),
        // tokenAdmin: await createNewAccount('TokenAdmin'),
        claimIssuer: await createNewAccount('ClaimIssuer'),
    }
}

export type Deployed = {
    address: string;
    getContract: (account: PrivateAccount) => Promise<Contract>;
}

const deployContract = async (chainId: string, deployer: PrivateAccount, contractName: string, abi: Interface | InterfaceAbi, bytecode: BytesLike, ...args: any[]): Promise<Deployed> => {
    console.log(`Deploying ${contractName}...`);
    const signer = await getSigner(deployer, chainId);


    // // prove we can read/write the abi as json
    // const abiJson = JSON.parse(JSON.stringify(abi));
    // client().registerContract({
    //   chainId,
    //   issuerAddress: deployer.address,
    //   contractAddress: '',
    //   contractType: contractName,
    //   parameters: abiJson,
    // })

    const contract = new ethers.ContractFactory(abi, bytecode, signer);
    const deployment = await contract.deploy(...args);
    await deployment.waitForDeployment();


    const address = await deployment.getAddress();

    return {
        address,
        getContract: async (account: PrivateAccount) => new ethers.Contract(address, abi, await getSigner(account, chainId)),
    };
}

// Type for the return value of deployFullSuiteFixture
export type TrexSuite = {
    // accounts: {
    //   deployer: PrivateAccount;
    //   tokenIssuer: PrivateAccount;
    //   tokenAgent: PrivateAccount;
    //   tokenAdmin: PrivateAccount;
    //   claimIssuer: PrivateAccount;
    //   claimIssuerSigningKey: any; // Replace 'any' with the correct type if available
    //   aliceActionKey: any;        // Replace 'any' with the correct type if available
    // };
    // identities: Record<string, unknown>; // Empty for now, update if needed
    suite: {
        claimIssuerContract: Deployed;
        claimTopicsRegistry: Deployed;
        trustedIssuersRegistry: Deployed;
        identityRegistryStorage: Deployed;
        defaultCompliance: Deployed;
        identityRegistry: Deployed;
        tokenOID: Deployed;
        token: Deployed;
        agentManager: Deployed;
    };
    authorities: {
        trexImplementationAuthority: Deployed;
        identityImplementationAuthority: Deployed;
    };
    factories: {
        trexFactory: Deployed;
        identityFactory: Deployed;
    };
    implementations: {
        identityImplementation: Deployed;
        claimTopicsRegistryImplementation: Deployed;
        trustedIssuersRegistryImplementation: Deployed;
        identityRegistryStorageImplementation: Deployed;
        identityRegistryImplementation: Deployed;
        modularComplianceImplementation: Deployed;
        tokenImplementation: Deployed;
    };
};

export const getSigner = async (account: PrivateAccount, chainId: string) => {
    const provider = await providerForChain(chainId);

    await ensureETH(account.address, chainId);

    return new ethers.Wallet(account.privateKey, provider);
}

export const encodeAddress = (address: string) => {
    // 1. ABI-encode the address
    const abiCoder = AbiCoder.defaultAbiCoder();
    const encoded = abiCoder.encode(['address'], [address]);

    // 2. Hash the encoded address
    return keccak256(encoded);
}