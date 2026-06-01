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
