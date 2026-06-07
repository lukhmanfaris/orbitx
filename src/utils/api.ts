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
  constructor(public status: number, body: any) {
    super(body?.error || `Request failed (${status})`);
    this.name = 'ApiError';
  }
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handleAuthFailure(res: Response): boolean {
  if (res.status === 401) {
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
    return true;
  }
  return false;
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: authHeaders() });
  if (handleAuthFailure(res)) throw new ApiError(401, { error: 'Session expired' });
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
  return parseJSON(res);
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (handleAuthFailure(res)) throw new ApiError(401, { error: 'Session expired' });
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
  return parseJSON(res);
}

export async function apiPut<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (handleAuthFailure(res)) throw new ApiError(401, { error: 'Session expired' });
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
  return parseJSON(res);
}

export async function apiDelete<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'DELETE',
    headers: body ? { 'Content-Type': 'application/json', ...authHeaders() } : authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (handleAuthFailure(res)) throw new ApiError(401, { error: 'Session expired' });
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
  return parseJSON(res);
}

export async function apiUpload(url: string, formData: FormData): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  if (handleAuthFailure(res)) throw new ApiError(401, { error: 'Session expired' });
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
  return parseJSON(res);
}
