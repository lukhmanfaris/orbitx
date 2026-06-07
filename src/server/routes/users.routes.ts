import { Router } from 'express';
import { RouteDeps } from '../types';
import { toCamel, toSnakeCase } from '../utils';
import { userId as generateUserId } from '../ids';
import { User } from '../../types';
import * as v from '../middleware/validators';
import { handleValidation } from '../middleware/validate';

export default function userRoutes(deps: RouteDeps): Router {
  const router = Router();
  const { supabase } = deps;

  router.get('/users', async (req, res) => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data).map(({ accessCode, ...rest }: any) => rest));
  });

  router.post('/users', v.createUser, handleValidation, async (req, res) => {
    const { username, role, accessCode, password } = req.body;
    if (!username?.trim() || !role || !accessCode?.trim()) {
      return res.status(400).json({ error: "Username, designated position, and access code are required." });
    }
    if (password !== process.env.ONBOARD_PASSWORD) {
      return res.status(400).json({ error: "Access Denied: Invalid Onboarding Security Password." });
    }
    const cleanCode = accessCode.trim().toUpperCase();
    const { data: existing } = await supabase.from('users').select('id, username').eq('access_code', cleanCode).single();
    if (existing) {
      const existingUser = toCamel(existing) as User;
      return res.status(400).json({ error: `Access code '${cleanCode}' is already assigned to ${existingUser.username}.` });
    }
    const newUser = {
      id: generateUserId(),
      username: username.trim(),
      role,
      accessCode: cleanCode
    };
    const { data, error } = await supabase.from('users').insert([toSnakeCase(newUser)]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(toCamel(data));
  });

  router.put('/users/:id', v.updateUser, handleValidation, async (req, res) => {
    const { id } = req.params;
    const { username, role, accessCode } = req.body;

    const { data: user, error: fError } = await supabase.from('users').select('*').eq('id', id).single();
    if (fError || !user) return res.status(404).json({ error: "User not found" });

    const updates: Record<string, any> = {};
    if (username !== undefined) updates.username = username.trim();
    if (role !== undefined) updates.role = role;
    if (accessCode !== undefined) {
      const cleanCode = accessCode.trim().toUpperCase();
      const { data: existing } = await supabase.from('users').select('id').eq('access_code', cleanCode).neq('id', id).single();
      if (existing) return res.status(400).json({ error: `Access code '${cleanCode}' belongs to another user.` });
      updates.accessCode = cleanCode;
    }

    const { data, error } = await supabase.from('users').update(toSnakeCase(updates)).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { password } = req.body as { password?: string };
    const onboardPassword = process.env.ONBOARD_PASSWORD;
    if (!onboardPassword || !password || password !== onboardPassword) {
      return res.status(403).json({ error: "Invalid onboarding password" });
    }
    const { data: user, error: fError } = await supabase.from('users').select('id').eq('id', id).single();
    if (fError || !user) return res.status(404).json({ error: "User not found" });

    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "User deleted" });
  });

  return router;
}
