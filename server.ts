import dotenv from "dotenv";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import { S3Client } from "@aws-sdk/client-s3";
import { authMiddleware } from "./src/server/middleware/auth";
import { generalLimiter } from "./src/server/middleware/rateLimiter";
import { validateEnv, config } from "./src/server/env";
import { RouteDeps } from "./src/server/types";
import authRoutes from "./src/server/routes/auth.routes";
import companyRoutes from "./src/server/routes/companies.routes";
import campaignRoutes from "./src/server/routes/campaigns.routes";
import assetRoutes from "./src/server/routes/assets.routes";
import articleRoutes from "./src/server/routes/articles.routes";
import userRoutes from "./src/server/routes/users.routes";

dotenv.config();

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

async function startServer() {
  validateEnv();

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  const app = express();
  const PORT = config.port;

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use("/uploads", express.static(UPLOADS_DIR));

  const deps: RouteDeps = { supabase, r2, upload, uploadsDir: UPLOADS_DIR };

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api', generalLimiter);
  app.use('/api', authMiddleware);
  app.use('/api', authRoutes(deps));
  app.use('/api', companyRoutes(deps));
  app.use('/api', campaignRoutes(deps));
  app.use('/api', assetRoutes(deps));
  app.use('/api', articleRoutes(deps));
  app.use('/api', userRoutes(deps));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => { res.sendFile(path.join(distPath, "index.html")); });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OrbitX Server running on http://localhost:${PORT}`);
  });
}

startServer();
