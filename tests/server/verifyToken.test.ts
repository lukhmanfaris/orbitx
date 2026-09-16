import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { verifyToken, bearerToken } from '../../src/server/auth/verifyToken';

const secret = 'test-secret-at-least-32-characters-long!!';

describe('bearerToken', () => {
  it('extracts token', () => expect(bearerToken('Bearer abc')).toBe('abc'));
  it('rejects missing/malformed', () => {
    expect(bearerToken(null)).toBeNull();
    expect(bearerToken('Basic abc')).toBeNull();
    expect(bearerToken('Bearer ')).toBeNull();
  });
});

describe('verifyToken', () => {
  it('accepts a valid token', () => {
    const token = jwt.sign({ id: 'u-1', username: 'ann', role: 'Designer' }, secret, { expiresIn: '1h' });
    const r = verifyToken(token, secret);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.payload.id).toBe('u-1');
  });
  it('flags expired', () => {
    const token = jwt.sign({ id: 'u-1', username: 'ann', role: 'Designer' }, secret, { expiresIn: -10 });
    expect(verifyToken(token, secret)).toEqual({ ok: false, reason: 'expired' });
  });
  it('flags bad signature and missing fields', () => {
    const bad = jwt.sign({ id: 'u-1', username: 'ann', role: 'Designer' }, 'other-secret');
    expect(verifyToken(bad, secret)).toEqual({ ok: false, reason: 'invalid' });
    const partial = jwt.sign({ id: 'u-1' }, secret);
    expect(verifyToken(partial, secret)).toEqual({ ok: false, reason: 'invalid' });
    expect(verifyToken(null, secret)).toEqual({ ok: false, reason: 'invalid' });
  });
});
