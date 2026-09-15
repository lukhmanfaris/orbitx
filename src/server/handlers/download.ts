import { getSupabase } from '../db';
import { json, requireAuth } from '../http';
import { filenameFromKey, keyFromUrl } from '../storage';

/** GET /api/assets/:id/download — streams the R2 object as an attachment. */
export async function handleDownload(request: Request, env: Env, assetId: string): Promise<Response> {
  const auth = requireAuth(request, env.JWT_SECRET);
  if (auth instanceof Response) return auth;

  const { data: asset, error } = await getSupabase()
    .from('assets')
    .select('s3_file_url')
    .eq('id', assetId)
    .single();
  if (error || !asset) return json({ error: 'Asset not found' }, 404);

  const key = keyFromUrl(asset.s3_file_url, env.R2_PUBLIC_URL);
  if (!key) return json({ error: 'Asset is not a downloadable file' }, 400);

  const obj = await env.R2_BUCKET.get(key);
  if (!obj) return json({ error: 'File not found in storage' }, 404);

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('Content-Length', String(obj.size));
  headers.set('Content-Disposition', `attachment; filename="${filenameFromKey(key)}"`);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/octet-stream');
  return new Response(obj.body, { status: 200, headers });
}
