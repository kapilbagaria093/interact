/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Express } from "express";
import authRouter from "./routes/auth.ts";
import issuesRouter from "./routes/issues.ts";
import usersRouter from "./routes/users.ts";
import { getLeaderboardData, getCommunityStats } from "../src/db/issues.ts";

export function registerRoutes(app: Express) {
  // Mount modular route handlers
  app.use("/api/auth", authRouter);
  app.use("/api/issues", issuesRouter);
  app.use("/api/users", usersRouter);

  // Legacy direct-mapped routes for seamless frontend compatibility
  app.post("/api/analyze", async (req, res) => {
    try {
      res.redirect(307, "/api/issues/analyze");
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/leaderboard", async (req, res) => {
    try {
      const data = await getLeaderboardData();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const data = await getCommunityStats();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}

