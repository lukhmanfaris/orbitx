import React, { useRef, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Layers, User, LogOut, Users, Bell, Settings, Search, ArrowLeftRight, Pencil, Image, CheckCircle, X } from 'lucide-react';
import { AppContext, useAppState } from './AppContext';
import LoginScreen from './components/LoginScreen';
import CompanySelector from './components/CompanySelector';
import WorkspaceDashboard from './components/WorkspaceDashboard';
import OnboardingModal from './components/OnboardingModal';
import ErrorBoundary from './components/common/ErrorBoundary';
import ToastContainer from './components/common/ToastContainer';
import { getPresetIconById } from './constants/brandIcons';
import { apiPut, parseJSON } from './utils/api';
import { AssetStatus } from './types';
import { NotificationItem } from './components/sidebar/SidebarNotifications';

const springModal = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 8 },
  transition: { type: 'spring', stiffness: 400, damping: 30 },
} as const;

function EditBrandModal({ isOpen, onClose, companyName, companyDescription, companyId, onSaved }: {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  companyDescription: string;
  companyId: string;
  onSaved: (updated: any) => void;
}) {
  const [name, setName] = useState(companyName);
  const [description, setDescription] = useState(companyDescription);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(companyName);
      setDescription(companyDescription);
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [isOpen, companyName, companyDescription]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const updated = await apiPut(`/api/companies/${companyId}`, { name: name.trim(), description: description.trim() });
      onSaved(updated);
      onClose();
    } catch (err) {
      console.error('Failed to update company', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            {...springModal}
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold tracking-tight text-neutral-900">Edit Brand</h3>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Brand Name</label>
                <input
                  ref={nameRef}
                  type="text"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neutral-400 focus:bg-white transition-all"
                  placeholder="Brand name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neutral-400 focus:bg-white transition-all resize-none"
                  placeholder="Brief description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <motion.button
                type="button"
                onClick={onClose}
                whileTap={{ scale: 0.97 }}
                className="text-sm text-neutral-500 hover:text-neutral-900 px-4 py-2 rounded-xl hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                type="button"
                onClick={handleSave}
                disabled={!name.trim() || saving}
                whileTap={{ scale: 0.97 }}
                className="bg-neutral-900 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ProfileModal({ isOpen, onClose, username, role, accessCode }: {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  role: string;
  accessCode: string;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            {...springModal}
            className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold tracking-tight text-neutral-900">My Profile</h3>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Name</span>
                <span className="text-sm font-medium text-neutral-900">{username}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Role</span>
                <span className="text-sm font-medium text-neutral-900">{role}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Access Code</span>
                <span className="text-sm font-mono font-medium text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">{accessCode}</span>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <motion.button
                type="button"
                onClick={onClose}
                whileTap={{ scale: 0.97 }}
                className="bg-neutral-900 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-neutral-800 transition-colors"
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  const ctx = useAppState();

  const {
    currentUser, setCurrentCompany, setSelectedCampaignId, setSelectedPostingId,
    currentCompany, handleLogout,
    getBrandBadgeClass,
    proxyOriginalUser, handleExitProxy,
    toasts, removeToast,
    setIsOnboardingOpen,
    campaigns, articleFolders, setSelectedArticleFolderId, setShowArticlesOverview, setSelectedArticleId,
    setAvailableCompanies,
    postingFolders, assets,
    handleLogoUpload,
  } = ctx;

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const [isEditBrandOpen, setIsEditBrandOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifyPrefs, setNotifyPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orbitx_notify_prefs') || '{"assetStatus":true}'); }
    catch { return { assetStatus: true }; }
  });

  const bellRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setIsNotificationsOpen(false); setIsSettingsOpen(false); }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const headerSearchResults = useMemo(() => {
    if (!headerSearch.trim()) return [];
    const q = headerSearch.toLowerCase();
    const res: { id: string, name: string, type: 'campaign' | 'folder' }[] = [];
    campaigns.forEach(c => {
      if (c.name.toLowerCase().includes(q)) res.push({ id: c.id, name: c.name, type: 'campaign' });
    });
    articleFolders.forEach(f => {
      if (f.name.toLowerCase().includes(q)) res.push({ id: f.id, name: f.name, type: 'folder' });
    });
    return res.slice(0, 5);
  }, [headerSearch, campaigns, articleFolders]);

  const notifications = useMemo<NotificationItem[]>(() => {
    if (!currentCompany) return [];
    const items: NotificationItem[] = [];
    const now = new Date();
    const staleCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    assets.forEach(a => {
      if (a.status === AssetStatus.Drafting || a.status === AssetStatus.Refining) {
        const updated = new Date(a.updatedAt || a.createdAt);
        if (updated < staleCutoff) {
          const posting = postingFolders.find(p => p.id === a.postingFolderId);
          const campaign = campaigns.find(c => c.id === posting?.campaignId);
          items.push({
            id: `n-stale-${a.id}`,
            message: `${a.captionText.substring(0, 40) || 'Untitled asset'} still in ${a.status.toLowerCase()}`,
            postingFolderId: a.postingFolderId,
            campaignId: campaign?.id || '',
            type: 'stale',
          });
        }
      }
      if (a.status === AssetStatus.Ready && a.scheduledDate) {
        const schedDate = new Date(a.scheduledDate);
        if (schedDate < now) {
          const posting = postingFolders.find(p => p.id === a.postingFolderId);
          const campaign = campaigns.find(c => c.id === posting?.campaignId);
          items.push({
            id: `n-past-${a.id}`,
            message: `${a.captionText.substring(0, 40) || 'Untitled asset'} was scheduled for ${schedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            postingFolderId: a.postingFolderId,
            campaignId: campaign?.id || '',
            type: 'past',
          });
        }
      }
    });
    return items.slice(0, 10);
  }, [assets, campaigns, postingFolders, currentCompany]);

  const toggleNotifyPrefs = () => {
    const updated = { ...notifyPrefs, assetStatus: !notifyPrefs.assetStatus };
    setNotifyPrefs(updated);
    localStorage.setItem('orbitx_notify_prefs', JSON.stringify(updated));
  };

  const handleBrandSaved = (updated: any) => {
    setCurrentCompany(updated);
    setAvailableCompanies(ctx.availableCompanies.map(c => c.id === updated.id ? updated : c));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentCompany) {
      handleLogoUpload(currentCompany.id, e);
      setIsSettingsOpen(false);
    }
  };

  const handleNotificationClick = (n: NotificationItem) => {
    if (n.campaignId) setSelectedCampaignId(n.campaignId);
    if (n.postingFolderId) setSelectedPostingId(n.postingFolderId);
    setSelectedArticleFolderId('');
    setSelectedArticleId(null);
    setShowArticlesOverview(false);
    setIsNotificationsOpen(false);
  };

  return (
    <AppContext.Provider value={ctx}>
      <div className="min-h-screen bg-[#fafafa] text-[#171717] font-sans flex flex-col selection:bg-neutral-800 selection:text-white">
        {currentUser && <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-neutral-200/60 px-4 sm:px-6 py-2.5 flex flex-row items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 cursor-pointer" onClick={() => { if (currentCompany) { setSelectedCampaignId(''); setSelectedPostingId(''); setSelectedArticleFolderId(''); setSelectedArticleId(null); setShowArticlesOverview(false); } }}>
            {currentCompany ? (
              <div className="w-8 h-8 bg-transparent rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                {currentCompany.logoType === 'upload' && currentCompany.logoData ? (
                  <img src={currentCompany.logoData} alt={currentCompany.name} className="w-full h-full object-contain" />
                ) : currentCompany.logoType === 'icon' && currentCompany.logoData ? (
                  (() => { const Icon = getPresetIconById(currentCompany.logoData); return Icon ? <Icon className="w-5 h-5 text-neutral-700" /> : <Building2 className="w-5 h-5 text-neutral-700" />; })()
                ) : currentCompany.logoUrl ? (
                  <img src={currentCompany.logoUrl} alt={currentCompany.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-8 h-8 bg-neutral-900 text-white rounded-lg flex items-center justify-center">
                    <span className="text-[10px] font-black font-mono">{currentCompany.logoText || currentCompany.name.substring(0, 2).toUpperCase()}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-8 h-8 bg-neutral-900 rounded-lg text-white flex-shrink-0 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0 hidden sm:block">
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-extrabold tracking-tight text-neutral-900 uppercase truncate">
                  {currentCompany ? (currentCompany.logoText || currentCompany.name) : 'MYDATA GROUP'}
                </h1>
                {currentCompany && (
                  <span className="bg-neutral-100 text-neutral-500 text-[10px] px-2 py-0.5 rounded-md font-medium uppercase tracking-wider">
                    Active Subsidiary
                  </span>
                )}
              </div>
            </div>
            <div className="sm:hidden min-w-0">
              <h1 className="text-xs font-extrabold tracking-tight text-neutral-900 uppercase truncate">
                {currentCompany ? (currentCompany.logoText || currentCompany.name) : 'ORBITX'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {currentCompany && (
              <div className="relative hidden md:block">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-48 focus:w-64 bg-neutral-100 border-0 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:bg-neutral-200 transition-all duration-200"
                    value={headerSearch}
                    onChange={(e) => setHeaderSearch(e.target.value)}
                  />
                </div>
                {headerSearch && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden z-50">
                    {headerSearchResults.length > 0 ? (
                      headerSearchResults.map(item => (
                        <button
                          key={`${item.type}-${item.id}`}
                          onClick={() => {
                            if (item.type === 'campaign') {
                              setSelectedCampaignId(item.id);
                              setSelectedPostingId('');
                            } else {
                              setSelectedArticleFolderId(item.id);
                              setSelectedCampaignId('');
                              setSelectedPostingId('');
                              setSelectedArticleId(null);
                              setShowArticlesOverview(false);
                            }
                            setHeaderSearch('');
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                        >
                          {item.type === 'campaign' ? <Layers className="w-3.5 h-3.5 text-neutral-400" /> : <Building2 className="w-3.5 h-3.5 text-neutral-400" />}
                          <span className="truncate">{item.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-3 text-sm text-neutral-500 text-center">No results found</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentCompany && (
              <>
                <div className="relative" ref={bellRef}>
                  <button type="button" onClick={() => { setIsSettingsOpen(false); setIsNotificationsOpen(!isNotificationsOpen); }} className="text-neutral-500 hover:text-neutral-900 p-2 rounded-lg hover:bg-neutral-100 transition-colors relative">
                    <Bell className="w-4 h-4" />
                    {notifications.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    )}
                  </button>
                  <AnimatePresence>
                    {isNotificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-1 w-72 bg-white border border-neutral-100 rounded-xl shadow-lg overflow-hidden z-50"
                      >
                        <div className="px-3 py-2 border-b border-neutral-100">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Notifications</p>
                        </div>
                        <div className="max-h-64 overflow-y-auto p-1.5">
                          {notifications.length === 0 ? (
                            <div className="flex items-center gap-2 px-3 py-4 text-neutral-400 justify-center">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm">All caught up</span>
                            </div>
                          ) : (
                            notifications.map(n => (
                              <button
                                key={n.id}
                                type="button"
                                onClick={() => handleNotificationClick(n)}
                                className="w-full text-left p-2.5 rounded-lg hover:bg-neutral-50 transition-colors"
                              >
                                <p className="text-xs text-neutral-600 leading-relaxed">{n.message}</p>
                              </button>
                            ))
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <div className="border-t border-neutral-100 px-3 py-2">
                            <button
                              type="button"
                              onClick={() => { setIsNotificationsOpen(false); }}
                              className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                            >
                              View all in sidebar
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative" ref={settingsRef}>
                  <button type="button" onClick={() => { setIsNotificationsOpen(false); setIsSettingsOpen(!isSettingsOpen); }} className="text-neutral-500 hover:text-neutral-900 p-2 rounded-lg hover:bg-neutral-100 transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                  <AnimatePresence>
                    {isSettingsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-1 bg-white rounded-xl shadow-lg border border-neutral-100 p-2 min-w-[200px] z-50"
                      >
                        {currentCompany && (
                          <>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-3 py-1">Company</p>
                            <button
                              type="button"
                              onClick={() => { setIsEditBrandOpen(true); setIsSettingsOpen(false); }}
                              className="w-full text-left text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg px-3 py-2 cursor-pointer flex items-center gap-2 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5 text-neutral-400" />
                              Edit Brand
                            </button>
                            <button
                              type="button"
                              onClick={() => { logoInputRef.current?.click(); setIsSettingsOpen(false); }}
                              className="w-full text-left text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg px-3 py-2 cursor-pointer flex items-center gap-2 transition-colors"
                            >
                              <Image className="w-3.5 h-3.5 text-neutral-400" />
                              Change Logo
                            </button>
                            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                            <div className="border-t border-neutral-100 my-1" />
                          </>
                        )}

                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-3 py-1">Account</p>
                        <button
                          type="button"
                          onClick={() => { setIsProfileOpen(true); setIsSettingsOpen(false); }}
                          className="w-full text-left text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg px-3 py-2 cursor-pointer flex items-center gap-2 transition-colors"
                        >
                          <User className="w-3.5 h-3.5 text-neutral-400" />
                          My Profile
                        </button>
                        <div className="border-t border-neutral-100 my-1" />

                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-3 py-1">App</p>
                        <button
                          type="button"
                          onClick={toggleNotifyPrefs}
                          className="w-full text-left text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg px-3 py-2 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <Bell className="w-3.5 h-3.5 text-neutral-400" />
                            Notification Preferences
                          </span>
                          <span className={`w-8 h-4.5 rounded-full relative transition-colors ${notifyPrefs.assetStatus ? 'bg-neutral-900' : 'bg-neutral-300'}`}>
                            <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${notifyPrefs.assetStatus ? 'left-4' : 'left-0.5'}`} />
                          </span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button type="button" onClick={() => { setCurrentCompany(null); setSelectedCampaignId(''); setSelectedPostingId(''); }}
                  className="hidden sm:flex text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-transparent hover:bg-neutral-100 rounded-lg px-3 py-1.5 items-center gap-1.5 border-0 transition-colors"
                  title="Return to Brand selection"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" /><span>Switch Brand</span>
                </button>
              </>
            )}

            {currentUser?.role === 'Team Lead' && !proxyOriginalUser && (
              <button type="button" onClick={() => setIsOnboardingOpen(true)}
                className="hidden sm:flex text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-transparent hover:bg-neutral-100 rounded-lg px-3 py-1.5 items-center gap-1.5 border-0 transition-colors"
                title="Manage team members"
              >
                <Users className="w-3.5 h-3.5" /><span>Team</span>
              </button>
            )}

            {currentUser && (
              <div className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl px-3 py-1.5 transition-colors">
                <div className="bg-neutral-300 rounded-full p-0.5 flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:flex flex-col min-w-0">
                  <span className="text-sm font-medium text-neutral-800 truncate leading-tight">{currentUser.username}</span>
                  <span className="text-xs text-neutral-500 leading-tight">{currentUser.role}</span>
                </div>
                <button type="button" onClick={handleLogout} className="text-neutral-400 hover:text-red-500 p-0.5 rounded transition-colors flex-shrink-0" title="Log out">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </header>}

        {proxyOriginalUser && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-1.5 flex items-center justify-center gap-3 text-[13px]">
            <span className="text-amber-800">
              Viewing as <span className="font-bold">{currentUser?.username}</span>
              <span className="text-amber-600 mx-1">({currentUser?.role})</span>
              — read-only mode
            </span>
            <button
              type="button"
              onClick={handleExitProxy}
              className="text-[11px] font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-2.5 py-0.5 rounded transition-colors"
            >
              Exit
            </button>
          </div>
        )}

        <ErrorBoundary>
          {!currentUser ? (
            <LoginScreen />
          ) : !currentCompany ? (
            <CompanySelector />
          ) : (
            <WorkspaceDashboard />
          )}
        </ErrorBoundary>

        <ToastContainer toasts={toasts} onRemove={removeToast} />

        <OnboardingModal />

        {currentCompany && (
          <EditBrandModal
            isOpen={isEditBrandOpen}
            onClose={() => setIsEditBrandOpen(false)}
            companyName={currentCompany.name}
            companyDescription={currentCompany.description}
            companyId={currentCompany.id}
            onSaved={handleBrandSaved}
          />
        )}

        {currentUser && (
          <ProfileModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            username={currentUser.username}
            role={currentUser.role}
            accessCode={currentUser.accessCode}
          />
        )}
      </div>
    </AppContext.Provider>
  );
}
