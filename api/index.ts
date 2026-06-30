import express from "express";
import dotenv from "dotenv";
import { registerRoutes } from "../server/routes.ts";
import { seedDatabase } from "../src/db/seed.ts";

dotenv.config();

const app = express();

// Increase body size limit for base64 issue images
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Register all API routes
registerRoutes(app);

// Seed Postgres database on-demand if needed
let seeded = false;
app.use(async (req, res, next) => {
  if (!seeded) {
    try {
      await seedDatabase();
      seeded = true;
    } catch (error) {
      console.error("Failed to seed database on serverless start:", error);
    }
  }
  next();
});

// Export default for Vercel Serverless runtime
export default app;
