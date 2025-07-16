import Elysia from 'elysia';
import { chainProxyHandler } from './impl/chainProxy';
import { chainStore } from './chainData';

export const chainProxyRoute = new Elysia({
    name: "chainProxy",
    prefix: "/proxy",
    detail: {
        tags: ["chainProxy"],
        description:
            "Proxy JSON-RPC requests to anvil for a given chainId (currently only localhost:8545 supported)",
    },
}).use(chainStore)
    .all(":chainId/*subpath?", async ({ body, params, store: { chainData }, request, path }) => {

        const chainId = (params as any).chainId;
        const subpath = (params as any).subpath || "";
        const method = request.method;
        const chain = chainData.get(chainId);

        console.log(`on ${method} ${subpath} for chain ${chainId} with path ${path}`);
        // Extract chainId from the path params
        // Only pass body and chain, as chainProxyHandler expects two arguments
        const response = await chainProxyHandler(body, chain, { method, subpath, path });

        console.log("proxy response", response);
        chainData.append(chainId, response.state);
        return response.result
    }, {
        detail: {
            tags: ["chainProxy"],
            description: "Proxy JSON-RPC requests to anvil for a given chainId (currently only localhost:8545 supported), supports all REST verbs and sub-paths.",
        },
    })