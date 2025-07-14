import { serve } from "bun";
import index from "./index.html";
import apiApp from "./api/api";

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,
    "/api": async req => apiApp.handle(req),
    "/api/*": async req => apiApp.handle(req),
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
