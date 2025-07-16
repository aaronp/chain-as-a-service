import { Elysia } from "elysia";
import { t } from "elysia";
import { ErrorResponseSchema } from "./error";
import { GetTemplateResponseSchema } from "./erc20";

// function makeChainStore() {
//     return new Map<string, number>();
// }

export const makeChainStore = () => {
    // const nonceQueue: NonceEntry[] = [];
    console.log("makeChainStore");
    const chainData = new Map<string, any[]>();
    return {
        append: (chainId: string, value: any) => {

            const chain = chainData.get(chainId);
            if (!chain) {
                chainData.set(chainId, [value]);
            } else {
                chain.unshift(value);
            }
            console.log("append ", chainId, ", chain length is ", chainData.get(chainId)?.length);
        },
        get: (chainId: string) => {
            const chain = chainData.get(chainId);
            if (!chain || chain.length === 0) {
                console.log("no chain found for ", chainId);
                return undefined;
            }
            return chain[0];
        },
        list: () => {
            return Array.from(chainData.keys());
        }
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
        return { chains: store.chainData.list() };
    },
        {
            response: {
                200: t.Object({
                    chains: t.Array(t.String()),
                }),
                400: ErrorResponseSchema,
            },
        }
    )
