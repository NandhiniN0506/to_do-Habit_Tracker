import path from "path";
import "dotenv/config";
import * as express from "express";
import express__default from "express";
import cors from "cors";
const handleDemo = (req, res) => {
  const response = {
    message: "Hello from Express server"
  };
  res.status(200).json(response);
};
function createServer() {
  const app2 = express__default();
  app2.use(cors());
  app2.use(express__default.json());
  app2.use(express__default.urlencoded({ extended: true }));
  const FLASK_API_URL = process.env.FLASK_API_URL;
  if (FLASK_API_URL) {
    const shouldProxy = (path2) => path2.startsWith("/tasks") || path2.startsWith("/analytics") || path2.startsWith("/motivation") || path2.startsWith("/login") || path2.startsWith("/register") || path2.startsWith("/signup") || path2.startsWith("/google-login") || path2.startsWith("/wellness");
    app2.use(async (req, res, next) => {
      try {
        const accept = (req.headers["accept"] || "").toString();
        if (req.method === "GET" && accept.includes("text/html")) return next();
        if (!shouldProxy(req.path)) return next();
        const url = new URL(req.originalUrl, FLASK_API_URL);
        const headers = new Headers();
        for (const [k, v] of Object.entries(req.headers)) {
          if (v === void 0) continue;
          const lower = k.toLowerCase();
          if (lower === "host" || lower === "content-length" || lower === "connection" || lower === "accept-encoding") continue;
          headers.set(k, Array.isArray(v) ? v.join(",") : String(v));
        }
        const hasBody = !(req.method === "GET" || req.method === "HEAD");
        const init = {
          method: req.method,
          headers,
          body: hasBody ? JSON.stringify(req.body || {}) : void 0
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
        res.status(502).json({ message: "Proxy error", error: e.message });
      }
    });
  }
  app2.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  app2.get("/api/demo", handleDemo);
  return app2;
}
const app = createServer();
const port = process.env.PORT || 3e3;
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
//# sourceMappingURL=node-build.mjs.map
