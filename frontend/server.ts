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

  // Signup endpoint
  app.post("/signup", (req, res) => {
    const { email, password, confirm_password } = req.body;

    // Basic validation
    if (!email || !password || !confirm_password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // For demo purposes, just return success
    // In a real app, you'd save to database
    res.json({
      message: "Signup successful",
      user: { email }
    });
  });

  // Google login endpoint
  app.post("/google-login", (req, res) => {
    const { id_token, extra_data } = req.body;

    if (!id_token) {
      return res.status(400).json({ error: "ID token is required" });
    }

    // For demo purposes, simulate first-time login requiring extra info
    if (!extra_data) {
      return res.status(400).json({
        error: "Additional info required for first-time Google login"
      });
    }

    // For demo purposes, just return success with a mock token
    res.json({
      message: "Google login successful",
      token: "mock-jwt-token-" + Date.now(),
      user: extra_data
    });
  });

  return app;
}
