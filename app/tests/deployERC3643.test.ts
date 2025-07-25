import { ensureServerRunning, TEST_URL } from './testServer';
import { PrivateAccount as Account, createNewAccount, newAccount } from '@/ui/wallet/accounts';
import { test } from 'bun:test';
import { deployTrexSuite, newPersona, SetupAccounts, setupAccounts } from '@/lib/web3/erc3643/deploy';
import { testAccounts } from '@/lib/web3/erc3643/erc3643';
import { platformDSL } from '@/lib/web3/erc3643/dsl/platformDSL';
import { claimsDSL } from '@/lib/web3/erc3643/dsl/claimsDSL';


test('deploy an ERC3643 identity contract', async () => {

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
    const userAccounts = await setupAccounts(chainId, accounts, alice, trex);
    console.log('users', userAccounts);
    // const result = await deployTREXFactory(wallet, 'erc3643-chain-' + new Date().getTime());
    // expect(result.trexFactory).toBeDefined();
    // expect(result.trexImplementationAuthority).toBeDefined();
    // expect(result.iaFactory).toBeDefined();

    // Check that the deployed TREXFactory is callable

    // const TREXFactoryArtifact = await import('@/contracts/erc3643/contracts/factory/TREXFactory.sol/TREXFactory.json');
    // const provider = new ethers.JsonRpcProvider(); // assumes default local provider
    // const trexFactory = new ethers.Contract(result.trexFactory, TREXFactoryArtifact.abi, provider);
    // const implementationAuthority = await trexFactory.getImplementationAuthority();
    // expect(implementationAuthority.toLowerCase()).toBe(result.trexImplementationAuthority.toLowerCase());
    console.log('deploy time', after - before);
}); 