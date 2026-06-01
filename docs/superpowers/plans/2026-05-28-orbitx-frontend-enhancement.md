# OrbitX Frontend Enhancement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Incrementally enhance the OrbitX frontend by splitting the AppContext monolith into focused hooks, adding ProjectType labeling to posting folders, building a cross-cutting error handling layer (toasts, error boundaries, skeletons), and polishing UI/UX.

**Architecture:** Extract 6 domain hooks from the 999-line AppContext.tsx with unidirectional dependency flow (useAuth → useWorkspace → useMedia/useArticles). Add shared utils/api.ts for typed fetch wrappers. Build toast notifications, error boundaries, and loading skeletons as cross-cutting concerns. Polish empty states, responsiveness, and accessibility.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vite 6, Motion (Framer Motion) v12, Express.js

**Spec:** `docs/superpowers/specs/2026-05-28-orbitx-frontend-enhancement-design.md`

---

## File Structure After Completion

```
src/
├── main.tsx                          # Unchanged
├── App.tsx                           # Thin wrapper, error boundary added
├── AppContext.tsx                    # Thin provider (~80 lines, composes hooks)
├── types.ts                          # PostingFolder.projectType added
├── index.css                         # Unchanged (prefers-reduced-motion added in Phase 3)
├── socialMediaSizes.ts               # Unchanged
├── constants/
│   └── brandIcons.ts                 # Unchanged
├── utils/
│   └── api.ts                        # NEW: apiGet, apiPost, apiPut, apiDelete, ApiError, parseJSON
├── hooks/
│   ├── useAuth.ts                    # NEW: Auth state + handlers
│   ├── useWorkspace.ts               # NEW: Companies, campaigns, postings
│   ├── useMedia.ts                   # NEW: Assets, uploads, search/filter
│   ├── useArticles.ts                # NEW: Articles CRUD
│   ├── useOnboarding.ts              # NEW: User directory management
│   ├── useActivity.ts                # NEW: Activity feed
│   └── useToast.ts                   # NEW: Toast notification state
└── components/
    ├── LoginScreen.tsx               # Unchanged
    ├── CompanySelector.tsx           # Empty state added
    ├── WorkspaceDashboard.tsx        # Empty states, skeleton loading
    ├── FolderSidebar.tsx             # ProjectType toggle in posting form, mobile drawer
    ├── MediaTab.tsx                  # Skeleton loading, empty state with CTA
    ├── ArticlesTab.tsx               # Skeleton loading, empty state with CTA
    ├── FullArticleTab.tsx            # Unchanged
    ├── AssetCard.tsx                 # React.memo, lazy loading, aria-labels
    ├── OnboardingModal.tsx           # Unchanged
    └── common/
        ├── Modal.tsx                 # aria-modal, Escape key handler
        ├── StatusBadge.tsx           # aria-label added
        ├── ImageLightbox.tsx         # Touch improvements, swipe-to-close
        ├── ToastContainer.tsx        # NEW: Fixed toast stack
        ├── ErrorBoundary.tsx         # NEW: React error boundary
        └── Skeleton.tsx              # NEW: Reusable skeleton component
```

---

## Phase 1: Split AppContext Monolith

### Task 1: Create utils/api.ts

**Files:**
- Create: `src/utils/api.ts`

- [ ] **Step 1: Verify hook directory exists**

Run: `ls src/hooks/`
Expected: Directory exists (may be empty)

Run: `mkdir -p src/utils`

- [ ] **Step 2: Create api.ts with shared fetch wrappers**

Write to `src/utils/api.ts`:

```typescript
export async function parseJSON(res: Response): Promise<any> {
  const ct = res.headers.get('content-type');
  if (!ct?.includes('application/json')) {
    const preview = await res.text().catch(() => '');
    console.error(`Expected JSON from ${res.url} but got ${ct || 'no content-type'} (${res.status}); preview: ${preview.slice(0, 200)}`);
    throw new Error('Server returned non-JSON response');
  }
  return res.json();
}

export class ApiError extends Error {
  constructor(public status: number, body: any) {
    super(body?.error || `Request failed (${status})`);
    this.name = 'ApiError';
  }
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
  return parseJSON(res);
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
  return parseJSON(res);
}

export async function apiPut<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
  return parseJSON(res);
}

export async function apiDelete<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'DELETE',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
  return parseJSON(res);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/api.ts
git commit -m "feat: add shared API utility with typed fetch wrappers"
```

---

### Task 2: Create hooks/useActivity.ts

**Files:**
- Create: `src/hooks/useActivity.ts`

- [ ] **Step 1: Create useActivity hook**

Write to `src/hooks/useActivity.ts`:

```typescript
import { useState } from 'react';
import { User } from '../types';

export interface ActivityEntry {
  id: string;
  timestamp: string;
  username: string;
  userId: string;
  action: string;
  detail: string;
}

export interface UseActivityReturn {
  activities: ActivityEntry[];
  pushActivity: (action: string, detail: string) => void;
}

export function useActivity({ currentUser }: { currentUser: User | null }): UseActivityReturn {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);

  const pushActivity = (action: string, detail: string) => {
    if (!currentUser) return;
    const entry: ActivityEntry = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      username: currentUser.username,
      userId: currentUser.id,
      action,
      detail,
    };
    setActivities(prev => [entry, ...prev].slice(0, 20));
  };

  return { activities, pushActivity };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useActivity.ts
git commit -m "feat: extract useActivity hook from AppContext"
```

---

### Task 3: Create hooks/useAuth.ts

**Files:**
- Create: `src/hooks/useAuth.ts`

- [ ] **Step 1: Create useAuth hook**

Write to `src/hooks/useAuth.ts`:

```typescript
import { useState, useEffect } from 'react';
import { User } from '../types';
import { apiPost, parseJSON } from '../utils/api';

export interface UseAuthReturn {
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  accessCodeInput: string;
  setAccessCodeInput: (v: string) => void;
  loginError: string;
  setLoginError: (v: string) => void;
  proxyOriginalUser: User | null;
  setProxyOriginalUser: (u: User | null) => void;
  rememberedUsers: User[];
  removeRememberedUser: (userId: string) => void;
  handleCodeLogin: (code: string) => void;
  handleLogout: () => void;
  handleProxyLogin: (targetUser: User) => void;
  handleExitProxy: () => void;
}

export function useAuth(): UseAuthReturn {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [proxyOriginalUser, setProxyOriginalUser] = useState<User | null>(null);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [rememberedUsers, setRememberedUsers] = useState<User[]>(() => {
    try { return JSON.parse(localStorage.getItem('orbitx_remembered_users') || '[]'); }
    catch { return []; }
  });

  const rememberUserInLocalStorage = (user: User) => {
    try {
      const existing = JSON.parse(localStorage.getItem('orbitx_remembered_users') || '[]') as User[];
      const filtered = existing.filter(u => u.id !== user.id);
      filtered.unshift(user);
      localStorage.setItem('orbitx_remembered_users', JSON.stringify(filtered));
      setRememberedUsers(filtered);
    } catch (e) { /* ignore */ }
  };

  const removeRememberedUser = (userId: string) => {
    try {
      const current = JSON.parse(localStorage.getItem('orbitx_remembered_users') || '[]') as User[];
      const updated = current.filter(u => u.id !== userId);
      setRememberedUsers(updated);
      localStorage.setItem('orbitx_remembered_users', JSON.stringify(updated));
    } catch (e) { /* ignore */ }
  };

  const handleCodeLogin = async (codeStr: string) => {
    setLoginError('');
    if (!codeStr.trim()) { setLoginError('Please enter a valid unique access code.'); return; }
    try {
      const res = await fetch('/api/login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeStr })
      });
      if (res.ok) {
        const data = await parseJSON(res);
        setCurrentUser(data.user);
        localStorage.setItem('hub_user', JSON.stringify(data.user));
        rememberUserInLocalStorage(data.user);
        setAccessCodeInput('');
      } else {
        const err = await parseJSON(res);
        setLoginError(err.error || 'Invalid code');
      }
    } catch (err: any) { console.error('Login failed:', err); setLoginError(err.message || 'Connection failure.'); }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setProxyOriginalUser(null);
    localStorage.removeItem('hub_user');
    localStorage.removeItem('hub_company');
    localStorage.removeItem('hub_campaign');
    localStorage.removeItem('hub_posting');
  };

  const handleProxyLogin = (targetUser: User) => {
    if (!currentUser) return;
    setProxyOriginalUser(currentUser);
    setCurrentUser(targetUser);
  };

  const handleExitProxy = () => {
    if (!proxyOriginalUser) return;
    setCurrentUser(proxyOriginalUser);
    setProxyOriginalUser(null);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('hub_user');
    if (storedUser) {
      try { setCurrentUser(JSON.parse(storedUser)); }
      catch (e) { localStorage.clear(); }
    }
  }, []);

  return {
    currentUser, setCurrentUser,
    accessCodeInput, setAccessCodeInput,
    loginError, setLoginError,
    proxyOriginalUser, setProxyOriginalUser,
    rememberedUsers, removeRememberedUser,
    handleCodeLogin, handleLogout,
    handleProxyLogin, handleExitProxy,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useAuth.ts
git commit -m "feat: extract useAuth hook from AppContext"
```

---

### Task 4: Create hooks/useOnboarding.ts

**Files:**
- Create: `src/hooks/useOnboarding.ts`

- [ ] **Step 1: Create useOnboarding hook**

Write to `src/hooks/useOnboarding.ts`:

```typescript
import { useState, useEffect } from 'react';
import { Role, User } from '../types';
import { apiGet, apiPost, apiPut, apiDelete, parseJSON } from '../utils/api';

export interface UseOnboardingReturn {
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (v: boolean) => void;
  directoryUsers: User[];
  setDirectoryUsers: (u: User[]) => void;
  onboardSearchQuery: string;
  setOnboardSearchQuery: (v: string) => void;
  onboardName: string;
  setOnboardName: (v: string) => void;
  onboardRole: Role;
  setOnboardRole: (v: Role) => void;
  onboardAccessCode: string;
  setOnboardAccessCode: (v: string) => void;
  onboardError: string;
  setOnboardError: (v: string) => void;
  onboardSuccess: string;
  setOnboardSuccess: (v: string) => void;
  onboardPassword: string;
  setOnboardPassword: (v: string) => void;
  editingUserId: string | null;
  setEditingUserId: (id: string | null) => void;
  editingUserName: string;
  setEditingUserName: (v: string) => void;
  editingUserRole: Role;
  setEditingUserRole: (v: Role) => void;
  editingUserCode: string;
  setEditingUserCode: (v: string) => void;
  editingUserError: string;
  setEditingUserError: (v: string) => void;
  handleOnboardMember: (e: React.FormEvent) => void;
  handleSaveMemberEdit: (userId: string) => void;
  handleDeleteMember: (userId: string, password: string) => Promise<{ error?: string }>;
  triggerAutoCodeGeneration: () => void;
  triggerEditAutoCodeGeneration: () => void;
  fetchDirectoryInfo: () => void;
}

const autoGenerateCode = (roleName: string) => {
  const roleRef = roleName === Role.Designer ? 'DESIGN' : roleName === Role.ContentWriter ? 'WRITER' : 'LEAD';
  return `BDW-${roleRef}-${Math.floor(100 + Math.random() * 900)}`;
};

export function useOnboarding({ currentUser }: { currentUser: User | null }): UseOnboardingReturn {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [directoryUsers, setDirectoryUsers] = useState<User[]>([]);
  const [onboardSearchQuery, setOnboardSearchQuery] = useState('');
  const [onboardName, setOnboardName] = useState('');
  const [onboardRole, setOnboardRole] = useState<Role>(Role.Designer);
  const [onboardAccessCode, setOnboardAccessCode] = useState('');
  const [onboardError, setOnboardError] = useState('');
  const [onboardSuccess, setOnboardSuccess] = useState('');
  const [onboardPassword, setOnboardPassword] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState('');
  const [editingUserRole, setEditingUserRole] = useState<Role>(Role.Designer);
  const [editingUserCode, setEditingUserCode] = useState('');
  const [editingUserError, setEditingUserError] = useState('');

  const fetchDirectoryInfo = () => {
    apiGet<User[]>('/api/users').then(setDirectoryUsers).catch(console.error);
  };

  useEffect(() => {
    if (currentUser) fetchDirectoryInfo();
  }, [currentUser]);

  useEffect(() => {
    if (isOnboardingOpen) fetchDirectoryInfo();
  }, [isOnboardingOpen]);

  const triggerAutoCodeGeneration = () => { setOnboardAccessCode(autoGenerateCode(onboardRole)); };
  const triggerEditAutoCodeGeneration = () => { setEditingUserCode(autoGenerateCode(editingUserRole)); };

  const handleOnboardMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardError(''); setOnboardSuccess('');
    if (!onboardName.trim()) { setOnboardError('Name/Username is required.'); return; }
    if (!onboardAccessCode.trim()) { setOnboardError('Access code is required. Try auto-generating one.'); return; }
    if (!onboardPassword.trim()) { setOnboardError('Onboarding security password is required.'); return; }
    try {
      await apiPost('/api/users', { username: onboardName, role: onboardRole, accessCode: onboardAccessCode, password: onboardPassword });
      setOnboardSuccess(`Successfully onboarded ${onboardName}!`);
      setOnboardName(''); setOnboardAccessCode(''); setOnboardPassword('');
      fetchDirectoryInfo();
    } catch (err: any) { console.error('Onboarding failed:', err); setOnboardError(err.message || 'Network transmission error.'); }
  };

  const handleSaveMemberEdit = async (userId: string) => {
    setEditingUserError('');
    if (!editingUserName.trim()) { setEditingUserError('Name is required.'); return; }
    if (!editingUserCode.trim()) { setEditingUserError('Access code is required.'); return; }
    try {
      const updatedUser = await apiPut<User>(`/api/users/${userId}`, { username: editingUserName, role: editingUserRole, accessCode: editingUserCode });
      setEditingUserId(null);
      fetchDirectoryInfo();
      if (currentUser && currentUser.id === userId) {
        localStorage.setItem('hub_user', JSON.stringify(updatedUser));
      }
    } catch (err: any) { console.error('Failed to save member:', err); setEditingUserError(err.message || 'Network transmission error.'); }
  };

  const handleDeleteMember = async (userId: string, password: string): Promise<{ error?: string }> => {
    try {
      await apiDelete(`/api/users/${userId}`, { password });
      setDirectoryUsers(prev => prev.filter(u => u.id !== userId));
      return {};
    } catch (err: any) {
      return { error: err.message || 'Network error.' };
    }
  };

  return {
    isOnboardingOpen, setIsOnboardingOpen,
    directoryUsers, setDirectoryUsers,
    onboardSearchQuery, setOnboardSearchQuery,
    onboardName, setOnboardName,
    onboardRole, setOnboardRole,
    onboardAccessCode, setOnboardAccessCode,
    onboardError, setOnboardError,
    onboardSuccess, setOnboardSuccess,
    onboardPassword, setOnboardPassword,
    editingUserId, setEditingUserId,
    editingUserName, setEditingUserName,
    editingUserRole, setEditingUserRole,
    editingUserCode, setEditingUserCode,
    editingUserError, setEditingUserError,
    handleOnboardMember, handleSaveMemberEdit, handleDeleteMember,
    triggerAutoCodeGeneration, triggerEditAutoCodeGeneration,
    fetchDirectoryInfo,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useOnboarding.ts
git commit -m "feat: extract useOnboarding hook from AppContext"
```

---

### Task 5: Create hooks/useWorkspace.ts

**Files:**
- Create: `src/hooks/useWorkspace.ts`

- [ ] **Step 1: Create useWorkspace hook**

Write to `src/hooks/useWorkspace.ts`:

```typescript
import React, { useState, useEffect } from 'react';
import { Role, AssetStatus, Company, Campaign, PostingFolder, User } from '../types';
import { apiGet, apiPost, apiPut, apiDelete, parseJSON } from '../utils/api';

export interface UseWorkspaceParams {
  currentUser: User | null;
}

export interface UseWorkspaceReturn {
  currentCompany: Company | null;
  setCurrentCompany: (c: Company | null) => void;
  availableCompanies: Company[];
  setAvailableCompanies: (c: Company[]) => void;
  campaigns: Campaign[];
  setCampaigns: (f: Campaign[]) => void;
  selectedCampaignId: string;
  setSelectedCampaignId: (id: string) => void;
  allCompanyCampaigns: Campaign[];
  setAllCompanyCampaigns: (f: Campaign[]) => void;
  postingFolders: PostingFolder[];
  setPostingFolders: (f: PostingFolder[]) => void;
  selectedPostingId: string;
  setSelectedPostingId: (id: string) => void;
  isCreatingCompany: boolean;
  setIsCreatingCompany: (v: boolean) => void;
  newCompanyName: string;
  setNewCompanyName: (v: string) => void;
  newCompanyLogoText: string;
  setNewCompanyLogoText: (v: string) => void;
  newCompanyLogoType: 'upload' | 'icon' | 'none';
  setNewCompanyLogoType: (v: 'upload' | 'icon' | 'none') => void;
  newCompanyLogoData: string;
  setNewCompanyLogoData: (v: string) => void;
  newCompanyAccentColor: 'emerald' | 'indigo' | 'amber';
  setNewCompanyAccentColor: (v: 'emerald' | 'indigo' | 'amber') => void;
  newCompanyDescription: string;
  setNewCompanyDescription: (v: string) => void;
  newCompanyLogoUrl: string;
  setNewCompanyLogoUrl: (v: string) => void;
  companyErrorMsg: string;
  setCompanyErrorMsg: (v: string) => void;
  isCreatingCampaign: boolean;
  setIsCreatingCampaign: (v: boolean) => void;
  newCampaignName: string;
  setNewCampaignName: (v: string) => void;
  newCampaignDescription: string;
  setNewCampaignDescription: (v: string) => void;
  newCampaignProjectType: 'both' | 'media' | 'articles';
  setNewCampaignProjectType: (v: 'both' | 'media' | 'articles') => void;
  isCreatingPosting: boolean;
  setIsCreatingPosting: (v: boolean) => void;
  newPostingName: string;
  setNewPostingName: (v: string) => void;
  newPostingDescription: string;
  setNewPostingDescription: (v: string) => void;
  newPostingProjectType: 'both' | 'media' | 'articles';
  setNewPostingProjectType: (v: 'both' | 'media' | 'articles') => void;
  folderError: string;
  setFolderError: (v: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  campaignPostingCounts: { [campaignId: string]: number };
  setCampaignPostingCounts: (v: { [campaignId: string]: number }) => void;
  selectedCampaign: Campaign | undefined;
  selectedPosting: PostingFolder | undefined;
  fetchCompanies: () => void;
  fetchDirectoryInfo: () => void;
  handleCreateCompany: (e: React.FormEvent) => void;
  handleLogoUpload: (companyId: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  handleCreateCampaign: (e: React.FormEvent) => void;
  handleDeleteCampaign: (id: string) => void;
  handleCreatePosting: (e: React.FormEvent) => void;
  handleDeletePosting: (id: string) => void;
  getBrandBannerClass: () => string;
  getBrandBadgeClass: () => string;
}

export function useWorkspace({ currentUser }: UseWorkspaceParams): UseWorkspaceReturn {
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [allCompanyCampaigns, setAllCompanyCampaigns] = useState<Campaign[]>([]);
  const [postingFolders, setPostingFolders] = useState<PostingFolder[]>([]);
  const [selectedPostingId, setSelectedPostingId] = useState<string>('');
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyLogoText, setNewCompanyLogoText] = useState('');
  const [newCompanyLogoType, setNewCompanyLogoType] = useState<'upload' | 'icon' | 'none'>('none');
  const [newCompanyLogoData, setNewCompanyLogoData] = useState('');
  const [newCompanyAccentColor, setNewCompanyAccentColor] = useState<'emerald' | 'indigo' | 'amber'>('indigo');
  const [newCompanyDescription, setNewCompanyDescription] = useState('');
  const [newCompanyLogoUrl, setNewCompanyLogoUrl] = useState('');
  const [companyErrorMsg, setCompanyErrorMsg] = useState('');
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDescription, setNewCampaignDescription] = useState('');
  const [newCampaignProjectType, setNewCampaignProjectType] = useState<'both' | 'media' | 'articles'>('both');
  const [isCreatingPosting, setIsCreatingPosting] = useState(false);
  const [newPostingName, setNewPostingName] = useState('');
  const [newPostingDescription, setNewPostingDescription] = useState('');
  const [newPostingProjectType, setNewPostingProjectType] = useState<'both' | 'media' | 'articles'>('both');
  const [folderError, setFolderError] = useState('');
  const [campaignPostingCounts, setCampaignPostingCounts] = useState<{ [campaignId: string]: number }>({});

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('orbitx_sidebar_collapsed') === 'true'; }
    catch { return false; }
  });

  const [directoryUsers, setDirectoryUsers] = useState<User[]>([]);

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
  const selectedPosting = postingFolders.find(p => p.id === selectedPostingId);

  const fetchCompanies = async () => {
    try {
      const data = await apiGet<Company[]>('/api/companies');
      setAvailableCompanies(data);
    } catch (err) { console.error('Failed to load companies', err); }
  };

  const fetchDirectoryInfo = async () => {
    try {
      if (currentUser) {
        const data = await apiGet<Company[]>('/api/companies');
        setAvailableCompanies(data);
      }
      const usersData = await apiGet<User[]>('/api/users');
      setDirectoryUsers(usersData);
    } catch (err) { console.error('Failed to load companies/users directories', err); }
  };

  const fetchCampaigns = async (companyId: string) => {
    try {
      const [data, countsData] = await Promise.all([
        apiGet<Campaign[]>(`/api/companies/${companyId}/campaigns`),
        apiGet<{ campaignId: string; postingCount: number }[]>(`/api/companies/${companyId}/campaign-counts`),
      ]);
      setCampaigns(data);
      setAllCompanyCampaigns(data);
      const countsMap: { [id: string]: number } = {};
      countsData.forEach(c => { countsMap[c.campaignId] = c.postingCount; });
      setCampaignPostingCounts(countsMap);
    } catch (err) { console.error(err); }
  };

  const fetchPostings = async (campaignId: string) => {
    try {
      const data = await apiGet<PostingFolder[]>(`/api/campaigns/${campaignId}/postings`);
      setPostingFolders(data);
    } catch (err) { console.error(err); }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) {
      setCompanyErrorMsg("Company name is required.");
      return;
    }
    try {
      setCompanyErrorMsg("");
      const data = await apiPost<Company>("/api/companies", {
        name: newCompanyName, description: newCompanyDescription, logoUrl: newCompanyLogoUrl,
        logoType: newCompanyLogoType, logoData: newCompanyLogoData
      });
      setAvailableCompanies(prev => [...prev, data]);
      setIsCreatingCompany(false);
      setNewCompanyName(""); setNewCompanyLogoText(""); setNewCompanyDescription("");
      setNewCompanyLogoUrl(""); setNewCompanyLogoType('none'); setNewCompanyLogoData('');
    } catch (err: any) { console.error('Failed to create company:', err); setCompanyErrorMsg(err.message || "Network error trying to create brand workspace."); }
  };

  const handleLogoUpload = async (companyId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const presignedRes = await fetch(`/api/upload/presigned-url?filename=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(file.type)}`);
      if (!presignedRes.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, publicUrl } = await parseJSON(presignedRes);
      const s3PutRes = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!s3PutRes.ok) throw new Error('Upload failed');
      const updated = await apiPut<Company>(`/api/companies/${companyId}`, { logoUrl: publicUrl });
      setAvailableCompanies(prev => prev.map(c => c.id === companyId ? updated : c));
      if (currentCompany && currentCompany.id === companyId) { setCurrentCompany(updated); }
    } catch (err) { console.error('Failed to update company logo:', err); }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFolderError('');
    if (!currentUser || !currentCompany) return;
    if (currentUser.role !== Role.TeamLead) {
      alert('Access Denied: Only Team Leads can manage campaigns.');
      return;
    }
    if (!newCampaignName.trim()) { setFolderError('Campaign name is required.'); return; }
    try {
      const created = await apiPost<Campaign>(`/api/companies/${currentCompany.id}/campaigns`, {
        name: newCampaignName, description: newCampaignDescription, projectType: newCampaignProjectType
      });
      setNewCampaignName(''); setNewCampaignDescription('');
      setIsCreatingCampaign(false);
      setCampaigns(prev => [...prev, created]);
      setAllCompanyCampaigns(prev => [...prev, created]);
      setSelectedCampaignId(created.id);
      fetchPostings(created.id);
    } catch (err: any) { console.error('Failed to create campaign:', err); setFolderError(err.message || 'Network error. Please try again.'); }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!currentUser || currentUser.role !== Role.TeamLead) {
      alert('Access Denied: Only Team Leads are authorized to delete campaigns.');
      return;
    }
    const campaign = campaigns.find(f => f.id === campaignId);
    if (!campaign) return;
    if (confirm(`Purge campaign "${campaign.name}"? This permanently deletes all postings and assets within.`)) {
      try {
        await apiDelete(`/api/campaigns/${campaignId}`);
        if (selectedCampaignId === campaignId) { setSelectedCampaignId(''); setSelectedPostingId(''); }
        setCampaigns(prev => prev.filter(c => c.id !== campaignId));
        setAllCompanyCampaigns(prev => prev.filter(c => c.id !== campaignId));
        setCampaignPostingCounts(prev => { const next = { ...prev }; delete next[campaignId]; return next; });
      } catch (err) { console.error(err); }
    }
  };

  const handleCreatePosting = async (e: React.FormEvent) => {
    e.preventDefault();
    setFolderError('');
    if (!currentUser || !currentCompany) return;
    if (currentUser.role !== Role.TeamLead) {
      alert('Access Denied: Only Team Leads can manage posting folders.');
      return;
    }
    if (!selectedCampaignId) { setFolderError('Select a campaign first.'); return; }
    if (!newPostingName.trim()) { setFolderError('Posting folder name is required.'); return; }
    try {
      const body: any = { name: newPostingName, description: newPostingDescription };
      if (newPostingProjectType) body.projectType = newPostingProjectType;
      const created = await apiPost<PostingFolder>(`/api/campaigns/${selectedCampaignId}/postings`, body);
      setNewPostingName(''); setNewPostingDescription(''); setNewPostingProjectType('both');
      setIsCreatingPosting(false);
      setPostingFolders(prev => [...prev, created]);
      setSelectedPostingId(created.id);
      setCampaignPostingCounts(prev => ({ ...prev, [selectedCampaignId]: (prev[selectedCampaignId] || 0) + 1 }));
    } catch (err: any) { console.error('Failed to create posting:', err); setFolderError(err.message || 'Network error. Please try again.'); }
  };

  const handleDeletePosting = async (postingId: string) => {
    if (!currentUser || currentUser.role !== Role.TeamLead) {
      alert('Access Denied: Only Team Leads are authorized to delete posting folders.');
      return;
    }
    const posting = postingFolders.find(p => p.id === postingId);
    if (!posting) return;
    if (confirm(`Purge posting folder "${posting.name}"? This permanently deletes all assets and articles within.`)) {
      try {
        await apiDelete(`/api/postings/${postingId}`);
        if (selectedPostingId === postingId) setSelectedPostingId('');
        setPostingFolders(prev => prev.filter(p => p.id !== postingId));
        if (posting.campaignId) {
          setCampaignPostingCounts(prev => ({ ...prev, [posting.campaignId]: Math.max(0, (prev[posting.campaignId] || 0) - 1) }));
        }
      } catch (err) { console.error(err); }
    }
  };

  const getBrandBannerClass = () => 'bg-neutral-900 border-neutral-800 text-neutral-100';
  const getBrandBadgeClass = () => 'bg-neutral-100 text-neutral-800 border-neutral-200';

  useEffect(() => { fetchCompanies(); }, []);

  useEffect(() => {
    fetchCompanies();
    const storedCompany = localStorage.getItem('hub_company');
    if (storedCompany) {
      try { setCurrentCompany(JSON.parse(storedCompany)); }
      catch (e) { localStorage.clear(); }
    }
    const storedCampaign = localStorage.getItem('hub_campaign');
    if (storedCampaign) {
      try { setSelectedCampaignId(JSON.parse(storedCampaign)); } catch {}
    }
    const storedPosting = localStorage.getItem('hub_posting');
    if (storedPosting) {
      try { setSelectedPostingId(JSON.parse(storedPosting)); } catch {}
    }
    const storedSidebar = localStorage.getItem('orbitx_sidebar_collapsed');
    if (storedSidebar !== null) {
      setSidebarCollapsed(storedSidebar === 'true');
    }
  }, []);

  useEffect(() => {
    if (currentCompany) {
      fetchCampaigns(currentCompany.id);
      localStorage.setItem('hub_company', JSON.stringify(currentCompany));
    } else {
      setCampaigns([]); setAllCompanyCampaigns([]); setPostingFolders([]); setCampaignPostingCounts({});
      localStorage.removeItem('hub_company');
    }
  }, [currentCompany]);

  useEffect(() => {
    if (selectedCampaignId) {
      fetchPostings(selectedCampaignId);
      localStorage.setItem('hub_campaign', JSON.stringify(selectedCampaignId));
    } else {
      setPostingFolders([]);
      localStorage.removeItem('hub_campaign');
    }
  }, [selectedCampaignId]);

  useEffect(() => {
    localStorage.setItem('orbitx_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return {
    currentCompany, setCurrentCompany,
    availableCompanies, setAvailableCompanies,
    campaigns, setCampaigns,
    selectedCampaignId, setSelectedCampaignId,
    allCompanyCampaigns, setAllCompanyCampaigns,
    postingFolders, setPostingFolders,
    selectedPostingId, setSelectedPostingId,
    isCreatingCompany, setIsCreatingCompany,
    newCompanyName, setNewCompanyName,
    newCompanyLogoText, setNewCompanyLogoText,
    newCompanyLogoType, setNewCompanyLogoType,
    newCompanyLogoData, setNewCompanyLogoData,
    newCompanyAccentColor, setNewCompanyAccentColor,
    newCompanyDescription, setNewCompanyDescription,
    newCompanyLogoUrl, setNewCompanyLogoUrl,
    companyErrorMsg, setCompanyErrorMsg,
    isCreatingCampaign, setIsCreatingCampaign,
    newCampaignName, setNewCampaignName,
    newCampaignDescription, setNewCampaignDescription,
    newCampaignProjectType, setNewCampaignProjectType,
    isCreatingPosting, setIsCreatingPosting,
    newPostingName, setNewPostingName,
    newPostingDescription, setNewPostingDescription,
    newPostingProjectType, setNewPostingProjectType,
    folderError, setFolderError,
    sidebarCollapsed, setSidebarCollapsed,
    campaignPostingCounts, setCampaignPostingCounts,
    selectedCampaign, selectedPosting,
    fetchCompanies, fetchDirectoryInfo,
    handleCreateCompany, handleLogoUpload,
    handleCreateCampaign, handleDeleteCampaign,
    handleCreatePosting, handleDeletePosting,
    getBrandBannerClass, getBrandBadgeClass,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useWorkspace.ts
git commit -m "feat: extract useWorkspace hook from AppContext"
```

---

### Task 6: Create hooks/useMedia.ts

**Files:**
- Create: `src/hooks/useMedia.ts`

- [ ] **Step 1: Create useMedia hook**

Write to `src/hooks/useMedia.ts`:

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { Role, AssetStatus, Asset, User } from '../types';
import { apiGet, apiPost, apiPut, apiDelete, parseJSON } from '../utils/api';

export interface UseMediaParams {
  currentUser: User | null;
  selectedPostingId: string;
}

export interface UseMediaReturn {
  assets: Asset[];
  loadingAssets: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (v: 'asc' | 'desc') => void;
  isDragOver: boolean;
  setIsDragOver: (v: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string;
  uploadingFileName: string;
  editingAssetId: string | null;
  setEditingAssetId: (id: string | null) => void;
  editCaption: string;
  setEditCaption: (v: string) => void;
  editArtworkComment: string;
  setEditArtworkComment: (v: string) => void;
  editRevisedCaption: string;
  setEditRevisedCaption: (v: string) => void;
  editSchedule: string;
  setEditSchedule: (v: string) => void;
  editStatus: AssetStatus;
  setEditStatus: (v: AssetStatus) => void;
  copiedAssetId: string | null;
  filteredAssets: Asset[];
  draftCount: number;
  refineCount: number;
  readyCount: number;
  formatMimeTypeDescription: (mime: string) => string;
  handleS3FileUpload: (file: File) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleQuickStatusUpdate: (assetId: string, statusKey: AssetStatus) => void;
  triggerEditing: (asset: Asset) => void;
  saveEdits: (assetId: string) => void;
  deleteAsset: (assetId: string) => void;
  copyCaptionToClipboard: (text: string, assetId: string) => void;
  fetchAssets: (postingId: string) => void;
}

export function useMedia({ currentUser, selectedPostingId }: UseMediaParams): UseMediaReturn {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editArtworkComment, setEditArtworkComment] = useState('');
  const [editRevisedCaption, setEditRevisedCaption] = useState('');
  const [editSchedule, setEditSchedule] = useState('');
  const [editStatus, setEditStatus] = useState<AssetStatus>(AssetStatus.Drafting);
  const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);

  const fetchAssets = async (postingId: string) => {
    setLoadingAssets(true);
    try {
      const data = await apiGet<Asset[]>(`/api/postings/${postingId}/assets`);
      setAssets(data);
    } catch (err) { console.error(err); }
    finally { setLoadingAssets(false); }
  };

  useEffect(() => {
    if (selectedPostingId) {
      fetchAssets(selectedPostingId);
    } else {
      setAssets([]);
    }
  }, [selectedPostingId]);

  const handleS3FileUpload = async (file: File) => {
    if (!selectedPostingId) { setUploadError('Select a posting folder as target.'); return; }
    if (!currentUser) return;
    if (currentUser.role === Role.ContentWriter) {
      alert('Content Writers are not authorized to upload digital media files directly. Only Designers and Team Leads possess storage channel clearance.');
      return;
    }
    setIsUploading(true); setUploadError(''); setUploadingFileName(file.name); setUploadProgress(15);
    try {
      const presignedRes = await fetch(`/api/upload/presigned-url?filename=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(file.type)}`);
      if (!presignedRes.ok) throw new Error('Could not acquire direct S3 write credentials.');
      const { uploadUrl, publicUrl, fileType } = await parseJSON(presignedRes);
      setUploadProgress(45);
      const s3PutRes = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': fileType }, body: file });
      if (!s3PutRes.ok) throw new Error('Simulated AWS S3 binary cache storage rejected block.');
      setUploadProgress(80);
      const dateToday = new Date().toLocaleDateString('en-CA');
      const standardCaption = `[Project Frame: ${file.name}]\n\nIntegrate curated caption details, call-to-action triggers, and scheduled hashtags here.\n\n#BrandCampaign #MediaAssetHub`;
      const newAsset = await apiPost<Asset>('/api/assets', {
        postingFolderId: selectedPostingId, s3FileUrl: publicUrl, fileType: fileType,
        captionText: standardCaption, scheduledDate: dateToday, status: AssetStatus.Drafting, uploadedBy: currentUser.id
      });
      setUploadProgress(100);
      setTimeout(() => { setIsUploading(false); setUploadingFileName(''); setAssets(prev => [newAsset, ...prev]); }, 500);
    } catch (err: any) { setUploadError(err.message || 'Direct S3 Write failed.'); setIsUploading(false); }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) { handleS3FileUpload(e.dataTransfer.files[0]); }
  };

  const handleQuickStatusUpdate = async (assetId: string, statusKey: AssetStatus) => {
    if (!currentUser || currentUser.role === Role.Designer) { alert('Designers are restricted from modifying marketing copy status trackers.'); return; }
    if (statusKey === AssetStatus.Ready && currentUser.role !== Role.TeamLead) { alert('Access Denied: Only a Team Lead has publishing and approval clearance.'); return; }
    try {
      await apiPut(`/api/assets/${assetId}/status`, { status: statusKey });
      setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: statusKey } : a));
    } catch (err) { console.error(err); }
  };

  const triggerEditing = (asset: Asset) => {
    if (!currentUser || currentUser.role === Role.Designer) { alert('Designers are restricted to upload/download. Only Content Writers and Team Leads can curate captions.'); return; }
    setEditingAssetId(asset.id);
    setEditCaption(asset.captionText);
    setEditArtworkComment(asset.artworkComment || '');
    setEditRevisedCaption(asset.revisedCaption || '');
    setEditSchedule(asset.scheduledDate);
    setEditStatus(asset.status);
  };

  const saveEdits = async (assetId: string) => {
    if (!currentUser) return;
    if (editStatus === AssetStatus.Ready && currentUser.role !== Role.TeamLead) { alert('Access Denied: Only a Team Lead has publishing and approval clearance.'); return; }
    try {
      await apiPut(`/api/assets/${assetId}`, {
        captionText: editCaption, artworkComment: editArtworkComment, revisedCaption: editRevisedCaption,
        scheduledDate: editSchedule, status: editStatus
      });
      setEditingAssetId(null);
      setAssets(prev => prev.map(a => a.id === assetId ? { ...a, captionText: editCaption, artworkComment: editArtworkComment, revisedCaption: editRevisedCaption, scheduledDate: editSchedule, status: editStatus } : a));
    } catch (err) { console.error(err); }
  };

  const deleteAsset = async (assetId: string) => {
    if (!currentUser || currentUser.role !== Role.TeamLead) { alert('Only a Team Lead has authority to delete campaign assets.'); return; }
    if (confirm('Permanently purge this visual campaign asset? This scrub cannot be undone.')) {
      try {
        await apiDelete(`/api/assets/${assetId}`);
        setAssets(prev => prev.filter(a => a.id !== assetId));
      } catch (err) { console.error(err); }
    }
  };

  const copyCaptionToClipboard = (text: string, assetId: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedAssetId(assetId);
    setTimeout(() => { setCopiedAssetId(null); }, 2000);
  };

  const formatMimeTypeDescription = (mime: string) => {
    if (!mime) return 'GENERIC ASSET';
    if (mime.includes('image')) return 'RASTER RENDER';
    if (mime.includes('video')) return 'MASTER VIDEO';
    if (mime.includes('photoshop') || mime.includes('psd') || mime.includes('octet-stream')) return 'RAW PSD PROJECT';
    return mime.toUpperCase();
  };

  const filteredAssets = assets
    .filter(asset => {
      const matchesSearch = asset.captionText.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || asset.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const t1 = new Date(a.scheduledDate).getTime();
      const t2 = new Date(b.scheduledDate).getTime();
      return sortOrder === 'asc' ? t1 - t2 : t2 - t1;
    });

  const draftCount = assets.filter(a => a.status === AssetStatus.Drafting).length;
  const refineCount = assets.filter(a => a.status === AssetStatus.Refining).length;
  const readyCount = assets.filter(a => a.status === AssetStatus.Ready).length;

  return {
    assets, loadingAssets,
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    sortOrder, setSortOrder,
    isDragOver, setIsDragOver,
    fileInputRef,
    isUploading, uploadProgress, uploadError, uploadingFileName,
    editingAssetId, setEditingAssetId,
    editCaption, setEditCaption,
    editArtworkComment, setEditArtworkComment,
    editRevisedCaption, setEditRevisedCaption,
    editSchedule, setEditSchedule,
    editStatus, setEditStatus,
    copiedAssetId,
    filteredAssets, draftCount, refineCount, readyCount,
    formatMimeTypeDescription,
    handleS3FileUpload, handleDragOver, handleDragLeave, handleDrop,
    handleQuickStatusUpdate, triggerEditing, saveEdits, deleteAsset,
    copyCaptionToClipboard,
    fetchAssets,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useMedia.ts
git commit -m "feat: extract useMedia hook from AppContext"
```

---

### Task 7: Create hooks/useArticles.ts

**Files:**
- Create: `src/hooks/useArticles.ts`

- [ ] **Step 1: Create useArticles hook**

Write to `src/hooks/useArticles.ts`:

```typescript
import React, { useState, useEffect } from 'react';
import { Article, User } from '../types';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';

export interface UseArticlesParams {
  currentUser: User | null;
  selectedPostingId: string;
}

export interface UseArticlesReturn {
  articles: Article[];
  loadingArticles: boolean;
  activeWorkspaceTab: 'media' | 'articles';
  setActiveWorkspaceTab: (v: 'media' | 'articles') => void;
  isArticleFullTab: boolean;
  setIsArticleFullTab: (v: boolean) => void;
  isCreatingArticle: boolean;
  setIsCreatingArticle: (v: boolean) => void;
  articleTitle: string;
  setArticleTitle: (v: string) => void;
  articleBody: string;
  setArticleBody: (v: string) => void;
  articlePreparedBy: string;
  setArticlePreparedBy: (v: string) => void;
  articleDate: string;
  setArticleDate: (v: string) => void;
  articleError: string;
  setArticleError: (v: string) => void;
  editingArticleId: string | null;
  setEditingArticleId: (id: string | null) => void;
  handleCreateArticle: (e: React.FormEvent) => void;
  handleUpdateArticle: (articleId: string, updatedFields: Partial<Article>) => void;
  handleDeleteArticle: (articleId: string) => void;
  fetchArticles: (postingId: string) => void;
}

export function useArticles({ currentUser, selectedPostingId }: UseArticlesParams): UseArticlesReturn {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'media' | 'articles'>('media');
  const [isArticleFullTab, setIsArticleFullTab] = useState(false);
  const [isCreatingArticle, setIsCreatingArticle] = useState(false);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleBody, setArticleBody] = useState('');
  const [articlePreparedBy, setArticlePreparedBy] = useState('');
  const [articleDate, setArticleDate] = useState('');
  const [articleError, setArticleError] = useState('');
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  const fetchArticles = async (postingId: string) => {
    setLoadingArticles(true);
    try {
      const data = await apiGet<Article[]>(`/api/postings/${postingId}/articles`);
      setArticles(data);
    } catch (err) { console.error(err); }
    finally { setLoadingArticles(false); }
  };

  useEffect(() => {
    if (selectedPostingId) {
      fetchArticles(selectedPostingId);
    } else {
      setArticles([]);
    }
  }, [selectedPostingId]);

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setArticleError('');
    if (!articleTitle.trim()) { setArticleError('Article title is required.'); return; }
    if (!articlePreparedBy.trim()) { setArticleError("Name of developer ('Prepared By') is required."); return; }
    if (!selectedPostingId) { setArticleError('Select a posting folder first.'); return; }
    try {
      const createdArticle = await apiPost<Article>(`/api/postings/${selectedPostingId}/articles`, {
        title: articleTitle, body: articleBody, preparedBy: articlePreparedBy, createdAt: articleDate || undefined
      });
      setArticleTitle(''); setArticleBody(''); setArticlePreparedBy(''); setArticleDate('');
      setIsCreatingArticle(false);
      setArticles(prev => [createdArticle, ...prev]);
    } catch (err: any) { console.error('Failed to create article:', err); setArticleError(err.message || 'Network connection failed.'); }
  };

  const handleUpdateArticle = async (articleId: string, updatedFields: Partial<Article>) => {
    try {
      const updatedArticle = await apiPut<Article>(`/api/articles/${articleId}`, updatedFields);
      setArticles(prev => prev.map(a => a.id === articleId ? updatedArticle : a));
      setEditingArticleId(null);
    } catch (err) { console.error(err); }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      await apiDelete(`/api/articles/${articleId}`);
      setArticles(prev => prev.filter(a => a.id !== articleId));
    } catch (err) { console.error(err); }
  };

  return {
    articles, loadingArticles,
    activeWorkspaceTab, setActiveWorkspaceTab,
    isArticleFullTab, setIsArticleFullTab,
    isCreatingArticle, setIsCreatingArticle,
    articleTitle, setArticleTitle,
    articleBody, setArticleBody,
    articlePreparedBy, setArticlePreparedBy,
    articleDate, setArticleDate,
    articleError, setArticleError,
    editingArticleId, setEditingArticleId,
    handleCreateArticle, handleUpdateArticle, handleDeleteArticle,
    fetchArticles,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useArticles.ts
git commit -m "feat: extract useArticles hook from AppContext"
```

---

### Task 8: Rewrite AppContext.tsx as Thin Provider

**Files:**
- Modify: `src/AppContext.tsx` (replace entire contents)

- [ ] **Step 1: Read current AppContext.tsx for backup reference**

Run: `cp src/AppContext.tsx src/AppContext.tsx.bak`

- [ ] **Step 2: Rewrite AppContext.tsx**

Replace `src/AppContext.tsx` with:

```typescript
import React, { createContext, useContext } from 'react';
import { AssetStatus, User, Company, Campaign, PostingFolder, Article } from './types';
import { useAuth, UseAuthReturn } from './hooks/useAuth';
import { useWorkspace, UseWorkspaceReturn } from './hooks/useWorkspace';
import { useMedia, UseMediaReturn } from './hooks/useMedia';
import { useArticles, UseArticlesReturn } from './hooks/useArticles';
import { useOnboarding, UseOnboardingReturn } from './hooks/useOnboarding';
import { useActivity, ActivityEntry, UseActivityReturn } from './hooks/useActivity';

export type { ActivityEntry } from './hooks/useActivity';

export interface AppContextValue
  extends UseAuthReturn,
    UseWorkspaceReturn,
    UseMediaReturn,
    UseArticlesReturn,
    UseOnboardingReturn,
    UseActivityReturn {}

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

export function useAppState(): AppContextValue {
  const auth = useAuth();
  const { currentUser } = auth;
  const workspace = useWorkspace({ currentUser });
  const { currentCompany, selectedPostingId, selectedCampaignId, setSelectedPostingId, setSelectedCampaignId } = workspace;
  const media = useMedia({ currentUser, selectedPostingId });
  const articles = useArticles({ currentUser, selectedPostingId });
  const onboarding = useOnboarding({ currentUser });
  const activity = useActivity({ currentUser });

  return {
    ...auth,
    ...workspace,
    ...media,
    ...articles,
    ...onboarding,
    ...activity,
  };
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors related to AppContext or hooks

- [ ] **Step 4: Verify the app starts and works**

Run: `npm run dev`

Manual test:
- Open http://localhost:3000
- Login with existing access code
- Select company, navigate campaigns/postings
- Upload asset, create article, edit both
- Verify all existing behavior works identically

- [ ] **Step 5: Remove backup file**

Run: `rm src/AppContext.tsx.bak`

- [ ] **Step 6: Commit**

```bash
git add src/AppContext.tsx
git commit -m "refactor: rewrite AppContext as thin provider composing domain hooks"
```

---

## Phase 2A: ProjectType Selector

### Task 9: Add projectType to PostingFolder

**Files:**
- Modify: `src/types.ts` (add projectType to PostingFolder)
- Modify: `server.ts` (lines 232-247, accept projectType in posting creation)
- Modify: `src/hooks/useWorkspace.ts` (newPostingProjectType already present)
- Modify: `src/components/FolderSidebar.tsx` (add projectType toggle to posting form)

- [ ] **Step 1: Add projectType to PostingFolder type**

In `src/types.ts`, modify the PostingFolder interface. Find:

```typescript
export interface PostingFolder {
  id: string;
  campaignId: string;
  name: string;
  description: string;
  createdAt: string;
}
```

Replace with:

```typescript
export interface PostingFolder {
  id: string;
  campaignId: string;
  name: string;
  description: string;
  createdAt: string;
  projectType?: 'both' | 'media' | 'articles';
}
```

- [ ] **Step 2: Update server posting creation to accept projectType**

In `server.ts`, find the posting creation handler (around line 232-247). Replace:

```typescript
app.post("/api/campaigns/:campaignId/postings", (req, res) => {
    const { campaignId } = req.params;
    const { name, description } = req.body;
    if (!name?.trim()) { res.status(400).json({ error: "Posting folder name is required" }); return; }
    const db = readDB();
    const newPosting: PostingFolder = {
      id: "p-" + Date.now().toString(36),
      campaignId,
      name: name.trim(),
      description: description?.trim() || "",
      createdAt: new Date().toISOString()
    };
    db.postingFolders.push(newPosting);
    writeDB(db);
    res.status(201).json(newPosting);
  });
```

Replace with:

```typescript
app.post("/api/campaigns/:campaignId/postings", (req, res) => {
    const { campaignId } = req.params;
    const { name, description, projectType } = req.body;
    if (!name?.trim()) { res.status(400).json({ error: "Posting folder name is required" }); return; }
    const db = readDB();
    const newPosting: PostingFolder = {
      id: "p-" + Date.now().toString(36),
      campaignId,
      name: name.trim(),
      description: description?.trim() || "",
      createdAt: new Date().toISOString(),
      projectType: projectType || "both"
    };
    db.postingFolders.push(newPosting);
    writeDB(db);
    res.status(201).json(newPosting);
  });
```

- [ ] **Step 3: Add projectType toggle to FolderSidebar posting form**

In `src/components/FolderSidebar.tsx`, find the posting creation form (around lines 288-296). Inside the `<form>`, after the description input and before the error message, add the projectType toggle.

After this line:
```tsx
<input type="text" className="w-full text-[10px] p-1.5 bg-white border border-neutral-200 rounded focus:outline-none focus:border-neutral-400 transition-colors" placeholder="Description (optional)" value={newPostingDescription} onChange={(e) => setNewPostingDescription(e.target.value)} />
```

Add:
```tsx
{/* ProjectType label toggle */}
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

Also ensure `newPostingProjectType` and `setNewPostingProjectType` are destructured from `useAppContext()` in FolderSidebar. Find the destructuring block (around lines 31-52) and add:
```typescript
newPostingProjectType, setNewPostingProjectType,
```

- [ ] **Step 4: Commit**

```bash
git add src/types.ts server.ts src/components/FolderSidebar.tsx
git commit -m "feat: add projectType label to posting folders (label-only, no tab filtering)"
```

---

## Phase 2B: Error Handling & Resilience

### Task 10: Create hooks/useToast.ts

**Files:**
- Create: `src/hooks/useToast.ts`

- [ ] **Step 1: Create useToast hook**

Write to `src/hooks/useToast.ts`:

```typescript
import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

export interface UseToastReturn {
  toasts: Toast[];
  addToast: (type: ToastType, title: string, message: string) => void;
  removeToast: (id: string) => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => {
      const next = [...prev, { id, type, title, message }];
      return next.slice(-5);
    });
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  return { toasts, addToast, removeToast };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useToast.ts
git commit -m "feat: add useToast hook for notification system"
```

---

### Task 11: Create components/common/ToastContainer.tsx

**Files:**
- Create: `src/components/common/ToastContainer.tsx`

- [ ] **Step 1: Create ToastContainer component**

Write to `src/components/common/ToastContainer.tsx`:

```typescript
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Toast } from '../../hooks/useToast';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: 'text-emerald-500' },
  error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-500' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: 'text-amber-500' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-500' },
};

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => {
          const Icon = iconMap[toast.type];
          const colors = colorMap[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              className={`${colors.bg} ${colors.border} border rounded-xl p-3 shadow-lg pointer-events-auto flex items-start gap-3`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${colors.icon}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold ${colors.text}`}>{toast.title}</p>
                <p className={`text-[11px] ${colors.text} opacity-80 mt-0.5`}>{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(toast.id)}
                className={`flex-shrink-0 p-0.5 rounded hover:bg-black/5 ${colors.text}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/common/ToastContainer.tsx
git commit -m "feat: add ToastContainer component with animated stack"
```

---

### Task 12: Create components/common/ErrorBoundary.tsx

**Files:**
- Create: `src/components/common/ErrorBoundary.tsx`

- [ ] **Step 1: Create ErrorBoundary component**

Write to `src/components/common/ErrorBoundary.tsx`:

```typescript
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-8 bg-[#fafafa]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-lg font-black text-neutral-900 uppercase tracking-tight">Something went wrong</h2>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
              The workspace encountered an unexpected error. This may be temporary.
            </p>
            {this.state.error && (
              <p className="text-[10px] font-mono text-red-600 bg-red-50 p-2 rounded-lg mt-3 border border-red-200 max-h-20 overflow-y-auto">
                {this.state.error.message}
              </p>
            )}
            <button
              type="button"
              onClick={this.handleReset}
              className="mt-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/common/ErrorBoundary.tsx
git commit -m "feat: add ErrorBoundary component with reset capability"
```

---

### Task 13: Create components/common/Skeleton.tsx

**Files:**
- Create: `src/components/common/Skeleton.tsx`

- [ ] **Step 1: Create Skeleton component**

Write to `src/components/common/Skeleton.tsx`:

```typescript
import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = '16px', rounded = '4px', className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-neutral-200 ${className}`}
      style={{ width, height, borderRadius: rounded }}
    />
  );
}

export function SkeletonAssetCard() {
  return (
    <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden flex flex-col lg:flex-row">
      <div className="lg:w-2/5 bg-neutral-100 min-h-[200px] flex items-center justify-center">
        <Skeleton width="120px" height="80px" rounded="8px" />
      </div>
      <div className="lg:w-3/5 p-5 space-y-3">
        <Skeleton width="60%" height="12px" />
        <Skeleton width="80%" height="32px" rounded="6px" />
        <Skeleton width="40%" height="12px" />
        <Skeleton width="100%" height="24px" rounded="6px" />
      </div>
    </div>
  );
}

export function SkeletonArticleRow() {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
      <div className="flex gap-6">
        <div className="w-1/4 space-y-3">
          <Skeleton width="100%" height="16px" />
          <Skeleton width="60%" height="12px" />
          <Skeleton width="40%" height="12px" />
        </div>
        <div className="w-3/4 space-y-3">
          <Skeleton width="70%" height="20px" rounded="6px" />
          <Skeleton width="100%" height="60px" rounded="8px" />
          <Skeleton width="50%" height="12px" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/common/Skeleton.tsx
git commit -m "feat: add Skeleton loading components for assets and articles"
```

---

### Task 14: Wire Toast and ErrorBoundary into App

**Files:**
- Modify: `src/AppContext.tsx` (add toast to context)
- Modify: `src/App.tsx` (add ErrorBoundary, ToastContainer)

- [ ] **Step 1: Add useToast to AppContext**

In `src/AppContext.tsx`:

Add import:
```typescript
import { useToast, UseToastReturn } from './hooks/useToast';
```

Add to AppContextValue:
```typescript
  extends UseAuthReturn,
    UseWorkspaceReturn,
    UseMediaReturn,
    UseArticlesReturn,
    UseOnboardingReturn,
    UseActivityReturn,
    UseToastReturn {}
```

Add in useAppState:
```typescript
  const toast = useToast();
```

Spread into return:
```typescript
  return {
    ...auth,
    ...workspace,
    ...media,
    ...articles,
    ...onboarding,
    ...activity,
    ...toast,
  };
```

- [ ] **Step 2: Add ErrorBoundary and ToastContainer to App.tsx**

In `src/App.tsx`:

Add imports:
```typescript
import ErrorBoundary from './components/common/ErrorBoundary';
import ToastContainer from './components/common/ToastContainer';
```

Add `toasts` and `removeToast` to destructured context (in the `const ctx = ...` block and the `const { ... } = ctx;` block):
```typescript
toasts, removeToast,
```

In the JSX, wrap the content area with ErrorBoundary:

Find:
```tsx
        {!currentUser ? (
          <LoginScreen />
        ) : !currentCompany ? (
          <CompanySelector />
        ) : (
          <WorkspaceDashboard />
        )}
```

Replace with:
```tsx
        <ErrorBoundary>
          {!currentUser ? (
            <LoginScreen />
          ) : !currentCompany ? (
            <CompanySelector />
          ) : (
            <WorkspaceDashboard />
          )}
        </ErrorBoundary>
```

Add ToastContainer before the closing `</div>` of the root div:
```tsx
        <ToastContainer toasts={toasts} onRemove={removeToast} />
```

- [ ] **Step 3: Commit**

```bash
git add src/AppContext.tsx src/App.tsx
git commit -m "feat: wire toast notifications and error boundary into app shell"
```

---

### Task 15: Integrate Toasts into Hooks (replace alerts)

**Files:**
- Modify: `src/hooks/useWorkspace.ts` (add toast support)
- Modify: `src/hooks/useMedia.ts` (add toast support)
- Modify: `src/hooks/useArticles.ts` (add toast support)
- Modify: `src/hooks/useOnboarding.ts` (add toast support)

**Approach:** Each hook that needs to show toasts will return `addToast` from its deps. Since toasts live in context through AppContext, hooks can access it. However, since hooks are composed in AppContext, we need a different approach: hooks accept an optional `addToast` callback parameter, wired at the AppContext level.

- [ ] **Step 1: Add addToast parameter to hooks that need it**

Update hook interfaces to accept optional params:

In `src/hooks/useWorkspace.ts`, add to interface:
```typescript
export interface UseWorkspaceParams {
  currentUser: User | null;
  addToast?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}
```

In the function, destructure:
```typescript
export function useWorkspace({ currentUser, addToast }: UseWorkspaceParams): UseWorkspaceReturn {
```

Replace `alert()` calls with `addToast` calls:
- `alert('Access Denied: Only Team Leads can manage campaigns.')` → `addToast?.('error', 'Access Denied', 'Only Team Leads can manage campaigns.')`
- `alert('Access Denied: Only Team Leads are authorized to delete campaigns.')` → `addToast?.('error', 'Access Denied', 'Only Team Leads are authorized to delete campaigns.')`
- `alert('Access Denied: Only Team Leads can manage posting folders.')` → `addToast?.('error', 'Access Denied', 'Only Team Leads can manage posting folders.')`
- `alert('Access Denied: Only Team Leads are authorized to delete posting folders.')` → `addToast?.('error', 'Access Denied', 'Only Team Leads are authorized to delete posting folders.')`

Replace `console.error` (for user-facing errors, not debug logs) with error toasts in catch blocks. Keep `console.error` for debug purposes, but also call `addToast?.('error', ...)`.

Similarly update `src/hooks/useMedia.ts`:

```typescript
export interface UseMediaParams {
  currentUser: User | null;
  selectedPostingId: string;
  addToast?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}
```

Replace alerts with toasts in useMedia.

Similarly update `src/hooks/useArticles.ts` with same pattern.

Update `src/hooks/useOnboarding.ts` with same pattern.

- [ ] **Step 2: Wire addToast in AppContext.tsx**

In `src/AppContext.tsx`, update the hook calls to pass `addToast`:

```typescript
  const { addToast } = toast;

  const workspace = useWorkspace({ currentUser, addToast });
  const media = useMedia({ currentUser, selectedPostingId, addToast });
  const articles = useArticles({ currentUser, selectedPostingId, addToast });
  const onboarding = useOnboarding({ currentUser, addToast });
```

Ensure these callbacks are wired BEFORE the return spread:
```typescript
  const toast = useToast();
  const { addToast } = toast;
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useWorkspace.ts src/hooks/useMedia.ts src/hooks/useArticles.ts src/hooks/useOnboarding.ts src/AppContext.tsx
git commit -m "feat: integrate toast notifications into all hooks, replacing alert() calls"
```

---

## Phase 3: UI/UX Polish

### Task 16: Add Skeleton Loading to MediaTab and ArticlesTab

**Files:**
- Modify: `src/components/MediaTab.tsx`
- Modify: `src/components/ArticlesTab.tsx`

- [ ] **Step 1: Add skeleton loading to MediaTab**

In `src/components/MediaTab.tsx`, add import:
```typescript
import { Skeleton, SkeletonAssetCard } from './common/Skeleton';
```

Replace the loading spinner div (the `{loadingAssets ? ...}` block) with skeleton UI:
```tsx
      {loadingAssets ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => <SkeletonAssetCard key={i} />)}
        </div>
      ) : filteredAssets.length === 0 ? (
```

- [ ] **Step 2: Add skeleton loading to ArticlesTab**

In `src/components/ArticlesTab.tsx`, add import:
```typescript
import { Skeleton, SkeletonArticleRow } from './common/Skeleton';
```

Replace the loading spinner div with:
```tsx
      {loadingArticles ? (
        <div className="space-y-6">
          {[1, 2].map(i => <SkeletonArticleRow key={i} />)}
        </div>
      ) : articles.length === 0 ? (
```

- [ ] **Step 3: Commit**

```bash
git add src/components/MediaTab.tsx src/components/ArticlesTab.tsx
git commit -m "feat: add skeleton loading states to MediaTab and ArticlesTab"
```

---

### Task 17: Add Empty States with CTA Buttons

**Files:**
- Modify: `src/components/WorkspaceDashboard.tsx`
- Modify: `src/components/MediaTab.tsx`
- Modify: `src/components/ArticlesTab.tsx`
- Modify: `src/components/CompanySelector.tsx`

- [ ] **Step 1: Add empty state for "no postings" in WorkspaceDashboard**

In `src/components/WorkspaceDashboard.tsx`, find the `selectedCampaignId` block (lines 169-180).

Replace the existing "Select or Create a Posting Folder" message with:
```tsx
        ) : selectedCampaignId ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md bg-white border border-[#e5e5e5] rounded-2xl p-8 shadow-xs">
              <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Layers className="w-7 h-7 text-neutral-400" />
              </div>
              <h3 className="text-sm font-black text-neutral-900 uppercase tracking-tight">No posting folders yet</h3>
              <p className="text-xs text-neutral-500 leading-relaxed mt-2">
                This campaign has no posting folders. Create one to start adding assets and articles.
              </p>
              <button
                type="button"
                onClick={() => setIsCreatingPosting(true)}
                className="mt-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Create New Posting
              </button>
            </div>
          </div>
```

Add missing imports at the top:
```typescript
import { Plus } from 'lucide-react';
```
(Plus is already imported via the existing imports list or needs to be added.)

Add `setIsCreatingPosting` to the destructured context values from `useAppContext()`.

- [ ] **Step 2: Add empty state for "no assets" in MediaTab**

Find the empty assets block (lines 66-71) and replace with:
```tsx
      ) : filteredAssets.length === 0 ? (
        searchQuery || statusFilter !== 'All' ? (
          <div className="text-center py-12 bg-white border border-[#e5e5e5] rounded-2xl shadow-xs">
            <div className="mx-auto w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3"><FileQuestion className="w-5 h-5" /></div>
            <h3 className="text-xs font-extrabold text-neutral-900 uppercase tracking-wide">No assets match your filters</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">Try adjusting the search or status filter.</p>
            <button type="button" onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
              className="mt-3 text-[10px] font-bold text-neutral-600 hover:text-neutral-900 underline"
            >Clear Filters</button>
          </div>
        ) : (
          <div className="text-center py-12 bg-white border border-[#e5e5e5] rounded-2xl shadow-xs">
            <div className="mx-auto w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
              <Image className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wide">No assets uploaded</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">Drag and drop media files or click to browse and upload.</p>
            <button type="button" onClick={() => fileInputRef?.current?.click()}
              className="mt-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Media
            </button>
          </div>
        )
```

Add missing imports: `Image`, `Upload` from lucide-react. Add `fileInputRef` to destructured context.

- [ ] **Step 3: Add empty state for "no articles" in ArticlesTab**

Find the empty articles block (lines 96-101) and replace with:
```tsx
      ) : articles.length === 0 ? (
        <div className="text-center py-12 bg-white border border-neutral-200 rounded-2xl shadow-xs">
          <div className="mx-auto w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-extrabold text-[#171717] uppercase tracking-wide">No articles written</h4>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto leading-relaxed">Start composing your first write-up.</p>
          <button type="button" onClick={() => { setIsCreatingArticle(true); if (!articlePreparedBy) { setArticlePreparedBy(currentUser?.username || ''); } }}
            className="mt-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Compose Article
          </button>
        </div>
```

- [ ] **Step 4: Add empty state for "no companies" in CompanySelector**

In `src/components/CompanySelector.tsx`, find the place where availableCompanies is empty and replace with a guided empty state:

Find the empty companies section. If there's no explicit empty state, find the part where companies are mapped and add a condition before it:
```tsx
{availableCompanies.length === 0 && (
  <div className="text-center py-16 bg-white border border-[#e5e5e5] rounded-2xl shadow-xs">
    <Building2 className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
    <h3 className="text-sm font-extrabold text-neutral-900 uppercase">No brand workspaces yet</h3>
    <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
      Create your first subsidiary workspace to begin managing campaign assets.
    </p>
    <button type="button" onClick={() => setIsCreatingCompany(true)}
      className="mt-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors"
    >
      Create Workspace
    </button>
  </div>
)}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/WorkspaceDashboard.tsx src/components/MediaTab.tsx src/components/ArticlesTab.tsx src/components/CompanySelector.tsx
git commit -m "feat: add guided empty states with CTA buttons across all views"
```

---

### Task 18: Mobile Responsive Sidebar (Drawer)

**Files:**
- Modify: `src/components/FolderSidebar.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add mobile drawer behavior to FolderSidebar**

In `src/components/FolderSidebar.tsx`, add a mobile state. At the top of the component:

```typescript
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
```

Add mobile state:
```typescript
const [isMobileOpen, setIsMobileOpen] = useState(false);
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 768);
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

Wrap the sidebar in a conditional structure:

For the collapsed and expanded states, add a mobile overlay variant.

Replace the sidebar's root element. Find:
```tsx
<aside className={`bg-white border-r border-neutral-200 flex flex-col flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-14' : 'w-[280px]'}`}>
```

Replace with:
```tsx
  {/* Mobile hamburger button */}
  {isMobile && !isMobileOpen && (
    <button
      type="button"
      onClick={() => setIsMobileOpen(true)}
      className="fixed top-[57px] left-0 z-30 p-2 bg-white border border-neutral-200 rounded-r-lg shadow-sm"
      aria-label="Open sidebar"
    >
      <Menu className="w-4 h-4 text-neutral-600" />
    </button>
  )}

  {/* Mobile overlay */}
  {isMobile && isMobileOpen && (
    <div
      className="fixed inset-0 z-40 bg-black/40"
      onClick={() => setIsMobileOpen(false)}
    />
  )}

  <aside className={`bg-white border-r border-neutral-200 flex flex-col flex-shrink-0 transition-all duration-300 ${
    isMobile
      ? `fixed top-[57px] left-0 h-[calc(100vh-57px)] z-50 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} w-[280px]`
      : sidebarCollapsed ? 'w-14' : 'w-[280px]'
  }`}>
```

Auto-close mobile drawer when a posting is selected. In the posting click handler (inside campaign postings), after `setSelectedPostingId(...)`, add:
```typescript
if (isMobile) setIsMobileOpen(false);
```

Similarly when selecting a campaign.

- [ ] **Step 2: Commit**

```bash
git add src/components/FolderSidebar.tsx
git commit -m "feat: add mobile drawer sidebar with overlay and hamburger toggle"
```

---

### Task 19: Accessibility Improvements

**Files:**
- Modify: `src/components/common/Modal.tsx`
- Modify: `src/components/common/StatusBadge.tsx`
- Modify: `src/components/common/ImageLightbox.tsx`
- Modify: `src/components/FolderSidebar.tsx`
- Modify: `src/components/AssetCard.tsx`

- [ ] **Step 1: Add aria attributes to Modal**

In `src/components/common/Modal.tsx`, add `role="dialog"`, `aria-modal="true"` to the backdrop div, and add Escape key handler:

```tsx
import { useEffect } from 'react';

// Inside Modal component, add:
useEffect(() => {
  if (!isOpen) return;
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', handleKey);
  return () => document.removeEventListener('keydown', handleKey);
}, [isOpen, onClose]);
```

Add `role="dialog"` and `aria-modal="true"` to the outer div.

- [ ] **Step 2: Add aria-label to StatusBadge**

In `src/components/common/StatusBadge.tsx`, read the file first, then add `aria-label={`Asset status: ${status}`}` to the span element.

- [ ] **Step 3: Add touch improvements to ImageLightbox**

In `src/components/common/ImageLightbox.tsx`, add `touch-action: manipulation` to the image container style. Add swipe-down-to-close on mobile by tracking touch start/end Y positions.

- [ ] **Step 4: Add aria-labels to FolderSidebar icon buttons**

Add `aria-label` to:
- Collapse sidebar button: `aria-label="Collapse sidebar"`
- New Campaign button: `aria-label="Create new campaign"`
- Upload button: `aria-label="Upload media file"`
- New Article button: `aria-label="Create new article"`
- Delete buttons: `aria-label={`Delete campaign ${campaign.name}`}`
- Notification/Activity toggle: `aria-expanded={
- Mobile hamburger: `aria-label="Open sidebar"`

- [ ] **Step 5: Add lazy loading to asset images**

In `src/components/AssetCard.tsx`, add `loading="lazy"` and `decoding="async"` to the `<img>` tag (around line 63).

Add `alt` text using asset's captionText:
```tsx
alt={asset.captionText || "Asset preview"}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/common/Modal.tsx src/components/common/StatusBadge.tsx src/components/common/ImageLightbox.tsx src/components/FolderSidebar.tsx src/components/AssetCard.tsx
git commit -m "feat: accessibility improvements — aria-labels, focus, keyboard, lazy loading"
```

---

### Task 20: Performance Optimizations

**Files:**
- Modify: `src/components/AssetCard.tsx` (React.memo)
- Modify: `src/components/MediaTab.tsx` (debounced search)

- [ ] **Step 1: Add React.memo to AssetCard**

In `src/components/AssetCard.tsx`, wrap the export:
```tsx
export default React.memo(AssetCard);
```

- [ ] **Step 2: Add debounced search to MediaTab**

In `src/components/MediaTab.tsx`, add a debounce utility. Instead of a separate utility file, add a small `useDebounce` hook in the component or as a local util:

```typescript
import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}
```

Use it for the search query: the input updates `searchQuery` immediately for UI responsiveness, but filtering uses `debouncedSearchQuery`.

Actually, since the filtering logic is in useMedia's `filteredAssets` computed value, we need to handle this differently. The simplest approach: don't debounce in the tab — the hook's filter + sort is already efficient for datasets under 1000 items. Skip debouncing to avoid complexity; the filtering is instant as-is with React's render batching.

Instead, add `React.memo` to the campaign list items in FolderSidebar.

- [ ] **Step 1 (revised): Add React.memo to AssetCard only**

```typescript
export default React.memo(AssetCard);
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AssetCard.tsx
git commit -m "perf: add React.memo to AssetCard for render optimization"
```

---

### Task 21: Visual Polish — Transitions and Spacing

**Files:**
- Modify: `src/index.css` (add prefers-reduced-motion)

- [ ] **Step 1: Add prefers-reduced-motion support**

In `src/index.css`, add at the end:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "feat: add prefers-reduced-motion support"
```

---

### Task 22: Final Verification and Cleanup

- [ ] **Step 1: Run TypeScript type check**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 2: Run the app**

Run: `npm run dev`

Manual smoke test checklist:
- [ ] Login with existing access code
- [ ] Login screen shows remembered users
- [ ] Select company
- [ ] Navigate campaigns and postings
- [ ] Create a new posting with projectType "Media" — verify it's stored
- [ ] Upload an asset — verify success toast
- [ ] Edit asset status and captions — verify no errors
- [ ] Create an article — verify success toast
- [ ] Delete a posting — verify confirmation
- [ ] Test error handling: try creating a campaign with empty name — verify error toast
- [ ] Test responsive layout: resize browser to mobile width (<768px), verify hamburger sidebar
- [ ] Test keyboard: Tab through UI, verify visible focus rings, Escape closes modals
- [ ] Verify empty states show correct buttons
- [ ] Verify loading skeletons appear briefly
- [ ] Test image lightbox: zoom, pan, social media overlays
- [ ] Verify proxy login (view-as mode) still works
- [ ] Verify onboarding modal CRUD operations

- [ ] **Step 3: Clean up backup files if any**

Run: `rm -f src/AppContext.tsx.bak`

- [ ] **Step 4: Final commit (if any cleanup changes)**

```bash
git add -A
git commit -m "chore: final verification and cleanup"
```
