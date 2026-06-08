import { useState, useEffect } from 'react';
import { User } from '../types';
import { parseJSON } from '../utils/api';

export interface UseAuthReturn {
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  accessCodeInput: string;
  setAccessCodeInput: (v: string) => void;
  loginError: string;
  setLoginError: (v: string) => void;
  proxyOriginalUser: User | null;
  setProxyOriginalUser: (u: User | null) => void;
  rememberedUsers: User[];
  removeRememberedUser: (userId: string) => void;
  handleCodeLogin: (code: string) => void;
  handleLogout: () => void;
  handleProxyLogin: (targetUser: User) => void;
  handleExitProxy: () => void;
}

export function useAuth(): UseAuthReturn {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [proxyOriginalUser, setProxyOriginalUser] = useState<User | null>(null);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [rememberedUsers, setRememberedUsers] = useState<User[]>(() => {
    try { return JSON.parse(localStorage.getItem('orbitx_remembered_users') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('orbitx_remembered_users');
      if (stored) {
        const users = JSON.parse(stored);
        if (Array.isArray(users)) {
          const cleaned = users.map(({ accessCode, access_code, ...rest }: any) => rest);
          localStorage.setItem('orbitx_remembered_users', JSON.stringify(cleaned));
        }
      }
    } catch {}
  }, []);

  const rememberUserInLocalStorage = (user: User) => {
    try {
      const existing = JSON.parse(localStorage.getItem('orbitx_remembered_users') || '[]') as User[];
      const filtered = existing.filter(u => u.id !== user.id);
      filtered.unshift(user);
      localStorage.setItem('orbitx_remembered_users', JSON.stringify(filtered));
      setRememberedUsers(filtered);
    } catch (e) { /* ignore */ }
  };

  const removeRememberedUser = (userId: string) => {
    try {
      const current = JSON.parse(localStorage.getItem('orbitx_remembered_users') || '[]') as User[];
      const updated = current.filter(u => u.id !== userId);
      setRememberedUsers(updated);
      localStorage.setItem('orbitx_remembered_users', JSON.stringify(updated));
    } catch (e) { /* ignore */ }
  };

  const handleCodeLogin = async (codeStr: string) => {
    setLoginError('');
    if (!codeStr.trim()) { setLoginError('Please enter a valid unique access code.'); return; }
    try {
      const res = await fetch('/api/login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeStr })
      });
      if (res.ok) {
        const data = await parseJSON(res);
        setCurrentUser(data.user);
        localStorage.setItem('hub_user', JSON.stringify(data.user));
        if (data.token) { localStorage.setItem('hub_token', data.token); }
        rememberUserInLocalStorage(data.user);
        setAccessCodeInput('');
      } else {
        const err = await parseJSON(res);
        setLoginError(err.error || 'Invalid code');
      }
    } catch (err: any) { console.error('Login failed:', err); setLoginError(err.message || 'Connection failure.'); }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setProxyOriginalUser(null);
    localStorage.removeItem('hub_user');
    localStorage.removeItem('hub_token');
    localStorage.removeItem('hub_company');
    localStorage.removeItem('hub_campaign');
    localStorage.removeItem('hub_posting');
    localStorage.removeItem('hub_article_folder');
    localStorage.removeItem('hub_article');
  };

  const handleProxyLogin = (targetUser: User) => {
    if (!currentUser) return;
    setProxyOriginalUser(currentUser);
    setCurrentUser(targetUser);
  };

  const handleExitProxy = () => {
    if (!proxyOriginalUser) return;
    setCurrentUser(proxyOriginalUser);
    setProxyOriginalUser(null);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('hub_user');
    const storedToken = localStorage.getItem('hub_token');
    if (storedUser) {
      if (storedToken) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Failed to parse hub_user, clearing session');
          localStorage.removeItem('hub_user');
          localStorage.removeItem('hub_token');
        }
      } else {
        localStorage.removeItem('hub_user');
      }
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !currentUser) {
        const stored = localStorage.getItem('hub_user');
        const storedToken = localStorage.getItem('hub_token');
        if (stored && storedToken) {
          try { setCurrentUser(JSON.parse(stored)); } catch {}
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentUser]);

  return {
    currentUser, setCurrentUser,
    accessCodeInput, setAccessCodeInput,
    loginError, setLoginError,
    proxyOriginalUser, setProxyOriginalUser,
    rememberedUsers, removeRememberedUser,
    handleCodeLogin, handleLogout,
    handleProxyLogin, handleExitProxy,
  };
}
