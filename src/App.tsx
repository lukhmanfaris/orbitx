import React from 'react';
import { Building2, Layers, Home, User, LogOut, Users } from 'lucide-react';
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
  } = ctx;

  return (
    <AppContext.Provider value={ctx}>
      <div className="min-h-screen bg-[#fafafa] text-[#171717] font-sans flex flex-col selection:bg-neutral-800 selection:text-white">
        <header className="sticky top-0 z-40 bg-white border-b border-[#e5e5e5] px-4 sm:px-6 py-3 sm:py-3.5 flex flex-row items-center justify-between gap-2 sm:gap-4 shadow-xs">
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
                  {currentCompany ? (currentCompany.logoText || currentCompany.name) : 'CONGLOMERATE MEDIA PORTAL'}
                </h1>
                {currentCompany && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${getBrandBadgeClass()}`}>
                    Active Subsidiary
                  </span>
                )}
              </div>
              <p className="text-[10px] font-mono text-[#737373] uppercase tracking-wider">
                {currentCompany ? `${currentCompany.name} Workspace` : 'Campaign Media Management Hub'}
              </p>
            </div>
            <div className="sm:hidden min-w-0">
              <h1 className="text-xs font-extrabold tracking-tight text-neutral-900 uppercase truncate">
                {currentCompany ? (currentCompany.logoText || currentCompany.name) : 'ORBITX'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {currentCompany && (
              <button type="button" onClick={() => { setCurrentCompany(null); setSelectedCampaignId(''); setSelectedPostingId(''); }}
                className="hidden sm:flex text-xs font-bold text-neutral-100 bg-neutral-900 hover:bg-[#171717]/90 hover:scale-[1.01] transition-all items-center space-x-1.5 px-3 py-1.5 rounded-md shadow-sm"
                title="Return to Brand Workspace selection"
              >
                <Home className="w-4 h-4 text-neutral-400" /><span>Home</span>
              </button>
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
        </header>

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
      </div>
    </AppContext.Provider>
  );
}
