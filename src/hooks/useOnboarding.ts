import React, { useState, useEffect } from 'react';
import { Role, User } from '../types';
import { ToastType } from './useToast';
import { apiGet, apiPost, apiPut, apiDelete, ApiError, clearSessionAndReload } from '../utils/api';

export interface UseOnboardingParams {
  currentUser: User | null;
  addToast?: (type: ToastType, title: string, message: string) => void;
}

export interface UseOnboardingReturn {
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (v: boolean) => void;
  directoryUsers: User[];
  setDirectoryUsers: (u: User[]) => void;
  onboardSearchQuery: string;
  setOnboardSearchQuery: (v: string) => void;
  onboardName: string;
  setOnboardName: (v: string) => void;
  onboardRole: Role;
  setOnboardRole: (v: Role) => void;
  onboardAccessCode: string;
  setOnboardAccessCode: (v: string) => void;
  onboardError: string;
  setOnboardError: (v: string) => void;
  onboardSuccess: string;
  setOnboardSuccess: (v: string) => void;
  onboardPassword: string;
  setOnboardPassword: (v: string) => void;
  editingUserId: string | null;
  setEditingUserId: (id: string | null) => void;
  editingUserName: string;
  setEditingUserName: (v: string) => void;
  editingUserRole: Role;
  setEditingUserRole: (v: Role) => void;
  editingUserCode: string;
  setEditingUserCode: (v: string) => void;
  editingUserError: string;
  setEditingUserError: (v: string) => void;
  handleOnboardMember: (e?: React.FormEvent) => void;
  handleSaveMemberEdit: (userId: string) => void;
  handleDeleteMember: (userId: string, password: string) => Promise<{ error?: string }>;
  triggerAutoCodeGeneration: () => void;
  triggerEditAutoCodeGeneration: () => void;
  fetchDirectoryInfo: () => void;
}

const autoGenerateCode = (roleName: string) => {
  const roleRef = roleName === Role.Designer ? 'DESIGN' : roleName === Role.ContentWriter ? 'WRITER' : 'LEAD';
  return `BDW-${roleRef}-${Math.floor(100 + Math.random() * 900)}`;
};

export function useOnboarding({ currentUser, addToast }: UseOnboardingParams): UseOnboardingReturn {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [directoryUsers, setDirectoryUsers] = useState<User[]>([]);
  const [onboardSearchQuery, setOnboardSearchQuery] = useState('');
  const [onboardName, setOnboardName] = useState('');
  const [onboardRole, setOnboardRole] = useState<Role>(Role.Designer);
  const [onboardAccessCode, setOnboardAccessCode] = useState('');
  const [onboardError, setOnboardError] = useState('');
  const [onboardSuccess, setOnboardSuccess] = useState('');
  const [onboardPassword, setOnboardPassword] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState('');
  const [editingUserRole, setEditingUserRole] = useState<Role>(Role.Designer);
  const [editingUserCode, setEditingUserCode] = useState('');
  const [editingUserError, setEditingUserError] = useState('');

  const fetchDirectoryInfo = () => {
    apiGet<User[]>('/api/users').then(setDirectoryUsers).catch((err) => {
      if (err instanceof ApiError && err.status === 401) {
        if (currentUser) {
          clearSessionAndReload();
        }
      } else {
        console.error('Failed to fetch directory:', err);
      }
    });
  };

  useEffect(() => {
    fetchDirectoryInfo();
  }, [isOnboardingOpen]);

  const triggerAutoCodeGeneration = () => { setOnboardAccessCode(autoGenerateCode(onboardRole)); };
  const triggerEditAutoCodeGeneration = () => { setEditingUserCode(autoGenerateCode(editingUserRole)); };

  const handleOnboardMember = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setOnboardError(''); setOnboardSuccess('');
    if (!onboardName.trim()) { setOnboardError('Name/Username is required.'); return; }
    if (!onboardAccessCode.trim()) { setOnboardError('Access code is required. Try auto-generating one.'); return; }
    if (!onboardPassword.trim()) { setOnboardError('Onboarding security password is required.'); return; }
    try {
      const newUser = await apiPost<User>('/api/users', { username: onboardName, role: onboardRole, accessCode: onboardAccessCode, password: onboardPassword });
      setDirectoryUsers(prev => [...prev, newUser]);
      setOnboardName(''); setOnboardRole(Role.Designer); setOnboardAccessCode(''); setOnboardPassword('');
      setOnboardError(''); setOnboardSuccess('');
      addToast?.('success', 'User registered', `${onboardName} has been added as ${onboardRole}`);
    } catch (err: any) {
      console.error('Onboarding failed:', err);
      if (err instanceof ApiError && err.status === 401) {
        clearSessionAndReload();
        return;
      }
      setOnboardError(err.message || 'Network transmission error.');
      addToast?.('error', 'Failed', err.message);
    }
  };

  const handleSaveMemberEdit = async (userId: string) => {
    setEditingUserError('');
    if (!editingUserName.trim()) { setEditingUserError('Name is required.'); return; }
    if (!editingUserCode.trim()) { setEditingUserError('Access code is required.'); return; }
    try {
      const updatedUser = await apiPut<User>(`/api/users/${userId}`, { username: editingUserName, role: editingUserRole, accessCode: editingUserCode });
      setDirectoryUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      setEditingUserId(null);
      addToast?.('success', 'Member Updated', `${editingUserName}'s profile has been saved.`);
      if (currentUser && currentUser.id === userId) {
        localStorage.setItem('hub_user', JSON.stringify(updatedUser));
      }
    } catch (err: any) {
      console.error('Failed to save member:', err);
      if (err instanceof ApiError && err.status === 401) {
        clearSessionAndReload();
        return;
      }
      setEditingUserError(err.message || 'Network transmission error.');
    }
  };

  const handleDeleteMember = async (userId: string, password: string): Promise<{ error?: string }> => {
    try {
      const deletedUser = directoryUsers.find(u => u.id === userId);
      await apiDelete(`/api/users/${userId}`, { password });
      setDirectoryUsers(prev => prev.filter(u => u.id !== userId));
      addToast?.('success', 'Member Removed', `${deletedUser?.username || 'User'} has been removed from the team.`);
      if (currentUser && currentUser.id === userId) {
        addToast?.('warning', 'Self-Account Deleted', 'You deleted your own account. Changes will take effect on next session.');
      }
      return {};
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        clearSessionAndReload();
        return { error: 'Session expired. Redirecting to login...' };
      }
      addToast?.('error', 'Failed', err.message || 'Network error.');
      return { error: err.message || 'Network error.' };
    }
  };

  return {
    isOnboardingOpen, setIsOnboardingOpen,
    directoryUsers, setDirectoryUsers,
    onboardSearchQuery, setOnboardSearchQuery,
    onboardName, setOnboardName,
    onboardRole, setOnboardRole,
    onboardAccessCode, setOnboardAccessCode,
    onboardError, setOnboardError,
    onboardSuccess, setOnboardSuccess,
    onboardPassword, setOnboardPassword,
    editingUserId, setEditingUserId,
    editingUserName, setEditingUserName,
    editingUserRole, setEditingUserRole,
    editingUserCode, setEditingUserCode,
    editingUserError, setEditingUserError,
    handleOnboardMember, handleSaveMemberEdit, handleDeleteMember,
    triggerAutoCodeGeneration, triggerEditAutoCodeGeneration,
    fetchDirectoryInfo,
  };
}
