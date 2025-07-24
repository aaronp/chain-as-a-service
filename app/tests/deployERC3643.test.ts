import { ensureServerRunning, TEST_URL } from './testServer';
import { PrivateAccount as Account, createNewAccount } from '@/ui/wallet/accounts';
import { test, expect } from 'bun:test';
import { deployTrexSuite } from '@/lib/web3/erc3643-deploy';
import { newAccounts } from '@/lib/web3/erc3643';

test('deploy an ERC3643 identity contract', async () => {

    const proc = await ensureServerRunning();

    const wallet = await createNewAccount('Test Account ' + new Date().getTime());

    const accounts = await newAccounts();
    const chainId = 'erc3643-chain-' + new Date().getTime()

    const result = await deployTrexSuite(chainId, accounts);
    console.log('result', result);

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
}); 