# OrbitX— Cursor Handoff

## Project Context

This is a **Digital Media Asset Management (DAM)** web app exported from Google AI Studio. It manages campaign media assets, captions, and publishing schedules across company workspaces ("brand spaces").

**Stack:** React 19 + TypeScript + Vite 6 + Tailwind CSS 4 + Express backend + JSON file DB (db.json)

**Current state:** The app builds and runs (`npm run dev` → localhost:3000). Two changes from the last AI Studio session are incomplete. The codebase also has structural issues that need fixing before feature work.

---

## Priority 0 — Fix Before Anything Else

### 0A. Split App.tsx (3,091 lines → components)

`src/App.tsx` is a single monolith. AI coding tools struggle with files this large. Split into:

```
src/
├── App.tsx              (router/layout shell, ~100 lines)
├── components/
│   ├── LoginScreen.tsx  (access code login + pre-approved user list)
│   ├── OnboardingModal.tsx (new user creation with password)
│   ├── CompanySelector.tsx (brand workspace picker + create form)
│   ├── WorkspaceDashboard.tsx (main layout after selecting company)
│   ├── FolderSidebar.tsx (project folder list + create form)
│   ├── MediaTab.tsx     (asset grid, upload, status management)
│   ├── ArticlesTab.tsx  (article list, create/edit)
│   ├── AssetCard.tsx    (individual asset display + actions)
│   ├── UserDirectory.tsx (user management panel)
│   └── common/
│       ├── Modal.tsx
│       └── StatusBadge.tsx
├── hooks/
│   └── useApi.ts        (shared fetch helpers)
├── types.ts             (already clean, keep as-is)
├── index.css            (keep as-is)
└── main.tsx             (keep as-is)
```

**Rules for splitting:**
- Do NOT change any functionality — exact same behavior, just in separate files
- Keep all existing Tailwind classes as-is
- Keep motion/framer-motion animations as-is
- State that's shared across components should be lifted to App.tsx and passed as props (or use React context)
- Each component file should be under 300 lines ideally

### 0B. Move hardcoded password to environment variable

In `server.ts` line 307:
```ts
// BEFORE (security risk):
if (password !== "BigData01*") {

// AFTER:
if (password !== process.env.ONBOARD_PASSWORD) {
```

Add to `.env.example`:
```
ONBOARD_PASSWORD="BigData01*"
```

### 0C. Clean up AI Studio artifacts

1. Delete `metadata.json` (AI Studio-only config, not needed locally)
2. In `vite.config.ts`: remove the `DISABLE_HMR` comments and conditional logic — simplify to just:
   ```ts
   server: { hmr: true }
   ```
3. In `index.html`: change `<title>` from "My Google AI Studio App" to "OrbitX"
4. In `package.json`: change `"name"` from `"react-example"` to `"campaign-media-asset-hub"`
5. Remove `@google/genai` from dependencies (it's imported nowhere — re-add later when implementing AI features)

---

## Priority 1 — Complete Incomplete Changes

### 1A. Add projectType selector to folder creation form

**Backend:** Already done. `POST /api/companies/:companyId/folders` accepts `projectType` ('both' | 'media' | 'articles') and defaults to 'both'.

**Frontend (not done):** The create folder form in the UI needs a selector. After the folder name and description inputs, add a 3-option toggle:

- "Digital Marketing Media" → sends `projectType: 'media'`
- "Article & Blog Write-ups" → sends `projectType: 'articles'`  
- "Both" → sends `projectType: 'both'` (default, pre-selected)

The `body: JSON.stringify(...)` in the folder creation fetch call (currently around line 580 of App.tsx) needs to include `projectType`.

**Tab visibility:** After selecting a folder, the workspace tabs (Media / Articles) should respect the folder's `projectType`:
- If `projectType === 'media'`: only show the Media tab, hide Articles tab
- If `projectType === 'articles'`: only show the Articles tab, hide Media tab  
- If `projectType === 'both'`: show both tabs (current behavior)

### 1B. Scope PRE-APPROVED USERS to browser cache (localStorage)

**Current behavior:** The login screen shows ALL users with their access codes visible. Anyone can impersonate anyone.

**Target behavior:** 
1. When a user successfully logs in, save their `{ id, username, role, accessCode }` to `localStorage` under a key like `"dam_known_users"` (array of users).
2. On the login screen, only show users from localStorage (people who have previously logged in on this device).
3. A fresh browser shows NO user list — just the access code input field.
4. Add a small "Forget me" / "Clear" button next to each cached user to remove them from localStorage.
5. The full user directory (all users) is only visible AFTER login inside the workspace, for Team Leads only.

**Important:** access codes are still visible for cached users since the user chose to remember on this device — this is by design (like a "remember me" feature).

---

## Priority 2 — Pre-Production Fixes (Before Deployment)

### 2A. Replace JSON file database with Firestore or Supabase

`db.json` is a flat file on disk. It works locally but will lose all data on Cloud Run redeploy.

**Recommended:** Firebase Firestore (free tier: 1GB, 50K reads/day)
- Collections: `companies`, `users`, `projectFolders`, `assets`, `articles`
- Replace all `readDB()` / `writeDB()` calls in server.ts with Firestore operations

### 2B. Replace simulated S3 with Google Cloud Storage

The `/api/simulated-s3/` endpoint writes files to a local `uploads/` folder. Same ephemeral problem.

**Recommended:** Google Cloud Storage (same network as Cloud Run = zero egress)
- Use `@google-cloud/storage` package
- Generate signed URLs for uploads (replace presigned URL simulation)
- Serve assets via Cloud CDN for caching

### 2C. Add proper authentication

Current auth is just access code lookup with no session/token. For production:
- Firebase Auth (free for 50K monthly users)
- Issue JWT tokens on login
- Middleware to verify tokens on API routes

---

## Key Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `src/App.tsx` | All frontend UI (needs splitting) | 3,091 |
| `server.ts` | Express API + JSON DB | 558 |
| `src/types.ts` | TypeScript interfaces | 62 |
| `src/index.css` | Tailwind config + fonts | 24 |
| `vite.config.ts` | Vite + Tailwind plugin | 22 |
| `package.json` | Dependencies + scripts | 35 |

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build (frontend + server)
npm run start        # Run production build
npm run lint         # TypeScript type check
npm run clean        # Delete dist, db.json, uploads
```

## Architecture Notes

- Frontend and backend run from the same Express server (Vite middleware in dev, static files in prod)
- File uploads go through a simulated S3 flow: client gets presigned URL → PUT to `/api/simulated-s3/:key` → stored in `./uploads/`
- All data stored in `db.json` — read/write on every request (no caching)
- User roles: **Team Lead** (admin), **Designer** (upload media), **Content Writer** (articles only)
- Content Writers cannot upload media files (role-gated in UI)
