import { Elysia } from "elysia";
import { t } from "elysia";
import { ErrorResponseSchema } from "./error";
import { snapshotAnvilState, setAnvilState, startAnvil, waitForAnvilReady } from "./impl/anvil";

export type ChainStore = {
    useChain: (chainId: string) => Promise<void>;
    isRunning: () => boolean;
    currentChainId: () => string | undefined;
    dump: () => Record<string, any[]>;
    list: () => string[];
    append: (chainId: string, value: any) => void;
};

export const makeChainStore = (): ChainStore => {
    const chainData = new Map<string, any[]>();
    let currentChainId: string | undefined = undefined;

    let proc: ReturnType<typeof Bun.spawn> | undefined = undefined;
    const anvilRunning = () => proc !== undefined;
    const stopAnvil = async () => {
        if (proc) {
            console.log("stopping anvil ...");
            const state = await snapshotAnvilState();
            proc.kill();
            proc = undefined;
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
        /**
         * Use a chain.
         * If the chain is already running, do nothing.
         * If the chain is not running, start it and restore the previous state.
         * If the chain is not running, stop the current chain and start the new one.
         * @param chainId 
         */
        useChain: async (chainId: string) => {
            if (currentChainId === chainId) {
                if (!anvilRunning()) {
                    proc = await startAnvil();
                    console.log("starting anvil for ", chainId);
                    const previousState = latestDataForChain(chainId);
                    if (previousState) {
                        setAnvilState(previousState);
                    }
                } else {
                    // console.log("anvil already running for ", chainId);
                    await waitForAnvilReady();
                }
            } else {
                const snapshot = await stopAnvil();
                if (snapshot !== undefined && currentChainId) {
                    append(currentChainId, snapshot);
                }

                currentChainId = chainId;
                console.log("starting anvil for ", chainId);
                proc = await startAnvil();
                const previousState = latestDataForChain(chainId);
                if (previousState !== undefined) {
                    setAnvilState(previousState);
                }
            }
        },
        isRunning: () => anvilRunning(),
        currentChainId: () => currentChainId,
        dump: () => Object.fromEntries(chainData.entries()),
        list: () => Array.from(chainData.keys()),
        append: append
    }
}

export const chainStore = new Elysia().state({
    chainData: makeChainStore(),
})

export const chainStoreRoutes = new Elysia({
    name: "chainData",
    prefix: "/data",
    detail: {
        tags: ["chainData"],
        description:
            "Chain data commands",
    },
}).use(chainStore)
    .get('/', async ({ store }) => {
        return { currentChainId: store.chainData.currentChainId(), isRunning: store.chainData.isRunning(), chains: store.chainData.list(), data: store.chainData.dump() };
    },
        {
            response: {
                200: t.Object({
                    currentChainId: t.Optional(t.String()),
                    isRunning: t.Boolean(),
                    chains: t.Array(t.String()),
                    data: t.Any(),
                }),
                400: ErrorResponseSchema,
            },
        }
    )
