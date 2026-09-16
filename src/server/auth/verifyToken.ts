import jwt from 'jsonwebtoken';

export interface TokenPayload {
  id: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export type VerifyResult =
  | { ok: true; payload: TokenPayload }
  | { ok: false; reason: 'expired' | 'invalid' };

export function bearerToken(authHeader: string | null | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  return token || null;
}

export function verifyToken(token: string | null | undefined, secret: string): VerifyResult {
  if (!token) return { ok: false, reason: 'invalid' };
  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    if (!decoded.id || !decoded.username || !decoded.role) return { ok: false, reason: 'invalid' };
    return { ok: true, payload: decoded };
  } catch (err: any) {
    return { ok: false, reason: err?.name === 'TokenExpiredError' ? 'expired' : 'invalid' };
  }
}
