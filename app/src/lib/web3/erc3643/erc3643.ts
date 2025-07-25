import { ensureETH, providerForChain } from "../web3";
import { createNewAccount, PrivateAccount } from '@/ui/wallet/accounts';
import { Contract, ethers, keccak256, AbiCoder } from 'ethers';


export type Accounts = {
    deployer: PrivateAccount;
    tokenIssuer: PrivateAccount;
    tokenAgent: PrivateAccount;
    tokenAdmin: PrivateAccount;
    claimIssuer: PrivateAccount;
    claimIssuerSigningKey: PrivateAccount;
}

export const saveAccountsToFile = (accounts: Accounts, filename: string) => {
    const fs = Bun.file(filename);
    fs.write(JSON.stringify(accounts, null, 2));
}
export const readAccountsFromFile = async (filename: string): Promise<Accounts> => {
    const fs = Bun.file(filename);
    return JSON.parse(await fs.text());
}

export const testAccounts = async () => {

    const filename = 'testaccounts.json';

    try {
        // Check if testaccounts.json exists
        const file = Bun.file(filename);
        if (await file.exists()) {
            console.log('📁 Loading existing accounts from testaccounts.json');
            return await readAccountsFromFile(filename);
        }
    } catch (error) {
        console.log('📁 testaccounts.json not found, creating new accounts');
    }

    const accounts = await newAccounts();
    console.log('🆕 Creating new accounts and saving to testaccounts.json');
    saveAccountsToFile(accounts, filename);
    console.log('💾 Saved new accounts to testaccounts.json');
    return accounts;
}

export const newAccounts = async (): Promise<Accounts> => {

    const accounts = {
        deployer: await createNewAccount('Deployer'),
        tokenIssuer: await createNewAccount('TokenIssuer'),
        tokenAgent: await createNewAccount('TokenAgent'),
        tokenAdmin: await createNewAccount('TokenAdmin'),
        claimIssuer: await createNewAccount('ClaimIssuer'),
        claimIssuerSigningKey: await createNewAccount('ClaimIssuerSigningKey'),
    };

    return accounts;
}

export type Deployed = {
    address: string;
    getContract: (account: PrivateAccount) => Promise<Contract>;
}


// Type for the return value of deployFullSuiteFixture
export type TrexSuite = {
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