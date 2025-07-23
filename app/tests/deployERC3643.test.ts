import { ensureServerRunning, TEST_URL } from './testServer';
import { PrivateAccount as Account, createNewAccount } from '@/ui/wallet/accounts';
import { deployTREXFactory } from '@/lib/web3/erc3643';
import { test, expect } from 'bun:test';

test('deploy an ERC3643 identity contract', async () => {

    const proc = await ensureServerRunning();

    const wallet = await createNewAccount('Test Account ' + new Date().getTime());

    const result = await deployTREXFactory(wallet, 'test-chain-1');
    expect(result.trexFactory).toBeDefined();
    expect(result.trexImplementationAuthority).toBeDefined();
    expect(result.iaFactory).toBeDefined();

    // Check that the deployed TREXFactory is callable
    const { ethers } = await import('ethers');
    const TREXFactoryArtifact = await import('@/contracts/erc3643/contracts/factory/TREXFactory.sol/TREXFactory.json');
    const provider = new ethers.JsonRpcProvider(); // assumes default local provider
    const trexFactory = new ethers.Contract(result.trexFactory, TREXFactoryArtifact.abi, provider);
    const implementationAuthority = await trexFactory.getImplementationAuthority();
    expect(implementationAuthority.toLowerCase()).toBe(result.trexImplementationAuthority.toLowerCase());
}); 