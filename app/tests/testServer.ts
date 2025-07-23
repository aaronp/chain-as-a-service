import { spawn } from 'bun';
import { retryUntil } from '../src/lib/retryUntil';
import { client } from '../src/api/client';
import { ethers } from 'ethers';

// const TEST_PORT = 4100;
const TEST_PORT = 3000;
export const TEST_URL = `http://localhost:${TEST_PORT}`;

export const ensureServerRunning = async () => {
    if (!await isRunning()) {
        const proc = await startServer();
        // Wait for server to be ready
        await waitForServerReady(TEST_URL);

        return proc;
    } else {
        console.log('Server already running on port ' + TEST_PORT);
        return undefined;
    }
}

export function waitForServerReady(url: string) {
    return retryUntil(async () => {
        const res = await fetch(url + '/api/chains');
        if (!res.ok) throw new Error('Not ready');
        return true;
    }, 5000, 200);
}

// Minimal test
// Bun's test runner will pick up this file

export const isRunning = async () => {
    try {
        const res = await fetch(TEST_URL + '/api/chains');
        return res.ok;
    } catch {
        return false;
    }
}


export const startServer = async () => {
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