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



    const alice = await setupAccounts(chainId, accounts, await newPersona('Alice'), trex);
    const bob = await setupAccounts(chainId, accounts, await newPersona('Bob'), trex);
    console.log('users', alice, bob);

    console.log('deploy time', after - before);
}); 