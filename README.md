# OrbitX

Digital Media Asset Management for campaign assets, captions, and publishing schedules across company workspaces.

## Run Locally

1. `npm install`
2. Create `.dev.vars` with `SUPABASE_SERVICE_ROLE_KEY`, `ONBOARD_PASSWORD`, `JWT_SECRET` (see `.env.example`). Non-secret vars (`R2_PUBLIC_URL`, `SUPABASE_URL`) and the R2 bucket name live in `wrangler.jsonc`.
3. `npx wrangler login`
4. Terminal A: `npm run dev:api` (Worker on :8787). Terminal B: `npm run dev` (Vite on :5173, proxies `/api`).

## Deploy (Cloudflare Workers)

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put ONBOARD_PASSWORD
npx wrangler secret put JWT_SECRET
npm run deploy
```

`npm run validate` runs typecheck, tests, build, and a `wrangler deploy --dry-run` before you ship.
