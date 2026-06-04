import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileBox, Plus, PanelLeftClose, PanelLeftOpen, Menu, Home, Search as SearchIcon, Users,
} from 'lucide-react';
import { AssetStatus } from '../types';
import { useAppContext } from '../AppContext';
import SidebarSearch from './sidebar/SidebarSearch';
import SidebarCampaigns from './sidebar/SidebarCampaigns';
import SidebarArticles from './sidebar/SidebarArticles';
import SidebarNotifications, { NotificationItem } from './sidebar/SidebarNotifications';
import SidebarActivity from './sidebar/SidebarActivity';

const blurFade = {
  initial: { opacity: 0, filter: 'blur(4px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(4px)' },
  transition: { duration: 0.2, ease: 'easeOut' },
} as const;

export default function FolderSidebar() {
  const {
    currentCompany, currentUser,
    campaigns, selectedCampaignId, setSelectedCampaignId,
    postingFolders, selectedPostingId, setSelectedPostingId,
    isCreatingCampaign, setIsCreatingCampaign,
    newCampaignName, setNewCampaignName,
    newCampaignDescription, setNewCampaignDescription,
    isCreatingPosting, setIsCreatingPosting,
    newPostingName, setNewPostingName,
    newPostingDescription, setNewPostingDescription,
    folderError, setFolderError,
    handleCreateCampaign, handleDeleteCampaign,
    handleCreatePosting, handleDeletePosting,
    allCompanyCampaigns,
    sidebarCollapsed, setSidebarCollapsed,
    isCreatePostingModalOpen, setIsCreatePostingModalOpen,
    activities, collapsedSections, setCollapsedSections,
    campaignPostingCounts,
    assets,
    fileInputRef,
    articleFolders, selectedArticleFolderId, setSelectedArticleFolderId,
    selectedArticleId, setSelectedArticleId, openArticleEditor,
    articles, handleDeleteArticle,
    handleCreateArticleFolder, handleDeleteArticleFolder,
    showArticlesOverview, setShowArticlesOverview,
    setIsOnboardingOpen,
    showAllAssets, setShowAllAssets,
  } = useAppContext();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Effective collapsed state — never collapsed on mobile
  const isCollapsed = sidebarCollapsed && !isMobile;

  const filteredCampaigns = useMemo(() => {
    if (!sidebarSearch.trim()) return allCompanyCampaigns;
    const q = sidebarSearch.toLowerCase();
    return allCompanyCampaigns.filter(c =>
      c.name.toLowerCase().includes(q) ||
      postingFolders.some(p => p.campaignId === c.id && p.name.toLowerCase().includes(q))
    );
  }, [allCompanyCampaigns, postingFolders, sidebarSearch]);

  const filteredArticles = useMemo(() => {
    if (!sidebarSearch.trim()) return articleFolders;
    const q = sidebarSearch.toLowerCase();
    return articleFolders.filter(f =>
      f.name.toLowerCase().includes(q) ||
      articles.some(a => a.articleFolderId === f.id && (a.title || '').toLowerCase().includes(q))
    );
  }, [articleFolders, articles, sidebarSearch]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const notifications = useMemo<NotificationItem[]>(() => {
    if (!currentCompany) return [];
    const items: NotificationItem[] = [];
    const now = new Date();
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    assets.forEach(a => {
      if ((a.status === AssetStatus.Drafting || a.status === AssetStatus.Refining)) {
        const updated = new Date(a.updatedAt || a.createdAt);
        if (updated < cutoff) {
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

  useEffect(() => {
    if (notifications.length > 0) {
      setCollapsedSections({ notifications: false, activity: true });
    } else {
      setCollapsedSections({ notifications: true, activity: true });
    }
  }, [notifications.length]);

  if (!currentCompany || !currentUser) return null;

  const handleNotificationClick = (n: NotificationItem) => {
    if (n.campaignId) setSelectedCampaignId(n.campaignId);
    if (n.postingFolderId) setSelectedPostingId(n.postingFolderId);
    setSelectedArticleFolderId('');
    setSelectedArticleId(null);
    setShowArticlesOverview(false);
  };

  const handleShowAllAssets = () => {
    setShowAllAssets(true);
    setSelectedCampaignId('');
    setSelectedPostingId('');
    setSelectedArticleFolderId('');
    setSelectedArticleId(null);
    setShowArticlesOverview(false);
    if (isMobile) setIsMobileOpen(false);
  };

  const handleSelectCampaign = (campaignId: string, isSelected: boolean) => {
    setSelectedCampaignId(isSelected ? '' : campaignId);
    setSelectedPostingId('');
    setSelectedArticleFolderId('');
    setSelectedArticleId(null);
    setShowArticlesOverview(false);
    setShowAllAssets(false);
    if (isMobile) setIsMobileOpen(false);
  };

  const handleSelectPosting = (postingId: string, isSelected: boolean) => {
    setSelectedPostingId(isSelected ? '' : postingId);
    setSelectedArticleFolderId('');
    setSelectedArticleId(null);
    if (isMobile) setIsMobileOpen(false);
  };

  const handleSelectArticleFolder = (folderId: string, isSelected: boolean) => {
    setSelectedArticleFolderId(isSelected ? '' : folderId);
    setSelectedCampaignId('');
    setSelectedPostingId('');
    setShowArticlesOverview(false);
    setShowAllAssets(false);
    if (isMobile) setIsMobileOpen(false);
  };

  const handleShowArticlesOverview = () => {
    setSelectedCampaignId('');
    setSelectedPostingId('');
    setSelectedArticleFolderId('');
    setSelectedArticleId(null);
    setShowArticlesOverview(true);
    setShowAllAssets(false);
    if (isMobile) setIsMobileOpen(false);
  };

  const handleAfterFolderCreated = () => {
    setSelectedCampaignId('');
    setSelectedPostingId('');
  };

  const handleMobileClose = () => {
    if (isMobile) setIsMobileOpen(false);
  };

  const handleExpandAndFocusSearch = () => {
    setSidebarCollapsed(false);
    // Delay focus until after spring animation completes
    setTimeout(() => searchInputRef.current?.focus(), 350);
  };

  return (
    <>
      {isMobile && !isMobileOpen && (
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-[57px] left-0 z-30 p-2 bg-white border border-neutral-200 rounded-r-lg shadow-sm"
          aria-label="Open sidebar"
        >
          <Menu className="w-4 h-4 text-neutral-600" />
        </button>
      )}

      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <motion.aside
        animate={!isMobile ? { width: sidebarCollapsed ? 64 : 280 } : {}}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
        className={`bg-neutral-100 border-r border-neutral-200/80 flex flex-col flex-shrink-0 overflow-hidden ${
          isMobile
            ? `fixed top-[57px] left-0 h-[calc(100vh-57px)] z-50 w-[280px] transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`
            : 'h-screen'
        }`}
      >
        {/* ── Company header ── */}
        <div className="p-2 flex-shrink-0">
          <AnimatePresence mode="popLayout" initial={false}>
            {!isCollapsed ? (
              <motion.div key="expanded-header" {...blurFade}>
                <div className="bg-white border border-neutral-200 rounded-xl p-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-2 min-w-0 cursor-pointer group flex-1"
                      onClick={() => {
                        setSelectedCampaignId('');
                        setSelectedPostingId('');
                        setSelectedArticleFolderId('');
                        setSelectedArticleId(null);
                        setShowArticlesOverview(false);
                        setShowAllAssets(false);
                      }}
                      title="Return to Brand Dashboard"
                    >
                      <div className="p-1.5 rounded-lg bg-neutral-900 text-white flex-shrink-0 group-hover:bg-neutral-800 transition relative overflow-hidden">
                        <FileBox className="w-3.5 h-3.5 group-hover:opacity-0 transition-opacity" />
                        <Home className="w-3.5 h-3.5 absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-[13px] font-semibold text-neutral-900 tracking-tight truncate group-hover:text-neutral-700 transition">{currentCompany.name}</h2>
                        <p className="text-[10px] text-neutral-500 truncate">{currentCompany.description || 'Brand workspace'}</p>
                      </div>
                    </div>
                    {!isMobile && (
                      <button
                        type="button"
                        onClick={() => setSidebarCollapsed(true)}
                        className="p-1 hover:bg-neutral-200 rounded text-neutral-400 hover:text-neutral-600 transition-colors flex-shrink-0"
                        title="Collapse sidebar"
                        aria-label="Collapse sidebar"
                      >
                        <PanelLeftClose className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="collapsed-header" {...blurFade} className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(false)}
                  className="p-1.5 hover:bg-neutral-200 rounded-lg text-neutral-500 hover:text-neutral-700 transition-colors"
                  title="Expand sidebar"
                  aria-label="Expand sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSidebarCollapsed(false);
                    setSelectedCampaignId('');
                    setSelectedPostingId('');
                    setSelectedArticleFolderId('');
                    setSelectedArticleId(null);
                    setShowArticlesOverview(false);
                    setShowAllAssets(false);
                  }}
                  className="p-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
                  title={currentCompany.name}
                >
                  <FileBox className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Mobile: team button ── */}
        {isMobile && currentUser?.role === 'Team Lead' && (
          <div className="px-3 pb-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => { setIsOnboardingOpen(true); setIsMobileOpen(false); }}
              className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-200 transition-colors text-neutral-700 text-xs font-medium"
              title="Manage team members"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Team</span>
            </button>
          </div>
        )}

        {/* ── Quick actions ── */}
        <div className="px-2 pb-2 flex-shrink-0">
          <AnimatePresence mode="popLayout" initial={false}>
            {!isCollapsed ? (
              <motion.div key="expanded-actions" {...blurFade} className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setIsCreatingCampaign(!isCreatingCampaign)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-neutral-300 text-sm font-medium text-neutral-600 hover:border-neutral-400 hover:bg-neutral-200/50 transition-colors tracking-tight"
                  title="New Campaign"
                  aria-label="Create new campaign"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Campaign</span>
                </button>
                <SidebarSearch
                  searchQuery={sidebarSearch}
                  setSearchQuery={setSidebarSearch}
                  inputRef={searchInputRef}
                />
              </motion.div>
            ) : (
              <motion.div key="collapsed-actions" {...blurFade} className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={handleExpandAndFocusSearch}
                  className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 transition-colors"
                  title="Search"
                >
                  <SearchIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { setSidebarCollapsed(false); setIsCreatingCampaign(true); }}
                  className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 transition-colors"
                  title="New Campaign"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <SidebarCampaigns
            filteredCampaigns={filteredCampaigns}
            postingFolders={postingFolders}
            selectedCampaignId={selectedCampaignId}
            selectedPostingId={selectedPostingId}
            campaignPostingCounts={campaignPostingCounts}
            isCreatingCampaign={isCreatingCampaign}
            setIsCreatingCampaign={setIsCreatingCampaign}
            newCampaignName={newCampaignName}
            setNewCampaignName={setNewCampaignName}
            newCampaignDescription={newCampaignDescription}
            setNewCampaignDescription={setNewCampaignDescription}
            folderError={folderError}
            isCreatingPosting={isCreatingPosting}
            handleCreateCampaign={handleCreateCampaign}
            handleDeleteCampaign={handleDeleteCampaign}
            handleDeletePosting={handleDeletePosting}
            setIsCreatePostingModalOpen={setIsCreatePostingModalOpen}
            currentUserRole={currentUser.role}
            searchQuery={sidebarSearch}
            onSelectCampaign={handleSelectCampaign}
            onSelectPosting={handleSelectPosting}
            onShowAllAssets={handleShowAllAssets}
            isSidebarCollapsed={isCollapsed}
          />

          <SidebarArticles
            filteredArticles={filteredArticles}
            articles={articles}
            selectedArticleFolderId={selectedArticleFolderId}
            selectedArticleId={selectedArticleId}
            currentUserRole={currentUser.role}
            searchQuery={sidebarSearch}
            handleCreateArticleFolder={handleCreateArticleFolder}
            handleDeleteArticleFolder={handleDeleteArticleFolder}
            handleDeleteArticle={handleDeleteArticle}
            openArticleEditor={openArticleEditor}
            onSelectArticleFolder={handleSelectArticleFolder}
            onShowArticlesOverview={handleShowArticlesOverview}
            onAfterFolderCreated={handleAfterFolderCreated}
            onMobileClose={handleMobileClose}
            isSidebarCollapsed={isCollapsed}
          />

          <SidebarNotifications
            notifications={notifications}
            collapsed={collapsedSections.notifications}
            onToggle={() => setCollapsedSections({ ...collapsedSections, notifications: !collapsedSections.notifications })}
            onNotificationClick={handleNotificationClick}
            isSidebarCollapsed={isCollapsed}
          />

          <SidebarActivity
            activities={activities}
            collapsed={collapsedSections.activity}
            onToggle={() => setCollapsedSections({ ...collapsedSections, activity: !collapsedSections.activity })}
            isSidebarCollapsed={isCollapsed}
          />
        </div>
      </motion.aside>
    </>
  );
}
