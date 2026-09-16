export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

/** `${publicUrl}/uploads/x.jpg` → `uploads/x.jpg`; null if url is not under publicUrl. */
export function keyFromUrl(url: string, publicUrl: string): string | null {
  const prefix = publicUrl.replace(/\/+$/, '') + '/';
  if (!url.startsWith(prefix)) return null;
  const key = url.slice(prefix.length);
  return key || null;
}

/** Same naming as the old multer route: uploads/<ts>_<sanitized name>. */
export function safeKey(originalName: string, now: number = Date.now()): string {
  return `uploads/${now}_${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
}

export function filenameFromKey(key: string): string {
  return (key.split('/').pop() || 'download').replace(/[^\w.-]/g, '_');
}
