import { ErrorResponse, isErrorResponse } from '../error';
import path from 'path';
import os from 'os';

export const startAnvil = async (port: number) => {
    const ad = anvilDir();
    const anvilFQN = path.resolve(ad, "anvil");
    const proc = Bun.spawn([anvilFQN, "--port", String(port)], {
        stdout: 'pipe',
        stderr: 'pipe',
        cwd: ad
    });

    // Wait for Anvil to be ready by polling the REST endpoint
    const ready = await waitForAnvilReady(port);
    if (!ready) {
        proc.kill();
        throw new Error("Anvil did not start in time");
    }
    return proc;
}

const anvilDir = () => path.resolve(os.homedir(), ".foundry/bin");

export async function waitForAnvilReady(port: number) {
    const url = `http://127.0.0.1:${port}`;
    const timeoutMs = 5000;
    const pollInterval = 100;
    let ready = false;
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const res = await fetch(url, { method: "POST", body: '{"jsonrpc":"2.0","id":1,"method":"web3_clientVersion","params":[]}', headers: { 'Content-Type': 'application/json' } });
            if (res.ok) {
                ready = true;
                console.log("anvil ready:", await res.text());
                break;
            }
        } catch (e) {
            // Not ready yet
        }
        await new Promise(r => setTimeout(r, pollInterval));
    }
    return ready;
}

/**
 * Make an RPC call to anvil to get the state.
 * @returns The state of the anvil instance.
 */
export async function snapshotAnvilState(port: number): Promise<any> {
    try {
        const res = await fetch(`http://127.0.0.1:${port}`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "anvil_dumpState",
                params: [],
                id: 1
            })
        });
        if (res.ok) {
            const json = await res.json();
            return json.result;
        } else {
            console.error("Failed to fetch anvil_dumpState", await res.text());
        }
    } catch (e) {
        console.error("Error sending anvil_dumpState RPC", e);
    }
    return undefined;
}

/**
 * see https://getfoundry.sh/anvil/reference/
 * 
 * @param state 
 * @returns 
 */
export async function setAnvilState(state: any, port: number): Promise<any> {
    console.log("setting anvil state ...", state);
    if (!state) {
        console.log("no state to set");
        return;
    }
    try {
        const res = await fetch(`http://127.0.0.1:${port}`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "anvil_loadState",
                params: [state],
                id: 1
            })
        });
        if (res.ok) {
            const json = await res.json();
            return json.result;
        } else {
            console.error("Failed to anvil_loadState", await res.text());
        }
    } catch (e) {
        console.error("Error setting anvil_loadState RPC", e);
    }
}