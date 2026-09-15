import { createServer } from 'node:http';
import { httpServerHandler } from 'cloudflare:node';
import { createApp } from './src/server/app';
import { validateEnv } from './src/server/env';
import { json, clientIp } from './src/server/http';
import { handleUpload } from './src/server/handlers/upload';
import { handleDownload } from './src/server/handlers/download';
import { handleZip } from './src/server/handlers/zip';

validateEnv();

const PORT = 8080; // routing key only, not a real socket
createServer(createApp()).listen(PORT);
const expressHandler = httpServerHandler({ port: PORT });

const DOWNLOAD_RE = /^\/api\/assets\/([^/]+)\/download$/;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const ip = clientIp(request);

    if (url.pathname.startsWith('/api/')) {
      const { success } = await env.API_LIMITER.limit({ key: ip });
      if (!success) return json({ error: 'Too many requests. Please slow down.' }, 429);

      const isLoginish = request.method === 'POST' && (url.pathname === '/api/login-code' || url.pathname === '/api/users');
      if (isLoginish) {
        const r = await env.LOGIN_LIMITER.limit({ key: ip });
        if (!r.success) return json({ error: 'Too many login attempts. Please try again later.' }, 429);
      }

      if (request.method === 'PUT' && url.pathname === '/api/upload') return handleUpload(request, env);
      if (request.method === 'POST' && url.pathname === '/api/assets/download-zip') return handleZip(request, env, ctx);
      const dl = request.method === 'GET' ? url.pathname.match(DOWNLOAD_RE) : null;
      if (dl) {
        let id: string;
        try { id = decodeURIComponent(dl[1]); } catch { return json({ error: 'Invalid asset id' }, 400); }
        return handleDownload(request, env, id);
      }
    }

    return expressHandler.fetch!(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
