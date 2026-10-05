#!/usr/bin/env node
/**
 * Telegram Self & Tabchi - Production Server Entry Point (Root CJS)
 * Serves the compiled frontend static assets from 'dist' and executes backend API services.
 */

process.env.TZ = "Asia/Tehran";
process.env.NODE_ENV = process.env.NODE_ENV || "production";

const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "dist");
const compiledServerFile = path.join(distDir, "server.cjs");

// If pre-compiled server daemon exists in dist/, execute full backend engine
if (fs.existsSync(compiledServerFile)) {
  try {
    require(compiledServerFile);
  } catch (err) {
    console.error("[SERVER.CJS] Error executing compiled backend in dist/server.cjs:", err);
    startFallbackServer();
  }
} else {
  startFallbackServer();
}

function startFallbackServer() {
  const express = require("express");
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Serve static assets from dist directory
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    console.log(`[SERVER.CJS] Serving static assets from: ${distDir}`);
  } else {
    console.warn(`[SERVER.CJS] Warning: 'dist' directory not found. Run 'npm run build' first.`);
  }

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "online",
      mode: "root_cjs_static_server",
      distReady: fs.existsSync(distDir),
      timestamp: new Date().toISOString(),
    });
  });

  // SPA fallback: return index.html for all frontend routes
  app.get("*", (req, res) => {
    const indexHtml = path.join(distDir, "index.html");
    if (fs.existsSync(indexHtml)) {
      res.sendFile(indexHtml);
    } else {
      res.status(503).send(`
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>در حال بیلد یا راه‌اندازی سرور...</title>
          <style>
            body { font-family: sans-serif; background: #0b0f19; color: #e2e8f0; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #131b2e; border: 1px solid #1e293b; padding: 2rem; border-radius: 1rem; text-align: center; max-width: 500px; }
            h1 { color: #38bdf8; font-size: 1.25rem; }
            p { font-size: 0.875rem; color: #94a3b8; }
            code { background: #0f172a; padding: 0.2rem 0.4rem; border-radius: 0.25rem; color: #a855f7; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>سرویس در حال استقرار یا بیلد است</h1>
            <p>فایل‌های پوشه <code>dist</code> هنوز آماده نشده‌اند. لطفاً دستور زیر را در سرور اجرا کنید:</p>
            <p><code>npm run build</code></p>
          </div>
        </body>
        </html>
      `);
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER.CJS] Application running on http://0.0.0.0:${PORT}`);
  });
}
