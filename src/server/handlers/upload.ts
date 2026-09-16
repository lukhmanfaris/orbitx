import { json, requireAuth } from '../http';
import { MAX_UPLOAD_BYTES, safeKey } from '../storage';

/** PUT /api/upload — raw body, headers `Content-Type` + `X-File-Name`. */
export async function handleUpload(request: Request, env: Env): Promise<Response> {
  const auth = requireAuth(request, env.JWT_SECRET);
  if (auth instanceof Response) return auth;

  const { success } = await env.UPLOAD_LIMITER.limit({ key: auth.id });
  if (!success) return json({ error: 'Upload limit reached. Please try again later.' }, 429);

  const length = Number(request.headers.get('content-length') ?? 0);
  if (!request.body || !length) return json({ error: 'No file provided' }, 400);
  if (length > MAX_UPLOAD_BYTES) return json({ error: 'File too large (max 100MB)' }, 413);

  let decoded: string;
  try {
    decoded = decodeURIComponent(request.headers.get('x-file-name') ?? 'file');
  } catch (err) {
    if (err instanceof URIError) return json({ error: 'Invalid X-File-Name header' }, 400);
    throw err;
  }
  const rawName = decoded.slice(0, 200);
  const contentType = request.headers.get('content-type') || 'application/octet-stream';
  const key = safeKey(rawName);

  try {
    await env.R2_BUCKET.put(key, request.body, { httpMetadata: { contentType } });
  } catch (err) {
    console.error('Failed to upload to R2', err);
    return json({ error: 'Failed to upload file' }, 500);
  }

  return json({ publicUrl: `${env.R2_PUBLIC_URL}/${key}`, fileType: contentType });
}
