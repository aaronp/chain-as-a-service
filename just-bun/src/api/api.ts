import { Elysia } from "elysia";
import { execRoute } from './exec';
import swagger from "@elysiajs/swagger";
import { chainRoutes } from "./chain";
import { ERC20Routes } from "./erc20";
import { chainProxyHandler } from './impl/chainProxy';
import { chainStoreRoutes } from "./chainData";
import { chainProxyRoute } from "./proxy";

const app = new Elysia({
    name: "Chain-as-a-Service",
    prefix: "/api",
    detail: {
        tags: ["CAAS"],
        description:
            "Chain as a service",
    },
})
    .use(
        swagger({
            path: "/docs",
            scalarConfig: {
                forceDarkModeState: "dark",
                // favicon: "/favicon.svg",
            },
            documentation: {
                info: {
                    title: "Chain-As-A-Service",
                    description: "The CaaS API",
                    version: "0.0.1",
                },
                tags: [
                    {
                        name: "CAAS",
                        description: "CAAS docs",
                    },
                    {
                        name: "Execute",
                        description: "Execute commands",
                    },
                    {
                        name: "ERC20",
                        description: "ERC20 commands",
                    },
                    {
                        name: "chainProxy",
                        description: "Proxy JSON-RPC requests to anvil for a given chainId (currently only localhost:8545 supported)",
                    },
                ],
            },
            exclude: ["/docs", "/"], // exclude our own swagger docs, including the root redirect
        }),
    )
    .onRequest(({ set }) => {
        // Disable caching
        set.headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
        set.headers["Pragma"] = "no-cache";
        set.headers["Expires"] = "0";
    })
    .use(execRoute)
    .use(chainRoutes)
    .use(ERC20Routes)
    .use(chainStoreRoutes)
    .use(chainProxyRoute)
    .get("/", ({ set, request }) => {
        console.log("Redirecting to swagger docs at /docs from root");
        set.headers["Location"] = "/api/docs";
        set.status = 302; // 302 is for temporary redirection
        return "Redirecting to /docs...";
    }, { tags: ["Docs"] })
    .onError(({ code, error, request }) => {
        console.error(
            ` 💥 Unhandled error: ${code} for ${request.method} ${request.url} 💥 `,
        );
        if ((error as any).stack) {
            console.error((error as any).stack);
        }

        return new Response("Internal Error", { status: 512 });
    })
    .get("/test", () => {
        console.log("elysia GET /api");
        return {
            message: "Hello from Chain-as-a-Service!",
            method: "GET",
        };
    });

export default app;
export type Api = typeof app;
