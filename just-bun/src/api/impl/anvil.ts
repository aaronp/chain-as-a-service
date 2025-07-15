import { DeployRequest, DeployResponse } from '../chain';
import { writeFile } from 'fs/promises';
import { execute } from './execute';
import { ErrorResponse, isErrorResponse } from '../error';
import path from 'path';
import os from 'os';
import { uuidv4 } from '@/lib/uuid';


/**
 * Runs a function with anvil running in the background.
 * @param fn The function to run.
 * @returns The result of the function, or an error response if the function fails.
 */
export const withAnvil = async <A>(initialState: any | undefined, fn: () => Promise<A | ErrorResponse>) => {

    // const stateFilePath = await createAnvilStateFile(initialState);

    // const anvilCmd = ["anvil"];
    // if (stateFilePath) {
    //     anvilCmd.push("--state", stateFilePath);
    // }
    const proc = Bun.spawn(["anvil"], {
        stdout: 'pipe',
        stderr: 'pipe',
        cwd: anvilDir()
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
        // if (stateFilePath) {
        //     console.log("deleting state file", stateFilePath);
        //     await Bun.file(stateFilePath).delete();
        // }
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
 * Writes the initial state to a temp file and returns the file path, or undefined if no state.
 */
// async function createAnvilStateFile(initialState?: any): Promise<string | undefined> {
//     if (!initialState) return undefined;
//     const uuid = uuidv4();
//     const stateFilePath = path.resolve(os.tmpdir(), `anvil-state-${uuid}.json`);
//     await writeFile(stateFilePath, JSON.stringify(initialState));
//     console.log("anvil using state file", stateFilePath);
//     return stateFilePath;
// }

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