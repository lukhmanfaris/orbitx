import React, { useRef, useEffect } from 'react';
import { Building2, Layers, Home, User, LogOut, Users, Bell, Settings, Search } from 'lucide-react';
import { AppContext, useAppState } from './AppContext';
import LoginScreen from './components/LoginScreen';
import CompanySelector from './components/CompanySelector';
import WorkspaceDashboard from './components/WorkspaceDashboard';
import OnboardingModal from './components/OnboardingModal';
import ErrorBoundary from './components/common/ErrorBoundary';
import ToastContainer from './components/common/ToastContainer';
import { getPresetIconById } from './constants/brandIcons';

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
  } = ctx;

  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [headerSearch, setHeaderSearch] = React.useState('');
  const [isSearchMobileOpen, setIsSearchMobileOpen] = React.useState(false);

  const bellRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

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

  const headerSearchResults = React.useMemo(() => {
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

  return (
    <AppContext.Provider value={ctx}>
      <div className="min-h-screen bg-[#fafafa] text-[#171717] font-sans flex flex-col selection:bg-neutral-800 selection:text-white">
        {currentUser && <header className="sticky top-0 z-40 bg-white border-b border-[#e5e5e5] px-4 sm:px-6 py-3 sm:py-3.5 flex flex-row items-center justify-between gap-2 sm:gap-4 shadow-xs">
          <div className="flex items-center space-x-2 sm:space-x-3.5 min-w-0">
            {currentCompany ? (
              <div className="p-1.5 sm:p-2 rounded-lg transition-colors flex items-center justify-center text-white bg-neutral-800 flex-shrink-0">
                {currentCompany.logoType === 'upload' && currentCompany.logoData ? (
                  <img src={currentCompany.logoData} alt={currentCompany.name} className="w-4 h-4 sm:w-5 sm:h-5 rounded object-contain" />
                ) : currentCompany.logoType === 'icon' && currentCompany.logoData ? (
                  (() => { const Icon = getPresetIconById(currentCompany.logoData); return Icon ? <Icon className="w-4 h-4 sm:w-5 sm:h-5" /> : <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />; })()
                ) : currentCompany.logoUrl ? (
                  <img src={currentCompany.logoUrl} alt={currentCompany.name} className="w-4 h-4 sm:w-5 sm:h-5 rounded object-contain" />
                ) : (
                  <span className="text-[9px] sm:text-[10px] font-black font-mono">{currentCompany.logoText || currentCompany.name.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
            ) : (
              <div className="p-1.5 sm:p-2 bg-neutral-900 rounded-lg text-white flex-shrink-0">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            )}
            <div className="min-w-0 hidden sm:block">
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-extrabold tracking-tight text-neutral-900 uppercase truncate">
                  {currentCompany ? (currentCompany.logoText || currentCompany.name) : 'MYDATA GROUP'}
                </h1>
                {currentCompany && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getBrandBadgeClass()}`}>
                    Active Subsidiary
                  </span>
                )}
              </div>
              <p className="text-[10px] font-mono text-[#737373] uppercase tracking-wider">
                {currentCompany ? `${currentCompany.name} Workspace` : 'Digital Asset Media Management'}
              </p>
            </div>
            <div className="sm:hidden min-w-0">
              <h1 className="text-xs font-extrabold tracking-tight text-neutral-900 uppercase truncate">
                {currentCompany ? (currentCompany.logoText || currentCompany.name) : 'ORBITX'}
              </h1>
            </div>
          </div>

          {currentCompany && (
            <div className="flex-1 flex justify-center px-4 hidden md:flex relative">
              <div className="relative w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Quick search..."
                  className="w-full bg-neutral-100 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-shadow"
                  value={headerSearch}
                  onChange={(e) => setHeaderSearch(e.target.value)}
                />
                {headerSearch && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden z-50">
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
                          className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                        >
                          {item.type === 'campaign' ? <Layers className="w-3.5 h-3.5 text-neutral-400" /> : <Building2 className="w-3.5 h-3.5 text-neutral-400" />}
                          <span className="truncate">{item.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-neutral-500 text-center">No results found</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 flex-shrink-0">
            {currentCompany && (
              <>
                <button type="button" onClick={() => setIsSearchMobileOpen(!isSearchMobileOpen)} className="md:hidden text-neutral-500 hover:text-neutral-900 p-2 rounded-lg hover:bg-neutral-100 transition-colors">
                  <Search className="w-4 h-4" />
                </button>
                
                <div className="relative" ref={bellRef}>
                  <button type="button" onClick={() => { setIsSettingsOpen(false); setIsNotificationsOpen(!isNotificationsOpen); }} className="text-neutral-500 hover:text-neutral-900 p-2 rounded-lg hover:bg-neutral-100 transition-colors relative">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  </button>
                  {isNotificationsOpen && (
                    <div className="absolute right-0 mt-1 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden z-50 p-4">
                      <p className="text-sm font-bold text-neutral-900 mb-2">Notifications</p>
                      <p className="text-xs text-neutral-500">No new notifications</p>
                    </div>
                  )}
                </div>

                <div className="relative" ref={settingsRef}>
                  <button type="button" onClick={() => { setIsNotificationsOpen(false); setIsSettingsOpen(!isSettingsOpen); }} className="text-neutral-500 hover:text-neutral-900 p-2 rounded-lg hover:bg-neutral-100 transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                  {isSettingsOpen && (
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden z-50 p-4">
                      <p className="text-sm font-bold text-neutral-900 mb-1">Settings</p>
                      <p className="text-xs text-neutral-500">Settings coming soon</p>
                    </div>
                  )}
                </div>

                <button type="button" onClick={() => { setCurrentCompany(null); setSelectedCampaignId(''); setSelectedPostingId(''); }}
                className="hidden sm:flex text-xs font-bold text-neutral-100 bg-neutral-900 hover:bg-[#171717]/90 hover:scale-[1.01] transition-all items-center space-x-1.5 px-3 py-1.5 rounded-md shadow-sm"
                title="Return to Brand Workspace selection"
              >
                <Home className="w-4 h-4 text-neutral-400" /><span>Home</span>
              </button>
            </>
            )}
            {currentUser?.role === 'Team Lead' && !proxyOriginalUser && (
              <button type="button" onClick={() => setIsOnboardingOpen(true)}
                className="hidden sm:flex text-xs font-bold text-[#5c5c5c] hover:text-[#171717] transition-all items-center space-x-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-md"
                title="Manage team members"
              >
                <Users className="w-4 h-4 text-neutral-600" /><span>Team</span>
              </button>
            )}
            {currentUser && (
              <div className="flex items-center gap-1.5 sm:space-x-3 bg-neutral-50 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-[#e5e5e5]">
                <div className="flex items-center space-x-1 sm:space-x-1.5 text-[10px] sm:text-xs">
                  <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#737373]" />
                  <span className="font-bold text-neutral-800 hidden sm:inline">{currentUser.username}</span>
                  <span className="text-neutral-300 hidden sm:inline">|</span>
                  <span className="font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1 sm:px-1.5 py-0.5 bg-white text-neutral-700 rounded border border-neutral-200">{currentUser.role}</span>
                </div>
                <button type="button" onClick={handleLogout} className="text-neutral-500 hover:text-red-600 p-0.5 rounded-full transition-colors" title="Log Out (Switch Company Codes)">
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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

        {isSearchMobileOpen && currentCompany && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl p-4 flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Quick search..."
                  className="w-full bg-neutral-100 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200"
                  value={headerSearch}
                  onChange={(e) => setHeaderSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {headerSearch && (
                  headerSearchResults.length > 0 ? (
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
                          setIsSearchMobileOpen(false);
                        }}
                        className="w-full text-left px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 rounded-lg"
                      >
                        {item.type === 'campaign' ? <Layers className="w-4 h-4 text-neutral-400" /> : <Building2 className="w-4 h-4 text-neutral-400" />}
                        <span className="truncate font-medium">{item.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-sm text-neutral-500 text-center">No results found</div>
                  )
                )}
              </div>
              <button 
                onClick={() => setIsSearchMobileOpen(false)}
                className="w-full py-2.5 text-sm font-bold text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200"
              >
                Close Search
              </button>
            </div>
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
      </div>
    </AppContext.Provider>
  );
}
