import express from 'express';
import { authMiddleware } from './middleware/auth';
import { getSupabase } from './db';
import { RouteDeps } from './types';
import authRoutes from './routes/auth.routes';
import companyRoutes from './routes/companies.routes';
import campaignRoutes from './routes/campaigns.routes';
import assetRoutes from './routes/assets.routes';
import articleRoutes from './routes/articles.routes';
import userRoutes from './routes/users.routes';

export function createApp(): express.Express {
  const app = express();
  app.set('trust proxy', 1);
  // 5mb covers base64 company logos (client caps at 2MB); file uploads stream via PUT /api/upload
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ limit: '5mb', extended: true }));

  const deps: RouteDeps = { supabase: getSupabase() };

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api', authMiddleware);
  app.use('/api', authRoutes(deps));
  app.use('/api', companyRoutes(deps));
  app.use('/api', campaignRoutes(deps));
  app.use('/api', assetRoutes(deps));
  app.use('/api', articleRoutes(deps));
  app.use('/api', userRoutes(deps));
  app.use('/api', (_req, res) => { res.status(404).json({ error: 'Not found' }); });

  return app;
}
