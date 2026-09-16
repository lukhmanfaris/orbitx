import { bearerToken, verifyToken, TokenPayload } from './auth/verifyToken';

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export function clientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip') ?? 'unknown';
}

/** Returns the payload, or a ready-to-send 401/500 Response. Mirrors middleware/auth.ts messages. */
export function requireAuth(request: Request, secret: string | undefined): TokenPayload | Response {
  if (!secret) return json({ error: 'Server configuration error' }, 500);
  const token = bearerToken(request.headers.get('authorization'));
  if (!token) return json({ error: 'Authentication required' }, 401);
  const r = verifyToken(token, secret);
  if (r.ok === true) return r.payload;
  return json(
    { error: r.reason === 'expired' ? 'Session expired. Please log in again.' : 'Invalid authentication token' },
    401,
  );
}
