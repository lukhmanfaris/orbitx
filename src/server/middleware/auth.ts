import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

const PUBLIC_PATHS = ['/api/login-code'];

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (PUBLIC_PATHS.some(p => req.path === p)) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (!decoded.id || !decoded.username || !decoded.role) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    const tokenAge = Date.now() - (decoded.issuedAt || 0);
    if (tokenAge > 7 * 24 * 60 * 60 * 1000) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
}
