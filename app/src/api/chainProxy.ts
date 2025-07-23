import Elysia from 'elysia';
import { chainProxyHandler } from './impl/chainProxy';

import { t } from "elysia";
import { ErrorResponseSchema } from "./error";
import { snapshotAnvilState, setAnvilState, startAnvil, waitForAnvilReady } from "./impl/anvil";

export type ChainStore = {
    useChain: (chainId: string) => Promise<void>;
    isRunning: (chainId: string) => boolean;
    getPort: (chainId: string) => number | undefined;
    currentChainId: () => string | undefined;
    dump: () => Record<string, any[]>;
    list: () => string[];
    append: (chainId: string, value: any) => void;
};

export const makeChainStore = (): ChainStore => {
    const chainData = new Map<string, any[]>();
    const chainProcs = new Map<string, { proc: ReturnType<typeof Bun.spawn>, port: number }>();

    const getPort = (chainId: string) => chainProcs.get(chainId)?.port;
    const anvilRunning = (chainId: string) => chainProcs.has(chainId);
    const stopAnvil = async (chainId: string) => {
        const entry = chainProcs.get(chainId);
        if (entry) {
            console.log("stopping anvil ...", chainId);
            const state = await snapshotAnvilState(entry.port);
            entry.proc.kill();
            chainProcs.delete(chainId);
            return state;
        } else {
            return undefined;
        }
    }
    const append = (chainId: string, value: any) => {
        if (!value) {
            console.log("append ", chainId, " with undefined value");
            return;
        }
        const chain = chainData.get(chainId);
        if (!chain) {
            chainData.set(chainId, [value]);
        } else {
            chain.unshift(value);
        }
        console.log("append ", chainId, ", chain length is ", chainData.get(chainId)?.length);
    }
    const latestDataForChain = (chainId: string) => {
        const chain = chainData.get(chainId);
        if (!chain || chain.length === 0) {
            console.log("no chain found for ", chainId);
            return undefined;
        }
        return chain[0];
    }
    return {
        useChain: async (chainId: string) => {
            let entry = chainProcs.get(chainId);
            if (entry) {
                console.log("🚀 anvil already running for ", chainId);
                // Already running
                await waitForAnvilReady(entry.port);
                return;
            }

            // Assign a new port: 8545 + current number of chainProcs
            const port = 8545 + chainProcs.size;
            const proc = await startAnvil(port);
            console.log("🚀 started anvil for ", chainId, " on port ", port);
            chainProcs.set(chainId, { proc, port });
            const previousState = latestDataForChain(chainId);
            if (previousState !== undefined) {
                await setAnvilState(previousState, port);
            }
        },
        isRunning: (chainId: string) => anvilRunning(chainId),
        getPort,
        // Remove currentChainId tracking, as it's not meaningful with per-chainId procs
        currentChainId: () => undefined,
        dump: () => Object.fromEntries(chainData.entries()),
        list: () => Array.from(chainData.keys()),
        append: append
    }
}

export const chainStore = new Elysia().state({
    chainData: makeChainStore(),
})

export const chainStatusRoutes = new Elysia({
    name: "chainData",
    prefix: "/data",
    detail: {
        tags: ["chainData"],
        description:
            "Gets the status of a chain",
    },
}).use(chainStore)
    .get('/', async ({ store }) => {
        return { chains: store.chainData.list(), data: store.chainData.dump() };
    },
        {
            response: {
                200: t.Object({
                    chains: t.Array(t.String()),
                    data: t.Any(),
                }),
                400: ErrorResponseSchema,
            },
        }
    )


/**
 * These routes will start chains on demand for any chainId.
 * 
 * @param param0 
 * @returns 
 */
const handler = async ({ body, params, store, request, path }: {
    body: any;
    params: Record<string, string>;
    store: { chainData: ChainStore };
    path: string;
    request: any;
}) => {
    const chainId = params.chainId;
    const subpath = params.subpath || "";
    const method = request.method;

    await store.chainData.useChain(chainId);

    const port = store.chainData.getPort(chainId);
    if (!port) {
        return { error: 'Anvil is not running for this chain' };
    }

    const response = await chainProxyHandler(port, body, { method, subpath, path });
    console.log(`proxy ${method} ${subpath} response`, response.result);
    store.chainData.append(chainId, response.state);
    return response;
};

export const chainProxyRoute = new Elysia({
    name: "chainProxy",
    prefix: "/proxy",
    detail: {
        tags: ["chainProxy"],
        description:
            "Proxy JSON-RPC requests to anvil for a given chainId (currently only localhost:8545 supported)",
    },
}).use(chainStore)
    .post(":chainId", handler, {
        detail: {
            tags: ["chainProxy"],
            description: "Proxy JSON-RPC POST requests to anvil for a given chainId (no subpath, for docs only).",
        },
    })
    .post(":chainId/*subpath?", handler, {
        detail: {
            tags: ["chainProxy"],
            description: "Proxy JSON-RPC POST requests to anvil for a given chainId (currently only localhost:8545 supported), supports sub-paths.",
        },
    })
    .get(":chainId/*subpath?", handler, {
        detail: {
            tags: ["chainProxy"],
            description: "Proxy JSON-RPC GET requests to anvil for a given chainId (currently only localhost:8545 supported), supports sub-paths.",
        },
    })
    .put(":chainId/*subpath?", handler, {
        detail: {
            tags: ["chainProxy"],
            description: "Proxy JSON-RPC PUT requests to anvil for a given chainId (currently only localhost:8545 supported), supports sub-paths.",
        },
    })
    .delete(":chainId/*subpath?", handler, {
        detail: {
            tags: ["chainProxy"],
            description: "Proxy JSON-RPC DELETE requests to anvil for a given chainId (currently only localhost:8545 supported), supports sub-paths.",
        },
    })
    .patch(":chainId/*subpath?", handler, {
        detail: {
            tags: ["chainProxy"],
            description: "Proxy JSON-RPC PATCH requests to anvil for a given chainId (currently only localhost:8545 supported), supports sub-paths.",
        },
    });

