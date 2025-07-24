import { Contract, ContractFactory, ethers, Signer } from "ethers";
import { Accounts, encodeAddress, getSigner, TrexSuite } from "./erc3643";
import OnchainID from '@onchain-id/solidity';
import { newAccount, PrivateAccount } from "@/ui/wallet/accounts";
import { Account } from "@/api/accounts";



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


    async function deployIdentityProxy(user: PrivateAccount) {
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
        return new ethers.Contract(await identity.getAddress(), OnchainID.contracts.Identity.abi, await getSigner(user, chainId));
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
    await aliceIdentity.addKey(encodeAddress(users.alice.actionAccount.address), 2, 1);

    const bobIdentity = await deployIdentityProxy(users.bob.personalAccount);
    const charlieIdentity = await deployIdentityProxy(users.charlie.personalAccount);

    console.log('adding key to charlie identity', users.charlie.actionAccount.address);
    await charlieIdentity.addKey(encodeAddress(users.charlie.actionAccount.address), 2, 1);


    // await identityRegistry
    //   .connect(tokenAgent)
    //   .batchRegisterIdentity([aliceWallet.address, bobWallet.address], [aliceIdentity.address, bobIdentity.address], [42, 666]);

    // const claimForAlice = {
    //   data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes('Some claim public data.')),
    //   issuer: claimIssuerContract.address,
    //   topic: claimTopics[0],
    //   scheme: 1,
    //   identity: aliceIdentity.address,
    //   signature: '',
    // };
    // claimForAlice.signature = await claimIssuerSigningKey.signMessage(
    //   ethers.utils.arrayify(
    //     ethers.utils.keccak256(
    //       ethers.utils.defaultAbiCoder.encode(['address', 'uint256', 'bytes'], [claimForAlice.identity, claimForAlice.topic, claimForAlice.data]),
    //     ),
    //   ),
    // );

    // await aliceIdentity
    //   .connect(aliceWallet)
    //   .addClaim(claimForAlice.topic, claimForAlice.scheme, claimForAlice.issuer, claimForAlice.signature, claimForAlice.data, '');

    // const claimForBob = {
    //   data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes('Some claim public data.')),
    //   issuer: claimIssuerContract.address,
    //   topic: claimTopics[0],
    //   scheme: 1,
    //   identity: bobIdentity.address,
    //   signature: '',
    // };
    // claimForBob.signature = await claimIssuerSigningKey.signMessage(
    //   ethers.utils.arrayify(
    //     ethers.utils.keccak256(
    //       ethers.utils.defaultAbiCoder.encode(['address', 'uint256', 'bytes'], [claimForBob.identity, claimForBob.topic, claimForBob.data]),
    //     ),
    //   ),
    // );

    // await bobIdentity
    //   .connect(bobWallet)
    //   .addClaim(claimForBob.topic, claimForBob.scheme, claimForBob.issuer, claimForBob.signature, claimForBob.data, '');

    // await token.connect(tokenAgent).mint(aliceWallet.address, 1000);
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