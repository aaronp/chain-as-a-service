import { id, ContractFactory, ethers, Signer, Contract } from "ethers";
import { Accounts, Deployed, encodeAddress, getSigner, TrexSuite } from "./erc3643";
import OnchainID from '@onchain-id/solidity';
import { newAccount, PrivateAccount } from "@/ui/wallet/accounts";
import IdentityRegistry from '@/contracts/erc3643/contracts/registry/implementation/IdentityRegistry.sol/IdentityRegistry.json';
import Token from '@/contracts/erc3643/contracts/token/Token.sol/Token.json';


export type Persona = {
    personalAccount: PrivateAccount;
    actionAccount: PrivateAccount;
    managementAccount: PrivateAccount;
}
export const newPersona = async (name: string): Promise<Persona> => {
    const personalAccount = (await newAccount(`${name} Personal`)).private;
    const actionAccount = (await newAccount(`${name} Action`)).private;
    const managementAccount = (await newAccount(`${name} Management`)).private;
    return { personalAccount, actionAccount, managementAccount };
}

export type UserAccounts = {
    alice: Persona;
    bob: Persona;
    charlie: Persona;
}



export async function setupAccounts(chainId: string, admin: Accounts, users: UserAccounts, trex: TrexSuite) {


    async function deployIdentityProxy(user: PrivateAccount): Promise<Deployed> {
        const managementKey = user.address;

        console.log('deploying identity proxy for', user.address);
        const implementationAuthorityContractAddress = trex.authorities.identityImplementationAuthority.address

        const identity = await new ContractFactory(OnchainID.contracts.IdentityProxy.abi, OnchainID.contracts.IdentityProxy.bytecode, await getSigner(admin.deployer, chainId)).deploy(
            implementationAuthorityContractAddress,
            managementKey,
        );

        // TODO - register this contract

        await identity.waitForDeployment();

        // return ethers.getContractAt('Identity', identity.address, signer);
        return {
            address: await identity.getAddress(),
            // contract: new ethers.Contract(await identity.getAddress(), OnchainID.contracts.Identity.abi, await getSigner(user, chainId))
            getContract: async (account: PrivateAccount) => {
                return new ethers.Contract(await identity.getAddress(), OnchainID.contracts.Identity.abi, await getSigner(account, chainId))
            }
        }
    }

    console.log('deploying accounts for ', users);

    const aliceIdentity = await deployIdentityProxy(users.alice.personalAccount);
    // await aliceIdentity.addKey(ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['address'], [users.alice.actionAccount.address])), 2, 1);
    // the first arg is 1, 2 or 3
    // 1 is the key type for management keys
    // 2 is the key type for action keys
    // 3 is the key type for claim keys
    //
    // the second arg is the key type
    // 1 is ECDSA
    // 2 is RSA
    //
    console.log('adding key to alice identity', users.alice.actionAccount.address);
    (await aliceIdentity.getContract(users.alice.personalAccount)).addKey(encodeAddress(users.alice.actionAccount.address), 2, 1);

    const bobIdentity = await deployIdentityProxy(users.bob.personalAccount);
    const charlieIdentity = await deployIdentityProxy(users.charlie.personalAccount);

    console.log('adding key to charlie identity', users.charlie.actionAccount.address);
    (await charlieIdentity.getContract(users.charlie.personalAccount)).addKey(encodeAddress(users.charlie.actionAccount.address), 2, 1);


    // these are tuples of wallet addresses, on-chain identity addresses, and country codes


    const identityRegistryAtProxy = async () => {
        return new ethers.Contract(
            trex.suite.identityRegistry.address, // proxy address
            IdentityRegistry.abi,     // implementation ABI
            await getSigner(admin.tokenAgent, chainId) // <--- NOTE: this has to be the tokenAgent account (not the deployer) to register identities
        );
    }

    // const registryResult = await (await identityRegistryAtProxy()).batchRegisterIdentity([users.alice.personalAccount.address, users.bob.personalAccount.address], [aliceIdentity.address, bobIdentity.address], [42, 666]);
    // const registryResult = await (await trex.implementations.identityRegistryImplementation.getContract(admin.tokenAgent)).batchRegisterIdentity([users.alice.personalAccount.address, users.bob.personalAccount.address], [await aliceIdentity.getAddress(), await bobIdentity.getAddress()], [42, 666]);
    const registryResult = await (await identityRegistryAtProxy()).batchRegisterIdentity([users.alice.personalAccount.address, users.bob.personalAccount.address], [aliceIdentity.address, bobIdentity.address], [42, 666]);

    console.log('registryResult', registryResult.hash);

    const textAsHex = (text: string) => ethers.hexlify(ethers.toUtf8Bytes(text))

    const claimForAlice = {
        data: textAsHex('Some claim public data.'),
        issuer: trex.suite.claimIssuerContract.address,
        topic: id('CLAIM_TOPIC'),
        scheme: 1,
        identity: await aliceIdentity.address,
        signature: '',
    };

    const claimIssuerSigningKey = await getSigner(admin.claimIssuer, chainId)

    const abiByteString = ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [claimForAlice.identity, claimForAlice.topic, claimForAlice.data]);
    claimForAlice.signature = await claimIssuerSigningKey.signMessage(
        ethers.getBytes(
            ethers.keccak256(
                abiByteString,
            ),
        ),
    );

    console.log('adding claim for alice');
    (await aliceIdentity.getContract(users.alice.actionAccount))
        .addClaim(claimForAlice.topic, claimForAlice.scheme, claimForAlice.issuer, claimForAlice.signature, claimForAlice.data, '');

    // console.log('creating claim for bob');
    // const claimForBob = {
    //     data: textAsHex('Some claim public data.'),
    //     issuer: trex.suite.claimIssuerContract.address,
    //     topic: id('CLAIM_TOPIC'),
    //     scheme: 1,
    //     identity: bobIdentity.address,
    //     signature: '',
    // };
    // claimForBob.signature = await claimIssuerSigningKey.signMessage(
    //     ethers.getBytes(
    //         ethers.keccak256(
    //             abiByteString,
    //         ),
    //     ),
    // );

    // console.log('adding claim for bob');
    // (await bobIdentity.getContract(users.bob.actionAccount))
    //     .addClaim(claimForBob.topic, claimForBob.scheme, claimForBob.issuer, claimForBob.signature, claimForBob.data, '');

    console.log('minting 1000 for alice');

    const tokenAtProxyForCheck = new ethers.Contract(trex.suite.token.address, Token.abi, await getSigner(admin.tokenAgent, chainId));
    const isAgent = await tokenAtProxyForCheck.isAgent(admin.tokenAgent.address);
    console.log("Is tokenAgent an agent?", isAgent); // Should be true




    // Mint tokens for Alice using the implementation ABI at the proxy address
    const tokenAtProxy = new ethers.Contract(
        trex.suite.token.address, // proxy address
        Token.abi,                // implementation ABI
        await getSigner(admin.tokenAgent, chainId)
    );
    const mintResult = await tokenAtProxy.mint(users.alice.personalAccount.address, 1000);
    console.log('mintResult', mintResult);
    console.log('mintResult', mintResult.hash);
    // await token.connect(tokenAgent).mint(bobWallet.address, 500);

    // await agentManager.connect(tokenAgent).addAgentAdmin(tokenAdmin.address);
    // await token.connect(deployer).addAgent(agentManager.address);
    // await identityRegistry.connect(deployer).addAgent(agentManager.address);

    // await token.connect(tokenAgent).unpause();

    return {
        identities: {
            aliceIdentity: aliceIdentity.address,
            // bob: bobIdentity,
            // charlie: charlieIdentity,
        }
    }

}