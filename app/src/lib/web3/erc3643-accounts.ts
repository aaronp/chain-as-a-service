
export async function setupAccounts(chainId: string, accounts: Accounts, trex: TrexSuite) {


    // const aliceIdentity = await deployIdentityProxy(trex.authorities.identityImplementationAuthority.address, aliceWallet.address, deployer);
    // await aliceIdentity
    //   .connect(aliceWallet)
    //   .addKey(ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['address'], [aliceActionKey.address])), 2, 1);
    // const bobIdentity = await deployIdentityProxy(identityImplementationAuthority.address, bobWallet.address, deployer);
    // const charlieIdentity = await deployIdentityProxy(identityImplementationAuthority.address, charlieWallet.address, deployer);

    // await identityRegistry.connect(deployer).addAgent(tokenAgent.address);
    // await identityRegistry.connect(deployer).addAgent(token.address);

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

}