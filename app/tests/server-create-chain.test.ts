import { spawn } from 'bun';
import { retryUntil } from '../src/lib/retryUntil';
import { client } from '../src/api/client';
import { ethers } from 'ethers';

// const TEST_PORT = 4100;
const TEST_PORT = 3000;
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

const isRunning = async () => {
    try {
        const res = await fetch(TEST_URL + '/api/chains');
        return res.ok;
    } catch {
        return false;
    }
}
const startServer = async () => {
    // Start the server on a test port
    const proc = spawn({
        cmd: ['bun', 'src/index.tsx'],
        env: { ...process.env, PORT: String(TEST_PORT) },
        stdout: 'pipe',
        stderr: 'pipe',
        cwd: import.meta.dir + '/../',
    });
    // Pipe server output to test runner console
    (async () => {
        const reader = proc.stdout.getReader();
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) Bun.stdout.write(value);
        }
    })();
    (async () => {
        const reader = proc.stderr.getReader();
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) Bun.stderr.write(value);
        }
    })();
    console.log('Server PID:', proc.pid);
    return proc;
}
// @ts-expect-error Bun global
test('start server and create chain', async () => {

    let proc: any | null = null;
    if (!await isRunning()) {
        proc = await startServer();
        // Wait for server to be ready
        await waitForServerReady(TEST_URL);
    } else {
        console.log('Server already running on port ' + TEST_PORT);
    }

    try {

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
        if (proc) {
            proc.kill();
        }
    }
}); 