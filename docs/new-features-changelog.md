# New Features Implementation Changelog

**Commit:** `c66aa53` | **Date:** 2026-07-14

> **Historical.** Written for the Express/Node host. Since the Cloudflare Workers migration (2026-09-16), download and ZIP live in `src/server/handlers/download.ts` and `src/server/handlers/zip.ts` (fflate, store-only); `archiver` is no longer a dependency. File storage is R2.

---

## Feature 1: Embed Video URL in Upload Section

Adds ability to embed YouTube/Vimeo videos as assets without file upload.

### Files Changed

**`src/components/WorkspaceDashboard.tsx`**
- Added `useState` import and `Link` icon from lucide-react
- Added `embedMode` and `embedUrl` local state
- Added `handleEmbedUrl` from app context
- Upload zone now has a toggle button (Link icon) to switch between file upload and URL embed mode
- Embed mode shows a URL text input + "Embed" submit button
- File upload mode preserves original drag-and-drop behavior

**`src/hooks/useMedia.ts`**
- Added `handleEmbedUrl(url: string)` function to `UseMediaReturn` interface
- Implementation validates URL against YouTube/Vimeo patterns
- Creates asset via `POST /api/assets` with `fileType: 'video/embed'` and the URL as `s3FileUrl`
- No R2 upload needed -- asset record points directly to external URL
- Role-based access enforced (ContentWriters blocked)

**`src/components/AssetCard.tsx`**
- Added `isEmbed` detection: checks `fileType === 'video/embed'` or URL pattern match
- Added `getEmbedUrl()` helper to convert watch URLs to embed format:
  - `youtube.com/watch?v=X` -> `youtube.com/embed/X`
  - `youtu.be/X` -> `youtube.com/embed/X`
  - `vimeo.com/123` -> `player.vimeo.com/video/123`
- New `<iframe>` render branch before video/image branches
- Revision and download buttons hidden for embed assets (no file to download/revise)

### How It Works

```
User clicks Link icon -> embed mode activates
User pastes YouTube/Vimeo URL -> clicks "Embed"
  -> handleEmbedUrl validates URL
  -> POST /api/assets { s3FileUrl: url, fileType: 'video/embed', ... }
  -> New asset appears in list
  -> AssetCard detects isEmbed, renders <iframe> with converted embed URL
```

---

## Feature 2: Revision Index Changed to Timestamp

Replaces the asset ID display with a human-readable timestamp.

### Files Changed

**`src/components/AssetCard.tsx`** (line 279)

Before:
```tsx
<span className="text-[10px] text-neutral-400 font-mono">Index: {asset.id}</span>
```

After:
```tsx
<span className="text-[10px] text-neutral-400 font-mono">
  {new Date(asset.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })}
</span>
```

Output format: `Jul 14, 2026, 02:30 PM`

---

## Feature 3: Download Button Forces Download (No Preview)

Cross-origin R2 URLs ignore the HTML `download` attribute, causing browsers to preview files instead of downloading. Fixed by adding a server-side proxy endpoint.

### Files Changed

**`src/server/routes/assets.routes.ts`** -- New endpoint

```
GET /api/assets/:id/download
```

- Looks up asset in Supabase by ID
- For local `/uploads/` files: uses `res.download()`
- For R2 files: extracts key from URL, fetches via `GetObjectCommand`, streams response with `Content-Disposition: attachment` header
- Sets `Content-Type` and `Content-Length` from R2 object metadata

New imports:
```typescript
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
```

**`src/components/AssetCard.tsx`** (line 302)

Before:
```tsx
onClick={() => {
  const a = document.createElement('a');
  a.href = asset.s3FileUrl;
  a.download = asset.s3FileUrl.split('/').pop()?.split('?')[0] || 'download';
  a.click();
}}
```

After:
```tsx
onClick={() => window.open(`/api/assets/${asset.id}/download`, '_blank')}
```

---

## Feature 4: Download All Assets as ZIP

Adds bulk download of all assets in current view as a single ZIP archive.

### New Dependency

```json
{
  "archiver": "^8.0.0",
  "@types/archiver": "^8.0.0"
}
```

### Files Changed

**`src/server/routes/assets.routes.ts`** -- New endpoint

```
POST /api/assets/download-zip
Body: { assetIds: string[] }
```

- Validates array has at least one ID
- Queries Supabase for all matching assets
- Filters out `video/embed` assets (not downloadable)
- Creates streaming ZIP archive using `ZipArchive` from archiver
- For each asset: fetches from R2 via `GetObjectCommand`, appends stream to archive
- Handles local `/uploads/` files via `archive.file()`
- Pipes archive directly to response (no memory buffering)
- Sets `Content-Disposition: attachment; filename="assets.zip"`

New imports:
```typescript
import { ZipArchive } from 'archiver';
```

**`src/hooks/useMedia.ts`**
- Added `handleDownloadAll(assetIds: string[])` function
- Added `isDownloadingZip` state for loading indicator
- Makes POST request to `/api/assets/download-zip` with asset IDs
- Receives response as Blob, creates object URL, triggers browser download
- Cleans up object URL after download

**`src/components/MediaTab.tsx`**
- Added `Archive` icon import from lucide-react
- Added `handleDownloadAll` and `isDownloadingZip` from app context
- New "Download All" button in toolbar (next to sort button)
- Filters out embed assets before collecting IDs
- Shows spinner + "Zipping..." during download
- Button only visible when downloadable assets exist

---

## Bonus Fix: Revision Upload Accept Types

**`src/components/AssetCard.tsx`** (line 285)

Before:
```tsx
accept="image/*"
```

After:
```tsx
accept="image/*,video/*,.psd"
```

Now matches the main upload zone's accepted file types.

---

## Summary of All Changed Files

| File | Changes |
|------|---------|
| `package.json` | Added `archiver` + `@types/archiver` |
| `src/components/AssetCard.tsx` | Embed iframe render, timestamp label, download proxy, hide buttons for embeds, revision accept fix |
| `src/components/MediaTab.tsx` | "Download All" ZIP button |
| `src/components/WorkspaceDashboard.tsx` | Embed mode toggle + URL input |
| `src/hooks/useMedia.ts` | `handleEmbedUrl`, `handleDownloadAll`, `isDownloadingZip` |
| `src/server/routes/assets.routes.ts` | `GET /assets/:id/download`, `POST /assets/download-zip` |

## New API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/assets/:id/download` | Proxy download with Content-Disposition: attachment |
| `POST` | `/api/assets/download-zip` | Bundle multiple assets into ZIP archive |
