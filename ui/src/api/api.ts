import { Elysia } from "elysia";
import { execRoute } from './exec';
import swagger from "@elysiajs/swagger";

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