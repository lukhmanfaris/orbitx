function getAuthToken(): string | null {
  try {
    const token = localStorage.getItem('hub_token');
    if (token) return token;
    return null;
  } catch {
    return null;
  }
}

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
  public body: any;
  constructor(public status: number, body: any) {
    super(body?.error || `Request failed (${status})`);
    this.name = 'ApiError';
    this.body = body;
  }
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handleAuthFailure(res: Response): boolean {
  if (res.status === 401) {
    return true;
  }
  return false;
}

export function clearSessionAndReload() {
  const hadUser = localStorage.getItem('hub_user');
  const hadToken = localStorage.getItem('hub_token');
  localStorage.removeItem('hub_user');
  localStorage.removeItem('hub_token');
  localStorage.removeItem('hub_company');
  localStorage.removeItem('hub_campaign');
  localStorage.removeItem('hub_posting');
  localStorage.removeItem('hub_article_folder');
  localStorage.removeItem('hub_article');
  if (hadUser || hadToken) {
    window.location.reload();
  }
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: authHeaders() });
  if (handleAuthFailure(res)) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(401, body);
  }
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
  return parseJSON(res);
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (handleAuthFailure(res)) {
    const errBody = await res.json().catch(() => ({}));
    throw new ApiError(401, errBody);
  }
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
  return parseJSON(res);
}

export async function apiPut<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (handleAuthFailure(res)) {
    const errBody = await res.json().catch(() => ({}));
    throw new ApiError(401, errBody);
  }
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
  return parseJSON(res);
}

export async function apiDelete<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'DELETE',
    headers: body ? { 'Content-Type': 'application/json', ...authHeaders() } : authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (handleAuthFailure(res)) {
    const errBody = await res.json().catch(() => ({}));
    throw new ApiError(401, errBody);
  }
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
  return parseJSON(res);
}

export async function apiUploadFile(file: File): Promise<{ publicUrl: string; fileType: string }> {
  const res = await fetch('/api/upload', {
    method: 'PUT',
    headers: {
      ...authHeaders(),
      'Content-Type': file.type || 'application/octet-stream',
      'X-File-Name': encodeURIComponent(file.name),
    },
    body: file,
  });
  if (handleAuthFailure(res)) {
    const errBody = await res.json().catch(() => ({}));
    throw new ApiError(401, errBody);
  }
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
  return parseJSON(res);
}

/** Authenticated download → triggers browser save. Used for single asset and zip. */
export async function apiDownload(url: string, filename: string, init?: { method?: 'GET' | 'POST'; body?: unknown }): Promise<void> {
  const res = await fetch(url, {
    method: init?.method ?? 'GET',
    headers: init?.body ? { 'Content-Type': 'application/json', ...authHeaders() } : authHeaders(),
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  if (handleAuthFailure(res)) {
    const errBody = await res.json().catch(() => ({}));
    throw new ApiError(401, errBody);
  }
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}
