import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Search, Eye, Trash2, LogOut } from 'lucide-react';
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

  return (
    <AnimatePresence>
      {isOnboardingOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4 flex-shrink-0">
              <div className="flex items-center space-x-2 text-[#171717]">
                <User className="w-5 h-5 text-emerald-600 font-bold" />
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight">Onboarding & Credentials Center</h3>
                  <p className="text-[10px] text-neutral-500 font-mono">PROVISION PERMANENT CODES & TEAM ASSIGNMENTS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOnboardingOpen(false);
                  setOnboardError('');
                  setOnboardSuccess('');
                  setEditingUserId(null);
                }}
                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-500 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 pr-2 scrollbar-thin">
              
              <div className="space-y-4">
                {editingUserId ? (
                  <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase font-mono text-zinc-650 flex items-center space-x-1">
                        <span>Modify Member Account</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingUserId(null)}
                        className="text-[10px] font-bold text-neutral-550 underline"
                      >
                        Switch back to New Member
                      </button>
                    </div>

                    {editingUserError && (
                      <p className="text-xs text-red-650 bg-red-50 p-2 rounded border border-red-200 font-semibold">{editingUserError}</p>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase font-mono mb-1">Full Name / Identifier</label>
                        <input
                          type="text"
                          className="w-full text-xs p-2 bg-white border border-[#d4d4d4] rounded focus:outline-none focus:border-neutral-900 text-neutral-900"
                          placeholder="e.g. Liam Patel"
                          value={editingUserName}
                          onChange={(e) => setEditingUserName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase font-mono mb-1">Position Clearance</label>
                        <select
                          className="w-full text-xs p-2 bg-white border border-[#d4d4d4] rounded focus:outline-none text-neutral-900"
                          value={editingUserRole}
                          onChange={(e) => setEditingUserRole(e.target.value as Role)}
                        >
                          <option value={Role.Designer}>Designer (Upload Only)</option>
                          <option value={Role.ContentWriter}>Content Writer (Write & Edit)</option>
                          <option value={Role.TeamLead}>Team Lead (Full Workspace Key)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase font-mono mb-1">assigned unique access code</label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            className="flex-1 text-xs p-2 bg-white border border-[#d4d4d4] rounded font-mono uppercase focus:outline-none text-neutral-900"
                            placeholder="ECO-LEAD-59"
                            value={editingUserCode}
                            onChange={(e) => setEditingUserCode(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={triggerEditAutoCodeGeneration}
                            className="text-[10px] font-bold bg-neutral-100 hover:bg-neutral-205 text-neutral-800 px-2 rounded border border-neutral-300"
                          >
                            Generate
                          </button>
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleSaveMemberEdit(editingUserId)}
                        className="flex-1 bg-black text-white text-xs font-bold py-2 rounded hover:bg-neutral-800"
                        >
                          Save Changes
                        </button>
                      <button
                        type="button"
                        onClick={() => setEditingUserId(null)}
                        className="bg-white border border-neutral-300 text-neutral-700 text-xs px-3 py-2 rounded hover:bg-neutral-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/80 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-tight">Onboard New Team Member</h4>
                      <p className="text-[10px] text-neutral-500">Create long-duration credentials and map their physical post.</p>
                    </div>

                    {onboardError && (
                      <p className="text-xs text-red-650 bg-red-50 p-2 rounded border border-red-200 font-semibold">{onboardError}</p>
                    )}

                    {onboardSuccess && (
                      <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200 font-semibold">{onboardSuccess}</p>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase font-mono mb-1">Full Name / Identifier</label>
                        <input
                          type="text"
                          className="w-full text-xs p-2 bg-white border border-[#d4d4d4] rounded focus:outline-none focus:border-neutral-900 text-neutral-900"
                          placeholder="e.g. Liam Patel"
                          value={onboardName}
                          onChange={(e) => setOnboardName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase font-mono mb-1">Position Clearance</label>
                        <select
                          className="w-full text-xs p-2 bg-white border border-[#d4d4d4] rounded focus:outline-none text-neutral-900"
                          value={onboardRole}
                          onChange={(e) => setOnboardRole(e.target.value as Role)}
                        >
                          <option value={Role.Designer}>Designer (Upload Only)</option>
                          <option value={Role.ContentWriter}>Content Writer (Write & Edit)</option>
                          <option value={Role.TeamLead}>Team Lead (Full Workspace Key)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase font-mono mb-1">Assigned Unique Access Code</label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            className="flex-1 text-xs p-2 bg-white border border-[#d4d4d4] rounded font-mono uppercase focus:outline-none text-neutral-900 text-neutral-950 font-bold"
                            placeholder="e.g. ECO-DESIGN-982"
                            value={onboardAccessCode}
                            onChange={(e) => setOnboardAccessCode(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={triggerAutoCodeGeneration}
                            className="text-[10px] font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-2.5 py-1.5 rounded border border-neutral-300 transition-colors"
                          >
                            ✨ Auto-generate
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase font-mono mb-1">Onboarding Security Password</label>
                        <input
                          type="password"
                          className="w-full text-xs p-2 bg-white border border-[#d4d4d4] rounded focus:outline-none focus:border-neutral-900 text-neutral-900"
                          placeholder="Enter onboarding password"
                          value={onboardPassword}
                          onChange={(e) => setOnboardPassword(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleOnboardMember(); } }}
                          required
                        />
                        <p className="text-[9px] text-neutral-400 mt-1">Contact your Team Lead for the onboarding password</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOnboardMember()}
                        className="w-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold py-2 rounded transition-all mt-2"
                      >
                        Provision Permanent Credentials
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-[#f0fdf4] border border-emerald-200/60 rounded-xl space-y-1.5">
                  <h5 className="text-[11px] font-bold text-emerald-800 uppercase font-mono tracking-wider">🔒 Long-Term Security Model</h5>
                  <p className="text-[10px] text-emerald-700 leading-snug">
                    Authorized members use these permanent unique codes to log in from any peripheral. This completely avoids gatekeeping delays while establishing perfect company segregation and credential safety.
                  </p>
                </div>
              </div>

              <div className="flex flex-col h-full space-y-3.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-neutral-800 uppercase tracking-wider font-mono">
                      📋 Cluster Access Directory
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 bg-neutral-100 border border-neutral-200 rounded-full font-mono text-neutral-600">
                      Total: {directoryUsers.length} Users
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
                    <input
                      type="text"
                      className="w-full text-xs pl-8 pr-4 py-2 bg-neutral-100 border border-[#d4d4d4] rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white text-neutral-950"
                      placeholder="Search directory by name or role..."
                      value={onboardSearchQuery}
                      onChange={(e) => setOnboardSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[360px] pr-1 scrollbar-thin">
                  {directoryUsers
                    .filter(u => {
                      const q = onboardSearchQuery.toLowerCase();
                      return (
                        u.username.toLowerCase().includes(q) ||
                        u.role.toLowerCase().includes(q)
                      );
                    })
                    .map(user => {
                      const isCurrent = currentUser && currentUser.id === user.id;
                      const isDeleteOpen = deletingUserId === user.id;
                      const showDeleteBtn = (!currentUser) || (isTeamLead && !proxyOriginalUser && !isCurrent);

                      return (
                        <div key={user.id} className="space-y-0">
                          <div
                            className={`group p-3 rounded-xl border transition-all flex items-start justify-between gap-2 bg-white ${
                              isDeleteOpen ? 'rounded-b-none border-b-0' : ''
                            } ${isCurrent ? 'border-emerald-500 shadow-xs ring-1 ring-emerald-500/20' : 'border-neutral-200'}`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-normal text-xs text-neutral-800 truncate block">
                                  {user.username}
                                </span>
                                {isCurrent && (
                                  <span className="bg-emerald-100 text-emerald-800 text-[8px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                                    You
                                  </span>
                                )}
                              </div>
                              <p className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 mt-0.5">{user.role}</p>
                            </div>

                            <div className="flex items-center space-x-2">
                              {isTeamLead && !proxyOriginalUser && !isCurrent && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsOnboardingOpen(false);
                                    handleProxyLogin(user);
                                  }}
                                  className="text-[9.5px] font-bold text-indigo-700 hover:text-indigo-950 hover:underline flex items-center space-x-1 bg-indigo-50/80 hover:bg-indigo-50 px-2 py-1 rounded"
                                  title="View the workspace as this user (read-only)"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View as this user</span>
                                </button>
                              )}

                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingUserId(user.id);
                                    setEditingUserName(user.username);
                                    setEditingUserRole(user.role);
                                    setEditingUserCode(user.accessCode);
                                  }}
                                  className="text-[9.5px] font-bold text-neutral-600 hover:text-neutral-950 hover:underline"
                                >
                                  Edit
                                </button>
                                {showDeleteBtn && (
                                  <>
                                    <span className="text-neutral-300">|</span>
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
                                      className="text-neutral-400 hover:text-red-500 transition-all"
                                      title="Remove user"
                                    >
                                      <Trash2 className="w-[14px] h-[14px]" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {isDeleteOpen && (
                            <div className="bg-red-50 border border-neutral-200 border-t-red-100 rounded-b-xl px-3 py-2.5 space-y-2">
                              <p className="text-[10px] text-red-700 font-medium">
                                Confirm removal of <span className="font-bold">{user.username}</span>
                              </p>
                              {deleteError && (
                                <p className="text-[9.5px] text-red-600 font-semibold">{deleteError}</p>
                              )}
                              <input
                                type="password"
                                className="w-full text-xs p-1.5 bg-white border border-red-200 rounded focus:outline-none focus:border-red-400 text-neutral-900"
                                placeholder="Onboarding password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleDelete(user.id); } }}
                                autoFocus
                              />
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(user.id)}
                                  disabled={deleteLoading || !deletePassword}
                                  className="text-[9.5px] font-bold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-2.5 py-1 rounded transition-colors"
                                >
                                  {deleteLoading ? 'Removing…' : 'Remove'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setDeletingUserId(null); setDeletePassword(''); setDeleteError(''); }}
                                  className="text-[9.5px] font-bold text-neutral-500 hover:text-neutral-800"
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
            
            <div className="border-t border-neutral-100 pt-3 mt-4 flex items-center justify-between flex-shrink-0 text-[10px] text-neutral-400">
              <span className="font-mono">Ready credentials system - Port 3000 Node</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setIsOnboardingOpen(false); handleLogout(); }}
                  className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-3 h-3" />
                  Back to Login
                </button>
                <button
                  type="button"
                  onClick={() => setIsOnboardingOpen(false)}
                  className="bg-neutral-900 hover:bg-black text-white text-xs font-bold px-4 py-1.5 rounded transition-colors"
                >
                  Close Center
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
