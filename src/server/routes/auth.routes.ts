import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { RouteDeps } from '../types';
import { toCamel } from '../utils';
import * as v from '../middleware/validators';
import { handleValidation } from '../middleware/validate';
import { loginLimiter } from '../middleware/rateLimiter';

export default function authRoutes(deps: RouteDeps): Router {
  const router = Router();
  const { supabase } = deps;

  router.post('/login-code', loginLimiter, v.loginCode, handleValidation, async (req, res) => {
    const { code } = req.body;
    if (!code || !code.trim()) return res.status(400).json({ error: "Access Code is required" });
    const cleanCode = code.trim().toUpperCase();
    const { data, error } = await supabase.from('users').select('*').eq('access_code', cleanCode).single();
    if (error || !data) return res.status(401).json({ error: "Invalid Access Code. Check reference directory." });
    const user = toCamel(data);
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    res.json({ user, token });
  });

  return router;
}
