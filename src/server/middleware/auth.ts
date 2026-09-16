import { Request, Response, NextFunction } from 'express';
import { bearerToken, verifyToken } from '../auth/verifyToken';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

const PUBLIC_PATHS: { path: string; methods?: string[] }[] = [
  { path: '/login-code', methods: ['POST'] },
  { path: '/login-directory', methods: ['GET'] },
  { path: '/users', methods: ['POST'] },
];

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const isPublic = PUBLIC_PATHS.some(p => {
    if (req.path !== p.path) return false;
    if (p.methods && !p.methods.includes(req.method)) return false;
    return true;
  });
  if (isPublic) return next();

  const token = bearerToken(req.headers['authorization']);
  if (!token) {
    console.warn(`[Auth] Missing/malformed Authorization header on ${req.method} ${req.path}`);
    return res.status(401).json({ error: 'Authentication required' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[Auth] JWT_SECRET is not set in environment');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const result = verifyToken(token, secret);
  if (result.ok !== true) {
    if (result.reason === 'expired') {
      console.warn(`[Auth] Token expired on ${req.method} ${req.path}`);
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    console.warn(`[Auth] Token verification failed on ${req.method} ${req.path}`);
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  req.userId = result.payload.id;
  req.userRole = result.payload.role;
  next();
}
