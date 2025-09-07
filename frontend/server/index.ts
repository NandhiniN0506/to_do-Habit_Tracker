import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Reverse proxy to Flask when configured
  const FLASK_API_URL = process.env.FLASK_API_URL;
  if (FLASK_API_URL) {
    const shouldProxy = (path: string) =>
      path.startsWith("/tasks") ||
      path.startsWith("/analytics") ||
      path.startsWith("/motivation") ||
      path.startsWith("/login") ||
      path.startsWith("/register") ||
      path.startsWith("/signup") ||
      path.startsWith("/google-login") ||
      path.startsWith("/wellness");

    app.use(async (req, res, next) => {
      try {
        // Let SPA routes (HTML navigations) be handled by Vite/React Router
        const accept = (req.headers["accept"] || "").toString();
        if (req.method === "GET" && accept.includes("text/html")) return next();
        if (!shouldProxy(req.path)) return next();
        const url = new URL(req.originalUrl, FLASK_API_URL);
        const headers = new Headers();
        for (const [k, v] of Object.entries(req.headers)) {
          if (v === undefined) continue;
          const lower = k.toLowerCase();
          if (lower === "host" || lower === "content-length" || lower === "connection" || lower === "accept-encoding") continue;
          headers.set(k, Array.isArray(v) ? v.join(",") : String(v));
        }
        const hasBody = !(req.method === "GET" || req.method === "HEAD");
        const init: RequestInit = {
          method: req.method,
          headers,
          body: hasBody ? JSON.stringify(req.body || {}) : undefined,
        };
        const resp = await fetch(url, init);
        res.status(resp.status);
        resp.headers.forEach((val, key) => {
          const k = key.toLowerCase();
          if (k === "content-encoding" || k === "transfer-encoding" || k === "content-length") return;
          res.setHeader(key, val);
        });
        const buf = Buffer.from(await resp.arrayBuffer());
        res.send(buf);
      } catch (e) {
        res.status(502).json({ message: "Proxy error", error: (e as Error).message });
      }
    });
  }

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  return app;
}
