import { serve } from "bun";
import index from "./index.html";
import apiApp from "./api/api";

const logRequest = (req: Request) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
};

const logResponse = (res: Response) => {
  // Log status and content-type (do not log full body for brevity)
  console.log(`→ Response: ${res.status} ${res.headers.get("content-type") || ""}`);
};

function withLogging(handler: (req: Request) => Promise<Response> | Response) {
  return async (req: Request) => {
    logRequest(req);
    let res: Response;
    try {
      res = await handler(req);
    } catch (err) {
      console.error("Handler error:", err);
      res = new Response("API error", { status: 500 });
    }
    logResponse(res);
    return res;
  };
}

const server = serve({
  hostname: "0.0.0.0", // Added to allow external access in Docker
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,
    "/api": withLogging(async req => {
      return await apiApp.handle(req);
    }),
    "/api/*": withLogging(async req => {
      return await apiApp.handle(req);
    }),
    "/src/frontend.tsx": req => {
      logRequest(req);
      console.log("Request for frontend.tsx");
      // Let Bun handle this as a static asset, but log it
      return undefined;
    },
  },
  websocket: {
    message() { }
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
