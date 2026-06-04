import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Eye, Trash2, LogOut } from 'lucide-react';
import { Role } from '../types';
import { useAppContext } from '../AppContext';

export default function OnboardingModal() {
  const {
    isOnboardingOpen,
    setIsOnboardingOpen,
    onboardName, setOnboardName,
    onboardRole, setOnboardRole,
    onboardAccessCode, setOnboardAccessCode,
    onboardError, setOnboardError,
    onboardSuccess, setOnboardSuccess,
    onboardPassword, setOnboardPassword,
    handleOnboardMember,
    triggerAutoCodeGeneration,
    editingUserId, setEditingUserId,
    editingUserName, setEditingUserName,
    editingUserRole, setEditingUserRole,
    editingUserCode, setEditingUserCode,
    editingUserError, setEditingUserError,
    handleSaveMemberEdit,
    handleDeleteMember,
    triggerEditAutoCodeGeneration,
    onboardSearchQuery, setOnboardSearchQuery,
    directoryUsers,
    currentUser,
    proxyOriginalUser,
    handleProxyLogin,
    handleLogout,
  } = useAppContext();

  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isTeamLead = (proxyOriginalUser ?? currentUser)?.role === Role.TeamLead;

  const handleDelete = async (userId: string) => {
    setDeleteError('');
    setDeleteLoading(true);
    const result = await handleDeleteMember(userId, deletePassword);
    setDeleteLoading(false);
    if (result.error) {
      setDeleteError(result.error);
    } else {
      setDeletingUserId(null);
      setDeletePassword('');
      setDeleteError('');
    }
  };

  const inputClass = 'w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neutral-400 focus:bg-white transition-all text-neutral-900';
  const selectClass = 'w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neutral-400 focus:bg-white transition-all text-neutral-900';

  const closeModal = () => {
    setIsOnboardingOpen(false);
    setOnboardError('');
    setOnboardSuccess('');
    setEditingUserId(null);
  };

  return (
    <AnimatePresence>
      {isOnboardingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm t-backdrop-active"
            onClick={closeModal}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col t-modal-active"
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-5 flex-shrink-0 border-b border-neutral-100">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-neutral-900">Credentials Management System</h3>
                <p className="text-sm text-neutral-400 mt-0.5">Provision access codes and manage team members</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-neutral-400 hover:text-neutral-900 transition-colors p-1 -mt-0.5 -mr-0.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body — single column */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-6">

              {/* Form section */}
              {editingUserId ? (
                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Edit Member</p>

                  {editingUserError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{editingUserError}</p>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="e.g. Liam Patel"
                      value={editingUserName}
                      onChange={(e) => setEditingUserName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1.5">Role</label>
                    <select
                      className={selectClass}
                      value={editingUserRole}
                      onChange={(e) => setEditingUserRole(e.target.value as Role)}
                    >
                      <option value={Role.Designer}>Designer (Upload Only)</option>
                      <option value={Role.ContentWriter}>Content Writer (Write & Edit)</option>
                      <option value={Role.TeamLead}>Team Lead (Full Workspace Key)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1.5">Access Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-mono uppercase focus:outline-none focus:border-neutral-400 focus:bg-white transition-all text-neutral-900"
                        placeholder="ECO-LEAD-59"
                        value={editingUserCode}
                        onChange={(e) => setEditingUserCode(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={triggerEditAutoCodeGeneration}
                        className="text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 rounded-xl border border-neutral-200 transition-colors"
                      >
                        Generate
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSaveMemberEdit(editingUserId)}
                      className="flex-1 bg-neutral-900 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-neutral-800 transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingUserId(null)}
                      className="text-sm text-neutral-500 hover:text-neutral-900 px-4 py-2.5 rounded-xl hover:bg-neutral-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">New Member</p>

                  {onboardError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{onboardError}</p>
                  )}
                  {onboardSuccess && (
                    <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">{onboardSuccess}</p>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="e.g. Liam Patel"
                      value={onboardName}
                      onChange={(e) => setOnboardName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1.5">Role</label>
                    <select
                      className={selectClass}
                      value={onboardRole}
                      onChange={(e) => setOnboardRole(e.target.value as Role)}
                    >
                      <option value={Role.Designer}>Designer (Upload Only)</option>
                      <option value={Role.ContentWriter}>Content Writer (Write & Edit)</option>
                      <option value={Role.TeamLead}>Team Lead (Full Workspace Key)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1.5">Access Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-mono uppercase focus:outline-none focus:border-neutral-400 focus:bg-white transition-all text-neutral-900"
                        placeholder="ECO-DESIGN-982"
                        value={onboardAccessCode}
                        onChange={(e) => setOnboardAccessCode(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={triggerAutoCodeGeneration}
                        className="text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 rounded-xl border border-neutral-200 transition-colors"
                      >
                        Generate
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1.5">Onboarding Password</label>
                    <input
                      type="password"
                      className={inputClass}
                      placeholder="Enter onboarding password"
                      value={onboardPassword}
                      onChange={(e) => setOnboardPassword(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleOnboardMember(); } }}
                      required
                    />
                    <p className="text-xs text-neutral-400 mt-1">Contact your Team Lead for the onboarding password</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOnboardMember()}
                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
                  >
                    Provision Credentials
                  </button>
                </div>
              )}

              {/* Directory section — below form */}
              <div className="space-y-3 border-t border-neutral-100 pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Directory</p>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600">
                    {directoryUsers.length} users
                  </span>
                </div>

                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                  <input
                    type="text"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400 focus:bg-white transition-all"
                    placeholder="Search by name or role..."
                    value={onboardSearchQuery}
                    onChange={(e) => setOnboardSearchQuery(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  {directoryUsers
                    .filter(u => {
                      const q = onboardSearchQuery.toLowerCase();
                      return u.username.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
                    })
                    .map(user => {
                      const isCurrent = currentUser && currentUser.id === user.id;
                      const isDeleteOpen = deletingUserId === user.id;
                      const showDeleteBtn = (!currentUser) || (isTeamLead && !proxyOriginalUser && !isCurrent);

                      return (
                        <div key={user.id} className="space-y-0">
                          <div className={`flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-100 transition-colors ${isDeleteOpen ? 'rounded-b-none' : ''} ${isCurrent ? 'bg-emerald-50/60 ring-1 ring-emerald-200' : ''}`}>
                            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-neutral-700">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-medium text-neutral-800 truncate">{user.username}</span>
                                {isCurrent && (
                                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full uppercase">You</span>
                                )}
                              </div>
                              <span className="text-xs px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 inline-block mt-0.5">
                                {user.role}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {isTeamLead && !proxyOriginalUser && !isCurrent && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsOnboardingOpen(false);
                                    handleProxyLogin(user);
                                  }}
                                  className="text-neutral-400 hover:text-indigo-600 transition-colors"
                                  title="View as this user"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUserId(user.id);
                                  setEditingUserName(user.username);
                                  setEditingUserRole(user.role);
                                  setEditingUserCode(user.accessCode);
                                }}
                                className="text-xs font-medium text-neutral-400 hover:text-neutral-900 transition-colors"
                              >
                                Edit
                              </button>
                              {showDeleteBtn && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isDeleteOpen) {
                                      setDeletingUserId(null);
                                      setDeletePassword('');
                                      setDeleteError('');
                                    } else {
                                      setDeletingUserId(user.id);
                                      setDeletePassword('');
                                      setDeleteError('');
                                    }
                                  }}
                                  className="text-neutral-300 hover:text-red-500 transition-colors"
                                  title="Remove user"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {isDeleteOpen && (
                            <div className="bg-red-50 border border-neutral-100 border-t-red-100 rounded-b-xl px-3 py-2.5 space-y-2">
                              <p className="text-xs text-red-700 font-medium">
                                Remove <span className="font-semibold">{user.username}</span>?
                              </p>
                              {deleteError && (
                                <p className="text-xs text-red-600">{deleteError}</p>
                              )}
                              <input
                                type="password"
                                className="w-full text-xs bg-white border border-red-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-400 text-neutral-900"
                                placeholder="Onboarding password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleDelete(user.id); } }}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(user.id)}
                                  disabled={deleteLoading || !deletePassword}
                                  className="text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1 rounded-lg transition-colors"
                                >
                                  {deleteLoading ? 'Removing…' : 'Remove'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setDeletingUserId(null); setDeletePassword(''); setDeleteError(''); }}
                                  className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-neutral-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <button
                type="button"
                onClick={() => { setIsOnboardingOpen(false); handleLogout(); }}
                className="text-sm text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Back to Login
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
