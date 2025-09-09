import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Basic health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}
