import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

const PUBLIC_PATHS: { path: string; methods?: string[] }[] = [
  { path: '/login-code' },
  { path: '/users', methods: ['POST', 'GET'] },
];

interface TokenPayload {
  id: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const isPublic = PUBLIC_PATHS.some(p => {
    if (req.path !== p.path) return false;
    if (p.methods && !p.methods.includes(req.method)) return false;
    return true;
  });

  if (isPublic) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn(`[Auth] Missing/malformed Authorization header on ${req.method} ${req.path}. Headers received:`, Object.keys(req.headers));
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.warn(`[Auth] Empty token in Authorization header on ${req.method} ${req.path}`);
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[Auth] JWT_SECRET is not set in environment');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    const decoded = jwt.verify(token, secret) as TokenPayload;

    if (!decoded.id || !decoded.username || !decoded.role) {
      console.warn(`[Auth] Token payload missing required fields on ${req.method} ${req.path}. Decoded:`, { id: !!decoded.id, username: !!decoded.username, role: !!decoded.role });
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      console.warn(`[Auth] Token expired on ${req.method} ${req.path}`);
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    console.error(`[Auth] Token verification failed on ${req.method} ${req.path}:`, err.message);
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
}
