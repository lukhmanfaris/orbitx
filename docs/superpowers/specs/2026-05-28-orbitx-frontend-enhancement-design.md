# OrbitX Frontend Enhancement — Design Spec

**Date:** 2026-05-28
**Scope:** Incremental enhancement of existing React/TypeScript frontend
**Stack:** React 19, TypeScript, Tailwind CSS 4, Vite 6, Motion (Framer Motion)

---

## 1. Overview

OrbitX is a Digital Media Asset Management (DAM) web app with a working React frontend and Express backend. This spec covers four enhancement areas in three phases:

| Phase | Enhancement | Dependencies |
|-------|-------------|-------------|
| 1 | Split AppContext into focused hooks | None |
| 2 | ProjectType selector + Error handling | Phase 1 |
| 3 | UI/UX polish (empty states, responsive, a11y, perf) | Phase 1-2 |

---

## 2. Phase 1: Split AppContext Monolith

### 2.1 Current State

`src/AppContext.tsx` is 999 lines with ~90 state variables and ~30 handler functions in a single `useAppState()` hook. All components consume the same context, causing unnecessary re-renders and making the codebase difficult to extend.

### 2.2 Target Architecture

```
src/
├── AppContext.tsx          # Thin provider (~80 lines, composes hooks)
├── hooks/
│   ├── useAuth.ts          # Auth state: login, logout, proxy, remembered users
│   ├── useWorkspace.ts     # Companies, campaigns, posting folders CRUD
│   ├── useMedia.ts         # Assets CRUD, upload, search/filter/sort, drag-drop
│   ├── useArticles.ts      # Articles CRUD, full-screen editor
│   ├── useOnboarding.ts    # User directory management
│   └── useActivity.ts      # Activity feed entries
├── utils/
│   └── api.ts              # Shared fetch wrapper (apiGet, apiPost, apiPut, apiDelete)
```

### 2.3 Hook Wiring (Dependency Flow)

```
useAuth (fetches users, remembers login)
   │
   ▼
useWorkspace (needs currentUser for role checks, fetchCampaigns etc.)
   │
   ├──▶ useMedia (needs selectedPostingId, currentUser for role checks)
   │
   └──▶ useArticles (needs selectedPostingId, currentUser)
```

The thin `AppProvider` wires these by passing results from upstream hooks as params to downstream hooks. Example:

```tsx
// AppContext.tsx (thin provider)
const auth = useAuth();
const workspace = useWorkspace({ currentUser: auth.currentUser });
const media = useMedia({
  selectedPostingId: workspace.selectedPostingId,
  currentUser: auth.currentUser,
});
const articles = useArticles({
  selectedPostingId: workspace.selectedPostingId,
  currentUser: auth.currentUser,
});
const onboarding = useOnboarding({ currentUser: auth.currentUser });
const activity = useActivity({ currentUser: auth.currentUser });
```

### 2.4 Hook Boundaries

**useAuth.ts** (~80 lines)
- State: `currentUser`, `accessCodeInput`, `loginError`, `proxyOriginalUser`, `rememberedUsers`
- Handlers: `handleCodeLogin`, `handleLogout`, `handleProxyLogin`, `handleExitProxy`, `removeRememberedUser`, `rememberUserInLocalStorage`
- Effects: localStorage persistence for hub_user, remembered users; initial user restore on mount

**useWorkspace.ts** (~200 lines)
- State: `currentCompany`, `availableCompanies`, `campaigns`, `postingFolders`, `selectedCampaignId`, `selectedPostingId`, `campaignPostingCounts`, `allCompanyCampaigns`, form states (newCampaignName, newCampaignDescription, newCampaignProjectType, newPostingName, newPostingDescription, newPostingProjectType, isCreatingCampaign, isCreatingPosting, folderError), company creation form states, `sidebarCollapsed`
- Handlers: `fetchCompanies`, `fetchCampaigns`, `fetchPostings`, `fetchDirectoryInfo`, `handleCreateCompany`, `handleLogoUpload`, `handleCreateCampaign`, `handleDeleteCampaign`, `handleCreatePosting`, `handleDeletePosting`
- Effects: fetch companies on mount, fetch campaigns on company change, fetch postings on campaign change, localStorage persistence

**useMedia.ts** (~150 lines)
- State: `assets`, `loadingAssets`, `searchQuery`, `statusFilter`, `sortOrder`, `isDragOver`, `isUploading`, `uploadProgress`, `uploadError`, `uploadingFileName`, `editingAssetId`, `editCaption`, `editArtworkComment`, `editRevisedCaption`, `editSchedule`, `editStatus`, `copiedAssetId`, `fileInputRef`
- Handlers: `fetchAssets`, `handleS3FileUpload`, `handleDragOver`, `handleDragLeave`, `handleDrop`, `handleQuickStatusUpdate`, `triggerEditing`, `saveEdits`, `deleteAsset`, `copyCaptionToClipboard`
- Computed: `filteredAssets`, `draftCount`, `refineCount`, `readyCount`, `formatMimeTypeDescription`
- Effects: fetch assets on posting change

**useArticles.ts** (~120 lines)
- State: `articles`, `loadingArticles`, `activeWorkspaceTab`, `isArticleFullTab`, `isCreatingArticle`, `articleTitle`, `articleBody`, `articlePreparedBy`, `articleDate`, `articleError`, `editingArticleId`
- Handlers: `fetchArticles`, `handleCreateArticle`, `handleUpdateArticle`, `handleDeleteArticle`
- Effects: fetch articles on posting change

**useOnboarding.ts** (~100 lines)
- State: `isOnboardingOpen`, `directoryUsers`, `onboardSearchQuery`, `onboardName`, `onboardRole`, `onboardAccessCode`, `onboardError`, `onboardSuccess`, `onboardPassword`, `editingUserId`, `editingUserName`, `editingUserRole`, `editingUserCode`, `editingUserError`
- Handlers: `handleOnboardMember`, `handleSaveMemberEdit`, `handleDeleteMember`, `triggerAutoCodeGeneration`, `triggerEditAutoCodeGeneration`
- Effects: fetch directory users when onboarding opens

**useActivity.ts** (~30 lines)
- State: `activities`
- Handlers: `pushActivity`

### 2.5 API Utility (utils/api.ts)

Shared fetch wrapper used by all hooks:

```typescript
export async function parseJSON(res: Response): Promise<any> { /* existing logic */ }

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new ApiError(res.status, await res.json());
  return parseJSON(res);
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status, await res.json());
  return parseJSON(res);
}

export async function apiPut<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status, await res.json());
  return parseJSON(res);
}

export async function apiDelete<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'DELETE',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new ApiError(res.status, await res.json());
  return parseJSON(res);
}

export class ApiError extends Error {
  constructor(public status: number, body: any) {
    super(body?.error || `Request failed (${status})`);
  }
}
```

### 2.6 Migration Strategy

1. Create `src/utils/api.ts` with the shared fetch wrappers
2. Create each hook file, extracting state and handlers from AppContext.tsx
3. Rewrite AppContext.tsx as a thin provider composing all hooks
4. Update `AppContextValue` interface to match the composed hooks' return values
5. **Zero component changes** — all components continue using `useAppContext()` with the same API surface
6. Verify the app runs identically before proceeding to Phase 2

---

## 3. Phase 2: ProjectType Selector + Error Handling

### 3.1 ProjectType Selector on Posting Form

#### Purpose

Add a `projectType` field to posting folders for organizational labeling. **This is a label only — it does NOT restrict tab visibility.** Both Media and Articles tabs remain always visible for every posting folder, regardless of projectType value.

#### Changes

**types.ts** — Add optional field:
```typescript
export interface PostingFolder {
  // ...existing fields...
  projectType?: 'both' | 'media' | 'articles';
}
```

**server.ts** — Accept `projectType` in POST body for `/api/campaigns/:campaignId/postings`:
```typescript
// In the handler, accept projectType from req.body
const { name, description, projectType } = req.body;
// Store it on the new posting folder record
const newFolder: PostingFolder = {
  id: `folder-${Date.now()}`,
  campaignId,
  name,
  description: description || '',
  createdAt: new Date().toISOString(),
  projectType: projectType || 'both',
};
```

**FolderSidebar.tsx** — Add a 3-button toggle in the posting creation form (below description input, above error message). Same visual style as the campaign form's projectType toggle:

```tsx
{/* Inside the posting creation form, after description input */}
<div>
  <div className="flex bg-neutral-100 rounded-lg p-0.5 border border-neutral-200">
    {(['media', 'articles', 'both'] as const).map(opt => {
      const isSelect = newPostingProjectType === opt;
      const label = opt === 'media' ? 'Media' : opt === 'articles' ? 'Articles' : 'Both';
      return (
        <button key={opt} type="button" onClick={() => setNewPostingProjectType(opt)}
          className={`flex-1 text-[10px] font-medium font-mono uppercase px-2 py-1.5 rounded transition-colors ${isSelect ? 'bg-neutral-800 text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50'}`}
        >{label}</button>
      );
    })}
  </div>
</div>
```

**useWorkspace.ts** — Add `newPostingProjectType` state (default `'both'`), include it in `handleCreatePosting`'s POST body, reset on successful creation.

#### What does NOT change

- WorkspaceDashboard tab visibility logic is **unaffected** — both tabs always visible
- No filtering or hiding based on posting's projectType
- The campaign-level projectType continues to control tab visibility as before (existing behavior unchanged)

### 3.2 Error Handling & Resilience

#### Toast Notification System

**Components:**
- `hooks/useToast.ts` — Manages a `toasts[]` state array. Exposes `addToast(type, title, message)` and `removeToast(id)`. Types: `success`, `error`, `warning`, `info`. Auto-dismiss after 5 seconds. Max 5 visible toasts.
- `components/common/ToastContainer.tsx` — Fixed bottom-right container. Animated toast stack using Motion (slide-in from right, fade-out on dismiss). Each toast has icon + title + message + close button. Color-coded by type (red for error, green for success, amber for warning, blue for info).

**Integration:** All existing `alert()` calls replaced with `addToast()`. All catch blocks that currently only `console.error()` now also show an error toast. The toast function is provided via context (added to AppContextValue).

#### API Wrapper (utils/api.ts)

All hooks use `apiGet/apiPost/apiPut` instead of raw `fetch()`. These wrappers:
- Automatically throw `ApiError` with the server's error message on non-2xx responses
- Parse JSON responses consistently
- Return typed results

Hooks' catch blocks use the toast system:
```typescript
try {
  const result = await apiPost('/api/companies', body);
  addToast('success', 'Created', `Workspace "${result.name}" created`);
} catch (err) {
  addToast('error', 'Failed', err instanceof ApiError ? err.message : 'Network error');
}
```

#### Error Boundary

**`components/common/ErrorBoundary.tsx`** — React class component:
- Wraps the main content area (below header, around the LoginScreen/CompanySelector/WorkspaceDashboard switch)
- Catches render errors and shows a fallback UI with:
  - Error icon + "Something went wrong" heading
  - Error details (in dev mode)
  - "Reload Workspace" button that resets the error boundary state
- Does NOT catch errors in the header (so user can still logout/switch companies)

#### Loading Skeletons

**`components/common/Skeleton.tsx`** — Reusable component:
```typescript
interface SkeletonProps {
  width?: string;    // e.g. "100%", "200px", defaults to "100%"
  height?: string;   // e.g. "16px", defaults to "16px"
  rounded?: string;  // e.g. "4px", "8px", "full", defaults to "4px"
  className?: string;
}
```

Usage:
- `MediaTab`: Show 3 skeleton AssetCards while `loadingAssets` is true
- `ArticlesTab`: Show 2 skeleton article rows while `loadingArticles` is true  
- `WorkspaceDashboard`: Show skeleton campaign cards while campaigns loading

Skeleton uses Tailwind's `animate-pulse` with `bg-neutral-200`.

#### Error States in Components

Each data-fetching component handles three states:
1. **Loading** — Show skeleton
2. **Error** — Show error message with "Retry" button (calls fetch again)
3. **Empty** — Show guided empty state (Phase 3)
4. **Data** — Show content (current behavior)

---

## 4. Phase 3: UI/UX Polish

### 4.1 Empty States

Replace generic "No items found" messages with guided first-action prompts containing actionable buttons:

| Context | Empty State Content | Action Button |
|---------|-------------------|---------------|
| No companies | "No brand workspaces yet. Create your first subsidiary workspace to begin managing campaign assets." | "Create Workspace" — opens company creation form |
| No campaigns | "No campaigns yet. Launch your first campaign to organize media assets and articles." | "New Campaign" — opens campaign creation form in sidebar |
| Campaign selected, no postings | "This campaign has no posting folders. Create one to start adding assets and articles." | "+ Create New Posting" — **inline button that opens the posting creation form directly** (not just text) |
| Posting selected, no assets | "No assets uploaded. Drag and drop media files or click to browse." | "Upload Media" — triggers file input |
| Posting selected, no articles | "No articles written. Start composing your first write-up." | "Compose Article" — opens article creation form |
| Filtered results empty | "No assets match your current filters. Try adjusting the search or status filter." | "Clear Filters" — resets search and status filter |

Each empty state is a centered card with icon, heading, description, and prominent CTA button.

### 4.2 Responsive Improvements

**Sidebar behavior:**
- Desktop (≥768px): Collapsible sidebar (existing behavior, already works)
- Mobile (<768px): Sidebar becomes an overlay drawer
  - Hamburger menu button in header to toggle
  - Opens as a slide-in panel from the left (full height, 280px width)
  - Backdrop overlay behind it, tap to close
  - Selecting a posting auto-closes the drawer on mobile

**Header compact mode:**
- On mobile: reduce to logo + hamburger + user avatar
- Move "Home" and "Multi-Company Guide" buttons into a dropdown menu

**Asset cards:**
- Stack vertically on mobile (already partially done with flex-wrap)
- Images scale to full container width on small screens
- Edit form fields stack vertically instead of horizontally

**Campaign grid:**
- 1 column on mobile (<640px)
- 2 columns on tablet (640-1024px)
- 3 columns on desktop (≥1024px) — existing behavior

**Tab buttons:**
- Full-width stacked on mobile
- Side-by-side on desktop — existing behavior

**Image lightbox:**
- Touch-friendly: pinch-to-zoom via CSS `touch-action: manipulation`
- Swipe down to close on mobile
- Social media overlay frames scale proportionally

**Article editor:**
- Form fields stack vertically on mobile
- Full-width textarea
- Action buttons full-width on mobile

### 4.3 Accessibility

**Focus management:**
- Visible focus rings on all interactive elements (`focus-visible:ring-2 focus-visible:ring-neutral-900`)
- Tab order follows visual layout (no positive tabindex values)
- Escape key closes modals, lightbox, and dropdowns
- Enter/Space activates all buttons and interactive elements

**Screen reader support:**
- `aria-label` on all icon-only buttons (e.g., "Delete campaign", "Collapse sidebar", "Close modal")
- `role="dialog"` and `aria-modal="true"` on Modal component
- `alt` text on all images — use `captionText` or filename as fallback
- `aria-expanded` on collapsible sections (campaigns in sidebar, notifications, activity)
- `aria-current="page"` on active navigation items
- Status badges include `aria-label` with full status text

**Color & contrast:**
- All text meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
- Status colors have sufficient contrast against backgrounds
- Focus indicators are visible regardless of background

**Motion:**
- Respect `prefers-reduced-motion` — disable Motion animations when user prefers reduced motion
- Add `prefers-reduced-motion: reduce` media query to disable CSS transitions

### 4.4 Visual Polish

**Spacing:**
- Standardize spacing scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px
- Use Tailwind's spacing scale (p-1=4px, p-2=8px, p-3=12px, p-4=16px, p-6=24px, p-8=32px, p-12=48px)
- Consistent padding within cards (p-4 or p-5)

**Transitions:**
- All hover states use 150ms transition (Tailwind `duration-150`)
- Button hover: slight scale-up (`hover:scale-[1.02]`) on primary actions
- Card hover: shadow increase (`shadow-xs` → `shadow-sm`)
- Sidebar collapse/expand: `duration-300` (existing)

**Typography:**
- Monospace for labels, codes, metadata (existing pattern)
- Sans-serif for body text and descriptions
- Consistent heading hierarchy (h2 > h3 > h4)
- No text smaller than 9px (existing 8px and 7px instances bumped to 9px minimum)

**Shadows:**
- `shadow-xs` (default card state) → `shadow-sm` (hover)
- Modal: `shadow-2xl`
- Toast: `shadow-lg`

### 4.5 Performance

**Image loading:**
- Add `loading="lazy"` and `decoding="async"` to all asset thumbnail images
- Use `sizes` attribute for responsive image loading

**Component optimization:**
- `React.memo` on `AssetCard` — skips re-render when editing a different asset
- `React.memo` on campaign list items in sidebar
- Use `useMemo` for computed values (filteredAssets already uses .filter().sort() — keep this, it's fine for modest data sizes)

**Input debouncing:**
- Search inputs: 300ms debounce before filtering (prevents re-render on every keystroke)
- Status filter and sort order: immediate (no debounce needed — discrete actions)

**Virtualization (future consideration):**
- If campaigns exceed 50, consider virtualizing the sidebar campaign list
- Not in scope for this phase — the current data sizes don't warrant it

---

## 5. What Does NOT Change

- **Backend API** — No breaking API changes. ProjectType is an optional field that the server already supports on the posting creation endpoint (needs minor addition).
- **Database schema** — ProjectType is an optional field, backward compatible with existing data.
- **Authentication** — Login flow, access codes, proxy mode, localStorage persistence all unchanged.
- **File upload** — S3 simulated flow unchanged.
- **Component file structure** — Components stay in `src/components/`, no reorganization of existing files.
- **Tailwind configuration** — No changes to tailwind.config or @tailwindcss/vite plugin.

---

## 6. Verification

After each phase, verify by:
1. `npm run lint` — TypeScript type check passes
2. `npm run dev` — App starts on localhost:3000
3. Manual smoke test:
   - Login with existing access code
   - Select company
   - Navigate campaigns and postings
   - Upload an asset
   - Create an article
   - Edit asset status and captions
   - Verify toast notifications appear on success/error
   - Test responsive layout (resize browser, test hamburger on mobile widths)
   - Test keyboard navigation (Tab, Enter, Escape)
   - Verify empty states show with correct buttons that work

---

## 7. Implementation Order

1. **Phase 1:** Create `utils/api.ts` → create each hook → rewrite AppContext → verify
2. **Phase 2A:** Add projectType to PostingFolder type → update server → add toggle in FolderSidebar → update useWorkspace
3. **Phase 2B:** Create useToast + ToastContainer + ErrorBoundary + Skeleton → integrate into all hooks and components
4. **Phase 3:** Empty states → responsive fixes → accessibility → visual polish → performance tweaks
