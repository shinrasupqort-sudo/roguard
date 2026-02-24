import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Determine the build directory path.
  // In production, the bundled file is at dist/index.js, so we resolve from there.
  let distPath: string;

  try {
    // import.meta.url in ESM gives us file:/// URL of the current module
    // When bundled by esbuild to dist/index.js, import.meta.url = file:///path/to/dist/index.js
    const fileUrl = new URL(import.meta.url);
    const bundledFile = fileUrl.pathname;
    const bundledDir = path.dirname(bundledFile);
    
    // bundledDir is /path/to/dist, so dist/public is in bundledDir/public
    distPath = path.join(bundledDir, "public");
    console.log(`[serveStatic] Resolved from import.meta.url: ${distPath}`);
  } catch (e) {
    // Fallback for any issues: use process.cwd()
    console.log(`[serveStatic] Fallback to process.cwd()`);
    distPath = path.resolve(process.cwd(), "dist", "public");
  }

  const indexHtmlPath = path.join(distPath, "index.html");

  console.log(`[serveStatic] distPath: ${distPath}`);
  console.log(`[serveStatic] indexHtmlPath: ${indexHtmlPath}`);
  console.log(`[serveStatic] distPath exists: ${fs.existsSync(distPath)}`);
  console.log(`[serveStatic] index.html exists: ${fs.existsSync(indexHtmlPath)}`);

  if (!fs.existsSync(distPath)) {
    console.error(`[ERROR] Build directory not found: ${distPath}`);
    console.error(`[ERROR] Current working directory: ${process.cwd()}`);
    console.error(`[ERROR] Run 'pnpm build' to generate the frontend build.`);
  }

  // Serve static files (JS, CSS, images, etc.)
  app.use(express.static(distPath, { maxAge: "1d" }));

  // SPA fallback: serve index.html for all other routes
  app.use("*", (_req, res) => {
    if (fs.existsSync(indexHtmlPath)) {
      console.log(`[serveStatic] Serving index.html for SPA route`);
      res.sendFile(indexHtmlPath);
    } else {
      console.error(`[ERROR] index.html not found at ${indexHtmlPath}`);
      res.status(404).send("Frontend build not found. Please run 'pnpm build'.");
    }
  });
}
