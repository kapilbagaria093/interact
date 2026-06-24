/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

import { recalculateScoresAndStats } from "./server/db";
import { registerRoutes } from "./server/routes";

dotenv.config();

const app = express();
const PORT = 3000;

// Body size limit increased for base64 images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Recalculate once on start to ensure up-to-date data structures
recalculateScoresAndStats();

// Register all modular application endpoints
registerRoutes(app);

// ----------------------------------------------------
// VITE DEV SERVER OR STATIC SERVING MIDDLEWARE
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
