import Elysia from 'elysia';
import { chainProxyHandler } from './impl/chainProxy';
import { chainStore } from './chainData';
import Request from 'elysia';

const handler = async ({ body, params, store, request, path }: {
    body: any;
    params: Record<string, string>;
    store: { chainData: any };
    // request: any; // Let TypeScript infer the type
    path: string;
    request: any;
}) => {
    const chainId = params.chainId;
    const subpath = params.subpath || "";
    const method = request.method;
    const chain = store.chainData.get(chainId);

    console.log(`on ${method} ${subpath} for chain ${chainId} with path ${path}`);
    const response = await chainProxyHandler(body, chain, { method, subpath, path });
    console.log("proxy response", response);
    store.chainData.append(chainId, response.state);
    return response.result;
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