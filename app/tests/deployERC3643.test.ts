import { ensureServerRunning, TEST_URL } from './testServer';
import { PrivateAccount as Account, createNewAccount, newAccount } from '@/ui/wallet/accounts';
import { expect, test } from 'bun:test';
import { deployTrexSuite, newPersona, SetupAccounts, setupAccounts } from '@/lib/web3/erc3643/deploy';
import { testAccounts } from '@/lib/web3/erc3643/erc3643';
import { platformDSL } from '@/lib/web3/erc3643/dsl/platformDSL';
import { claimsDSL } from '@/lib/web3/erc3643/dsl/claimsDSL';
import { tokenAgentDSL } from '@/lib/web3/erc3643/dsl/tokenAgentDSL';
import { tokenIssuerDSL } from '@/lib/web3/erc3643/dsl/tokenIssuerDSL';
import { id } from 'ethers';
import { ClaimTypes } from '@/lib/web3/erc3643/claims';


test('deploy an ERC3643 identity contract', async () => {
    // Increase timeout for this test
    const timeout = setTimeout(() => {
        console.log('Test timed out after 30 seconds');
        process.exit(1);
    }, 30000);

    console.log('Starting test...');

    await ensureServerRunning();

    const accounts = await testAccounts();
    // const chainId = 'erc3643-chain-' + new Date().getTime()
    const chainId = 'erc3643-test-chain'


    /**
     * First  step is for the deployer to deploy the platform
     */
    const before = new Date().getTime();
    const trex = await platformDSL(accounts.deployer).deploySuite(chainId, {
        tokenIssuerAddress: accounts.tokenIssuer.address,
        tokenAgentAddress: accounts.tokenAgent.address,
        claimIssuerAddress: accounts.claimIssuer.address,
    });
    const after = new Date().getTime();
    // roughly 3 seconds for deploys,
    // 300ms if cached


    /**
     * Second step is for the claim issuer to add their signing key to the platform
     */
    await claimsDSL(accounts.claimIssuer).addSigningKey(trex, accounts.claimIssuerSigningKey.address);



    const alice = await newPersona('Alice')
    const aliceAccounts = await setupAccounts(chainId, accounts, alice, trex);
    const bob = await setupAccounts(chainId, accounts, await newPersona('Bob'), trex);
    console.log('users', alice, bob);

    const tokenAgent = tokenAgentDSL(accounts.tokenAgent);
    const tokenMetadata = await tokenAgent.metadata(chainId, trex.suite.token.address);
    console.log('tokenMetadata', tokenMetadata);
    const aliceBalance = await tokenAgent.balanceOf(chainId, trex.suite.token.address, alice.personalAccount.address);
    console.log('aliceBalance', aliceBalance);
    console.log('aliceBalance type', typeof aliceBalance);
    expect(aliceBalance.toString()).toBe("1000");
    console.log('deploy time', after - before);

    console.log('About to deploy second token...');

    const tokenTwo = 'Pound' + new Date().getTime()
    const secondToken = await platformDSL(accounts.deployer).deployToken(chainId, trex, {
        owner: accounts.tokenIssuer.address,
        salt: tokenTwo,
        name: tokenTwo,
        symbol: 'GBP',
        decimals: '0',
        irAgents: [trex.suite.identityRegistry.address],
        tokenAgents: [accounts.tokenAgent.address],
        complianceModules: [trex.implementations.modularComplianceImplementation.address],
        complianceSettings: [trex.suite.defaultCompliance.address],
        claimTopics: [id(ClaimTypes.KYC)],
        issuers: [accounts.tokenIssuer.address],
        issuerClaims: [],
    });
    console.log('secondToken', secondToken);
    // const secondToken = await platformDSL(accounts.deployer).createToken(chainId, trex, accounts.tokenIssuer.address, accounts.tokenAgent.address, {
    //     name: 'Pound',
    //     symbol: 'GBP',
    //     decimals: '0',
    // });
    // console.log('secondToken', secondToken);

    const secondTokenAddress = secondToken.deployedAddresses.tokenAddress;
    console.log('secondTokenAddress', secondTokenAddress);
    // const secondTokenMetadata = await tokenAgent.metadata(chainId, secondTokenAddress);
    // console.log('secondTokenMetadata', secondTokenMetadata);

    const secondTokenBalance = await tokenAgent.balanceOf(chainId, secondTokenAddress, alice.personalAccount.address);
    console.log('before adding agent,secondTokenBalance', secondTokenBalance);
    // const added = await platformDSL(accounts.deployer).addAgent(chainId, secondTokenAddress, accounts.tokenAgent.address);
    const added = await tokenIssuerDSL(accounts.tokenIssuer).addAgent(chainId, secondTokenAddress, accounts.tokenAgent.address);
    console.log('added agent', added.hash);

    expect(secondTokenBalance.toString()).toBe("0");
    console.log('minting GBP tokens to alice');


    const secondTestTokenMintResult = await tokenAgent.mintTokens(chainId, tokenMetadata.tokenAddress, alice.personalAccount.address, 123);
    console.log('secondTestTokenMintResult', secondTestTokenMintResult);

    const secondBalanceCheck = await tokenAgent.balanceOf(chainId, tokenMetadata.tokenAddress, alice.personalAccount.address);
    console.log('secondBalanceCheck', secondBalanceCheck);
    expect(secondBalanceCheck.toString()).toBe("1123");

    const secondTokenMintResult = await tokenAgent.mintTokens(chainId, secondTokenAddress, alice.personalAccount.address, 123);
    console.log('secondTokenMintResult', secondTokenMintResult);


    // Clean up timeout
    clearTimeout(timeout);
}); 