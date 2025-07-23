import { spawn } from 'bun';
import { retryUntil } from '../src/lib/retryUntil';
import { client } from '../src/api/client';
import { ethers } from 'ethers';

const TEST_PORT = 4100;
const TEST_URL = `http://localhost:${TEST_PORT}`;

function waitForServerReady(url: string) {
    return retryUntil(async () => {
        const res = await fetch(url + '/api/chains');
        if (!res.ok) throw new Error('Not ready');
        return true;
    }, 5000, 200);
}

// Minimal test
// Bun's test runner will pick up this file

// @ts-expect-error Bun global
test('start server and create chain', async () => {
    // Start the server on a test port
    const proc = spawn({
        cmd: ['bun', 'src/index.tsx'],
        env: { ...process.env, PORT: String(TEST_PORT) },
        stdout: 'pipe',
        stderr: 'pipe',
        cwd: import.meta.dir + '/../',
    });
    console.log('Server PID:', proc.pid);

    try {
        // Wait for server to be ready
        await waitForServerReady(TEST_URL);

        // Create a random account for the chain creator
        const wallet = ethers.Wallet.createRandom();
        const chainName = 'test-chain-' + Math.random().toString(36).slice(2, 8);
        const creatorAddress = wallet.address;

        // Register the chain
        const api = client(TEST_URL);
        const result = await api.registerChain({ name: chainName, creatorAddress });



        console.log('result', result);
        if ('error' in result) throw new Error(result.error);
        if (!result.chainId) throw new Error('No chainId returned');
        if (result.name !== chainName) throw new Error('Chain name mismatch');
        if (result.creatorAddress !== creatorAddress) throw new Error('Creator address mismatch');
    } finally {
        // proc.kill();
    }
}); 