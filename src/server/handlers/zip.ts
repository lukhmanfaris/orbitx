import { Zip, ZipPassThrough } from 'fflate';
import { getSupabase } from '../db';
import { json, requireAuth } from '../http';
import { filenameFromKey, keyFromUrl } from '../storage';

/** POST /api/assets/download-zip — store-only streaming zip of the requested assets. */
export async function handleZip(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const auth = requireAuth(request, env.JWT_SECRET);
  if (auth instanceof Response) return auth;

  const body = (await request.json().catch(() => null)) as { assetIds?: unknown } | null;
  const assetIds = body?.assetIds;
  if (!Array.isArray(assetIds) || assetIds.length === 0 || !assetIds.every(id => typeof id === 'string')) {
    return json({ error: 'At least one asset ID required' }, 400);
  }
  if (assetIds.length > 200) return json({ error: 'Too many assets (max 200)' }, 400);

  const { data: assets, error } = await getSupabase()
    .from('assets')
    .select('id, s3_file_url, file_type')
    .in('id', assetIds);
  if (error) return json({ error: error.message }, 500);
  if (!assets || assets.length === 0) return json({ error: 'No assets found' }, 404);

  const downloadable = assets.filter(a => a.file_type !== 'video/embed');
  if (downloadable.length === 0) return json({ error: 'No downloadable assets' }, 400);

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  let pending: Promise<void> = Promise.resolve();
  const zip = new Zip((err, chunk, final) => {
    if (err) {
      writer.abort(err).catch(() => {});
      return;
    }
    pending = pending.then(() => writer.write(chunk)).catch(() => {});
    if (final) pending = pending.then(() => writer.close()).catch(() => {});
  });

  const pump = (async () => {
    try {
      const seen = new Set<string>();
      for (const asset of downloadable) {
        const key = keyFromUrl(asset.s3_file_url, env.R2_PUBLIC_URL);
        if (!key) continue;
        const obj = await env.R2_BUCKET.get(key);
        if (!obj) {
          console.error(`Zip: missing R2 object ${key}`);
          continue;
        }

        let name = filenameFromKey(key);
        if (seen.has(name)) name = `${asset.id}_${name}`;
        seen.add(name);

        const entry = new ZipPassThrough(name); // store-only: media is already compressed
        zip.add(entry);
        for await (const chunk of obj.body as ReadableStream<Uint8Array>) {
          await pending;
          await writer.ready;
          entry.push(chunk);
        }
        entry.push(new Uint8Array(0), true);
      }
      zip.end();
      await pending;
    } catch (err) {
      console.error('ZIP stream failed:', err);
      zip.terminate();
      writer.abort(err).catch(() => {});
    }
  })();
  ctx.waitUntil(pump);

  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="assets.zip"',
    },
  });
}
