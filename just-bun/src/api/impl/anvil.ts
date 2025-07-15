import { ErrorResponse, isErrorResponse } from '../error';
import path from 'path';
import os from 'os';


/**
 * Runs a function with anvil running in the background.
 * @param fn The function to run.
 * @returns The result of the function, or an error response if the function fails.
 */
export const withAnvil = async <A>(initialState: any | undefined, fn: () => Promise<A | ErrorResponse>) => {

    const ad = anvilDir()
    const anvilFQN = path.resolve(ad, "anvil");

    // check if anvil exists
    if (!Bun.file(anvilFQN).exists()) {
        console.error("Anvil not found at " + anvilFQN);
        console.error("Please install anvil: https://getfoundry.sh/anvil/");
        throw new Error("Anvil not found at " + anvilFQN);
    }

    console.log("anvil dir", ad, "anvil fqn", anvilFQN);

    const proc = Bun.spawn([anvilFQN], {
        stdout: 'pipe',
        stderr: 'pipe',
        cwd: ad
    });

    // Wait for Anvil to be ready by polling the REST endpoint
    const ready = await waitForAnvilReady();
    if (!ready) {
        proc.kill();
        throw new Error("Anvil did not start in time");
    }

    if (initialState) {
        console.log("setting anvil state", initialState);
        const result = await setAnvilState(initialState);
        console.log("set state returned", result);
    }

    let result: A | ErrorResponse;
    let dumpState: any = undefined;
    try {
        result = await fn();

        dumpState = await getAnvilState();

    } catch (e) {
        console.error("anvil error", e);
        throw e;
    } finally {
        proc.kill();
    }

    if (isErrorResponse(result)) {
        return { result, state: null };
    }
    return { result, state: dumpState };
}


const anvilDir = () => path.resolve(os.homedir(), ".foundry/bin");

async function waitForAnvilReady() {
    const url = "http://127.0.0.1:8545";
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
async function getAnvilState(): Promise<any> {
    // Send anvil_dumpState RPC to anvil
    try {
        const res = await fetch("http://127.0.0.1:8545", {
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
}

/**
 * see https://getfoundry.sh/anvil/reference/
 * 
 * @param state 
 * @returns 
 */
async function setAnvilState(state: any): Promise<any> {
    // Send anvil_dumpState RPC to anvil
    try {
        const res = await fetch("http://127.0.0.1:8545", {
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