import { client } from '../src/api/client';
import { ethers } from 'ethers';
import { ensureServerRunning, TEST_URL } from './testServer';

// @ts-expect-error Bun global
test('deploy an ERC20 token on a chain', async () => {

    const proc = await ensureServerRunning();

    try {

        // Create a random account for the chain creator
        const wallet = ethers.Wallet.createRandom();
        const chainId = '1';

        // Register the chain

    } finally {
        // if (proc) {
        //     proc.kill();
        // }
    }
}); 