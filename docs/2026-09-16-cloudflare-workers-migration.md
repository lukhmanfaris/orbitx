# Cloudflare Workers Migration — Changelog

**Date:** 2026-09-16 | **Range:** `22be17f`..`8780187` (18 commits + 1 merge) | **Branch:** `feat/cloudflare-workers` → `main`

OrbitX moved from a Node/Express host with local disk uploads to a single Cloudflare Worker with R2 object storage, custom domain, and Git-triggered deploys.

**Live:** https://orbitx.my

---

## 1. Runtime: Node/Express → Cloudflare Worker

**Entry:** `worker.ts` (new)

- Worker `fetch` handler is the front door. Express app still runs inside the Worker via `cloudflare:node` `httpServerHandler` as a fallback for routes not yet ported.
- Static assets served by Workers Assets from `dist/`, SPA fallback, `run_worker_first` for `/api/*` and `/health`.
- `validateEnv()` runs at module load; missing secrets throw at startup instead of failing per-request.

**Native handlers** (`src/server/handlers/`, new) — bypass Express, stream directly:

| Route | Handler | Notes |
|---|---|---|
| `PUT /api/upload` | `upload.ts` | Raw body stream → R2. Headers `Content-Type` + `X-File-Name` (URI-encoded). 100MB cap via `Content-Length`. 400 on malformed `X-File-Name`. |
| `GET /api/assets/:id/download` | `download.ts` | Authenticated proxy from R2, `Content-Disposition: attachment`. Guards `decodeURIComponent` on id. |
| `POST /api/assets/download-zip` | `zip.ts` | Streaming ZIP via `fflate` (store-only, no compression). Strict backpressure on the output stream. Max 200 assets per request. |

**Rate limiting** — Cloudflare Rate Limiting bindings replace `express-rate-limit`:

| Binding | Limit | Key | Scope |
|---|---|---|---|
| `API_LIMITER` | 100 / 60s | client IP | all `/api/*` |
| `LOGIN_LIMITER` | 5 / 60s | client IP | `POST /api/login-code`, `POST /api/users` |
| `UPLOAD_LIMITER` | 10 / 60s | user id | `PUT /api/upload` |

**Shared server modules** (new): `src/server/http.ts` (`json()`, `clientIp()`, `requireAuth()`), `src/server/auth/verifyToken.ts` (JWT verify shared by Express middleware and native handlers), `src/server/storage.ts` (`safeKey()`, `MAX_UPLOAD_BYTES`, public-URL ↔ key helpers), `src/server/db.ts` (stateless Supabase client).

**Express cleanup:** removed `fs`, `multer`, `archiver`, `express-rate-limit` from routes. `server.ts` deleted. `RouteDeps` slimmed. Env access throws on missing values.

**Hardening** (`a8b56b4`, `af0b1fb`): null-body guard on upload, asset cap on zip, filename sanitisation, DB error → HTTP status mapping, 5MB JSON body limit (base64 company logos), JSON 404 for unknown `/api/*` routes.

## 2. Storage: local `uploads/` → R2

- Bucket `orbitx` (APAC), binding `R2_BUCKET`, public URL via `R2_PUBLIC_URL` var.
- Key format unchanged: `uploads/<timestamp>_<sanitised-name>`.
- **Migration:** `scripts/migrate-uploads.sh` copied 36 legacy files to R2 (all HEAD-verified present). `scripts/migrate-upload-urls.mjs` + `docs/migrations/2026-09-16-uploads-to-r2.sql` rewrote `assets.s3_file_url` and `companies.logo_url` from `/uploads/x` → `<R2_PUBLIC_URL>/uploads/x`.
- Local `uploads/` dir and `.env` removed from the working tree (both gitignored, both legacy).

## 3. Client

`src/utils/api.ts`:
- `apiUpload(url, FormData)` → `apiUploadFile(file)`: raw `PUT` with file as body, no multipart.
- New `apiDownload(url, filename, init?)`: authenticated fetch → blob → anchor click. Used for single download and ZIP.
- Dropped legacy `/uploads/` URL rewriting.

`useMedia.ts`, `AssetCard.tsx`, `FullArticleTab.tsx`, `useWorkspace.ts` updated for the new API shape.

## 4. Config & tooling

| File | Change |
|---|---|
| `wrangler.jsonc` | New. Worker name `orbitx`, `nodejs_compat`, assets, R2, rate limits, vars, observability. `workers_dev: false`, `preview_urls: false`. Route: `orbitx.my` (custom domain, apex only — `www` deferred). |
| `worker-configuration.d.ts` | Generated `Env` types (`npm run types`). |
| `tsconfig.worker.json` | Separate typecheck for Worker code. `npm run lint` checks both. |
| `package.json` | Removed `@aws-sdk/client-s3`, `archiver`, `multer`, `dotenv`, `express-rate-limit` (+ types). Added `fflate`, `wrangler`. Added `overrides.iconv-lite: ^0.6.3` — **required**; wrangler bundles with platform=browser and iconv-lite 0.4 crashes under `nodejs_compat` (workers-sdk #9309). |
| `.env.example` | Now documents `.dev.vars` for local secrets; non-secret vars live in `wrangler.jsonc`. |
| `.gitignore` | `+ .dev.vars`, `.wrangler/`. |
| `scripts/validate.sh` | Updated for Workers; `safeKey` excluded from `Date.now()` ID check. |
| `tests/server/` | New: `verifyToken.test.ts`, `storage.test.ts` (11 tests total). |
| `README.md` | Run Locally + Deploy sections rewritten for Workers. |

## 5. Deploy & domain

- **Custom domain** `orbitx.my` bound via `routes[].custom_domain`. `workers.dev` and preview URLs disabled.
- **Workers Builds** connected to GitHub `lukhmanfaris/orbitx`, branch `main`. Build `npm run build`, deploy `npx wrangler deploy`, `NODE_VERSION=22`, preview builds off, build caching on. Verified: push `1cfc3f3` → deployment 28s later with no local `wrangler deploy`.
- **Push to `main` = deploy.** Do not run `npm run deploy` locally anymore; it races CI.
- Secrets set once via `wrangler secret put`: `SUPABASE_SERVICE_ROLE_KEY`, `ONBOARD_PASSWORD`, `JWT_SECRET`. They persist across deploys.

## 6. Dependencies (`8780187`)

`npm audit fix` + `npm update` (semver-range only): 9 vulnerabilities → 0. Notable: `nanoid`, `postcss`, `browserslist` (high); `dompurify`, `body-parser`, `qs` (moderate). No major-version bumps. Lint, tests, Vite build, and `wrangler deploy --dry-run` all pass.

## Local development

```bash
npm run dev:api   # wrangler dev :8787 — remote R2 binding, hits real bucket
npm run dev       # vite :5173, proxies /api → :8787
npm run lint      # tsc for client + worker
npm test          # vitest
```
Secrets in `.dev.vars` (gitignored). Wrangler OAuth expires periodically → `npx wrangler login`.

## Deferred / follow-ups

- `www.orbitx.my` — no DNS record yet. Needs proxied CNAME + redirect rule to apex.
- Port remaining Express routes (`articles`, `assets`, `auth`, `campaigns`, `companies`, `users`) to native handlers; drop Express + `body-parser`/`qs` from the bundle.
- Major bumps pending: `lucide-react` 1.x, `motion` 13, `@vitejs/plugin-react` 6, `express` 5 (moot if Express dropped).
