import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

const PUBLIC_PATHS = ['/login-code'];

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  console.log(`[AUTH] ${req.method} ${req.path}`);

  if (PUBLIC_PATHS.some(p => req.path === p)) {
    console.log(`[AUTH] ${req.path} is public, skipping`);
    return next();
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log(`[AUTH] REJECT ${req.path}: ${authHeader ? 'malformed header' : 'missing header'}`);
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log(`[AUTH] REJECT ${req.path}: empty token after Bearer split`);
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (!decoded.id || !decoded.username || !decoded.role) {
      console.log(`[AUTH] REJECT ${req.path}: missing fields in payload. id=${decoded.id} username=${decoded.username} role=${decoded.role}`);
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    const tokenAge = Date.now() - (decoded.issuedAt || 0);
    if (tokenAge > 7 * 24 * 60 * 60 * 1000) {
      console.log(`[AUTH] REJECT ${req.path}: token expired. age=${tokenAge}ms (${(tokenAge / 3600000).toFixed(1)}h)`);
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    console.log(`[AUTH] OK ${req.path}: user=${decoded.username} role=${decoded.role}`);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (e) {
    console.log(`[AUTH] REJECT ${req.path}: JSON parse failed. token_prefix=${token.substring(0, 30)}...`);
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
}
