import { client } from '../src/api/client';
import { ethers } from 'ethers';
import { ensureServerRunning, TEST_URL } from './testServer';

// @ts-expect-error Bun global
test('start server and create chain', async () => {

    const proc = await ensureServerRunning();

    try {

        // Create a random account for the chain creator
        const wallet = ethers.Wallet.createRandom();
        const chainName = 'test-chain-' + Math.random().toString(36).slice(2, 8);
        const creatorAddress = wallet.address;

        // Register the chain
        const api = client(TEST_URL);
        const result = await api.registerChain({ name: chainName, creatorAddress });


        if ('error' in result) throw new Error(result.error);
        if (!result.chainId) throw new Error('No chainId returned');
        if (result.name !== chainName) throw new Error('Chain name mismatch');
        if (result.creatorAddress !== creatorAddress) throw new Error('Creator address mismatch');
    } finally {
        // if (proc) {
        //     proc.kill();
        // }
    }
}); 