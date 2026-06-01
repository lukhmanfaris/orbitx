import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileBox, Plus, Trash2, ChevronDown, ChevronRight,
  ChevronLeft, Search, FileText, Bell, Clock, Menu, FolderOpen, Users,
} from 'lucide-react';
import { Role, AssetStatus } from '../types';
import { useAppContext } from '../AppContext';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface NotificationItem {
  id: string;
  message: string;
  postingFolderId: string;
  campaignId: string;
  type: string;
}

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
  } = useAppContext();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Article folder creation form state (local — sidebar UI only)
  const [isCreatingArticleFolder, setIsCreatingArticleFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [folderFormError, setFolderFormError] = useState('');

  // Search for campaigns, postings, and articles
  const [sidebarSearch, setSidebarSearch] = useState('');

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

  const handleSelectCampaign = (campaignId: string, isSelected: boolean) => {
    setSelectedCampaignId(isSelected ? '' : campaignId);
    setSelectedPostingId('');
    setSelectedArticleFolderId('');
    setSelectedArticleId(null);
    setShowArticlesOverview(false);
  };

  const handleSelectPosting = (postingId: string, isSelected: boolean) => {
    setSelectedPostingId(isSelected ? '' : postingId);
    setSelectedArticleFolderId('');
    setSelectedArticleId(null);
  };

  const handleSelectArticleFolder = (folderId: string, isSelected: boolean) => {
    setSelectedArticleFolderId(isSelected ? '' : folderId);
    setSelectedCampaignId('');
    setSelectedPostingId('');
    setShowArticlesOverview(false);
    if (isMobile) setIsMobileOpen(false);
  };

  const handleSubmitArticleFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFolderFormError('');
    if (!newFolderName.trim()) { setFolderFormError('Folder name is required.'); return; }
    try {
      await handleCreateArticleFolder(newFolderName.trim(), newFolderDescription.trim());
      // Clear campaign/posting so sidebar highlight is consistent with the new folder selection
      setSelectedCampaignId('');
      setSelectedPostingId('');
      setNewFolderName('');
      setNewFolderDescription('');
      setIsCreatingArticleFolder(false);
    } catch (err: any) {
      setFolderFormError(err.message || 'Failed to create folder.');
    }
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

      <aside className={`bg-white border-r border-neutral-200 flex flex-col flex-shrink-0 transition-all duration-300 ${
        isMobile
          ? `fixed top-[57px] left-0 h-[calc(100vh-57px)] z-50 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} w-[280px]`
          : sidebarCollapsed ? 'w-14' : 'w-[280px]'
      }`}>
      {!sidebarCollapsed ? (
        <>
          {/* Company header */}
          <div className="p-2">
            <div className="bg-white border border-neutral-200 rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-neutral-900 text-white flex-shrink-0">
                    <FileBox className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[13px] font-semibold text-neutral-900 tracking-tight truncate">{currentCompany.name}</h2>
                    <p className="text-[10px] text-neutral-500 truncate">{currentCompany.description || 'Brand workspace'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(true)}
                  className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-600 transition-colors flex-shrink-0"
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {isMobile && currentUser?.role === 'Team Lead' && (
            <div className="px-3 pb-1">
              <button
                type="button"
                onClick={() => { setIsOnboardingOpen(true); setIsMobileOpen(false); }}
                className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg bg-neutral-100 border border-neutral-200 hover:bg-neutral-200 transition-colors text-neutral-700 text-xs font-medium"
                title="Manage team members"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Team</span>
              </button>
            </div>
          )}

          {/* Quick actions */}
          <div className="px-3 pb-1 space-y-2">
            <button
              type="button"
              onClick={() => setIsCreatingCampaign(!isCreatingCampaign)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-neutral-300 text-sm font-medium text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
              title="New Campaign"
              aria-label="Create new campaign"
            >
              <Plus className="w-4 h-4" />
              <span>New Campaign</span>
            </button>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                className="w-full pl-8 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 focus:bg-white transition-colors"
                placeholder="Search campaigns & articles..."
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
              />
            </div>
          </div>

          {/* ─── CAMPAIGNS section ─── */}
          <div className="px-3 pt-3 pb-1 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">CAMPAIGNS</span>
            {currentUser.role === Role.TeamLead && (
              <button
                type="button"
                onClick={() => setIsCreatingCampaign(!isCreatingCampaign)}
                className="p-0.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {isCreatingCampaign && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-neutral-50 border-b border-neutral-200 overflow-hidden">
                <form onSubmit={handleCreateCampaign} className="p-3 space-y-2.5">
                  <div>
                    <input type="text" className="w-full text-xs p-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-200 transition-colors" placeholder="Campaign name" value={newCampaignName} onChange={(e) => setNewCampaignName(e.target.value)} autoFocus />
                  </div>
                  <div>
                    <textarea rows={2} className="w-full text-xs p-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-200 transition-colors resize-none" placeholder="Description..." value={newCampaignDescription} onChange={(e) => setNewCampaignDescription(e.target.value)} />
                  </div>
                  {folderError && <p className="text-[9px] text-red-600 font-medium">{folderError}</p>}
                  <div className="flex gap-2 pt-1">
                    <button type="submit" className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-medium py-1.5 rounded-lg transition-colors">Create</button>
                    <button type="button" onClick={() => setIsCreatingCampaign(false)} className="bg-white border border-neutral-200 text-neutral-600 text-[11px] px-3 py-1.5 rounded-lg hover:bg-neutral-50 transition-colors">Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Campaign list */}
          <div className="overflow-y-auto px-2 py-1 space-y-0.5" style={{ maxHeight: '40vh' }}>
            {filteredCampaigns.length === 0 ? (
              <div className="p-4 text-center">
                <FileBox className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs text-neutral-400">{sidebarSearch.trim() ? 'No matches found' : 'No active campaigns'}</p>
              </div>
            ) : (
              filteredCampaigns.map(campaign => {
                const isSelected = campaign.id === selectedCampaignId;
                const campaignPostings = postingFolders.filter(p => p.campaignId === campaign.id);

                return (
                  <div key={campaign.id}>
                    <div
                      onClick={() => { handleSelectCampaign(campaign.id, isSelected); if (isMobile) setIsMobileOpen(false); }}
                      className={`relative group px-3 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-2 ${isSelected ? 'bg-blue-50 border-l-2 border-blue-500 rounded-l-none' : 'hover:bg-neutral-50'}`}
                    >
                      <FileBox className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-neutral-700' : 'text-neutral-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-medium truncate ${isSelected ? 'text-neutral-900' : 'text-neutral-600'}`}>{campaign.name}</p>
                        <p className="text-[10px] text-neutral-400 truncate">{campaignPostingCounts[campaign.id] ?? 0} posting{(campaignPostingCounts[campaign.id] ?? 0) !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {currentUser.role === Role.TeamLead && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(campaign.id); }}
                            className="p-1 rounded text-neutral-300 hover:text-red-500 transition-colors"
                            title="Delete Campaign"
                            aria-label={`Delete campaign ${campaign.name}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isSelected ? 'rotate-0' : '-rotate-90'}`} />
                      </div>
                    </div>

                    <AnimatePresence>
                      {isSelected && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="ml-4 border-l border-neutral-200 pl-2 space-y-0.5 mt-0.5 overflow-hidden">
                          {campaignPostings.length === 0 && !isCreatingPosting && (
                            <p className="text-[10px] text-neutral-400 py-2 pl-1 italic">No postings yet</p>
                          )}
                          {campaignPostings.map(posting => {
                            const isPostingSelected = posting.id === selectedPostingId;
                            return (
                              <div key={posting.id} onClick={() => { handleSelectPosting(posting.id, isPostingSelected); if (isMobile) setIsMobileOpen(false); }}
                                className={`relative group px-3 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-2 ${isPostingSelected ? 'bg-blue-50 border-l-2 border-blue-500 rounded-l-none' : 'hover:bg-neutral-50'}`}
                              >
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPostingSelected ? 'bg-blue-500' : 'bg-neutral-300'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-[12px] font-medium truncate ${isPostingSelected ? 'text-neutral-900' : 'text-neutral-600'}`}>{posting.name}</p>
                                  {posting.description && <p className="text-[10px] text-neutral-400 truncate">{posting.description}</p>}
                                </div>
                                {currentUser.role === Role.TeamLead && (
                                  <button type="button" onClick={(e) => { e.stopPropagation(); handleDeletePosting(posting.id); }}
                                    className="p-0.5 rounded text-neutral-300 hover:text-red-500 transition-colors"
                                    title="Delete Posting"
                                    aria-label={`Delete posting ${posting.name}`}
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}

                          {currentUser.role === Role.TeamLead && (
                            <div className="pt-0.5 pb-1 pl-1">
                              <button type="button" onClick={() => setIsCreatePostingModalOpen(true)}
                                className="w-full text-[10px] font-medium text-neutral-400 hover:text-neutral-600 py-1.5 flex items-center justify-center gap-1 border border-dashed border-neutral-200 rounded-lg hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Posting</span>
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>

          {/* ─── ARTICLES section ─── */}
          <div className="px-3 pt-3 pb-1 mb-1 flex items-center justify-between border-t border-neutral-200 mt-1">
            <button
              type="button"
              onClick={() => {
                setSelectedCampaignId('');
                setSelectedPostingId('');
                setSelectedArticleFolderId('');
                setSelectedArticleId(null);
                setShowArticlesOverview(true);
                if (isMobile) setIsMobileOpen(false);
              }}
              className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest hover:text-neutral-700 transition-colors"
            >
              ARTICLES
            </button>
            {currentUser.role === Role.TeamLead && (
              <button
                type="button"
                onClick={() => setIsCreatingArticleFolder(!isCreatingArticleFolder)}
                className="p-0.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                title="New Article Folder"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {isCreatingArticleFolder && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-neutral-50 border-b border-neutral-200 overflow-hidden">
                <form onSubmit={handleSubmitArticleFolder} className="p-3 space-y-2">
                  <input type="text" className="w-full text-xs p-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 transition-colors" placeholder="Folder name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} autoFocus />
                  <input type="text" className="w-full text-xs p-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 transition-colors" placeholder="Description (optional)" value={newFolderDescription} onChange={(e) => setNewFolderDescription(e.target.value)} />
                  {folderFormError && <p className="text-[9px] text-red-600 font-medium">{folderFormError}</p>}
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-medium py-1.5 rounded-lg transition-colors">Create</button>
                    <button type="button" onClick={() => { setIsCreatingArticleFolder(false); setFolderFormError(''); }} className="bg-white border border-neutral-200 text-neutral-600 text-[11px] px-3 py-1.5 rounded-lg hover:bg-neutral-50 transition-colors">Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Article folder list */}
          <div className="overflow-y-auto px-2 py-1 space-y-0.5 flex-1">
            {filteredArticles.length === 0 ? (
              <div className="p-4 text-center">
                <FileText className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs text-neutral-400">{sidebarSearch.trim() ? 'No matches found' : 'No article folders'}</p>
              </div>
            ) : (
              filteredArticles.map(folder => {
                const isSelected = folder.id === selectedArticleFolderId;

                return (
                  <div key={folder.id}>
                    <div
                      onClick={() => handleSelectArticleFolder(folder.id, isSelected)}
                      className={`relative group px-3 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-2 ${isSelected ? 'bg-emerald-50 border-l-2 border-emerald-500 rounded-l-none' : 'hover:bg-neutral-50'}`}
                    >
                      <FolderOpen className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-emerald-600' : 'text-neutral-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-medium truncate ${isSelected ? 'text-neutral-900' : 'text-neutral-600'}`}>{folder.name}</p>
                        {folder.description && <p className="text-[10px] text-neutral-400 truncate">{folder.description}</p>}
                      </div>
                      <div className="flex items-center gap-0.5">
                        {currentUser.role === Role.TeamLead && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteArticleFolder(folder.id); }}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-neutral-400 hover:text-red-600"
                            title="Delete Folder"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isSelected ? 'rotate-0' : '-rotate-90'}`} />
                      </div>
                    </div>

                    <AnimatePresence>
                      {isSelected && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="ml-4 border-l border-neutral-200 pl-2 space-y-0.5 mt-0.5 overflow-hidden">
                          {articles.length === 0 && (
                            <p className="text-[10px] text-neutral-400 py-2 pl-1 italic">No articles yet</p>
                          )}
                          {articles.map(article => {
                            const isArticleSelected = selectedArticleId === article.id;
                            return (
                              <div key={article.id} onClick={() => { openArticleEditor(article.id); if (isMobile) setIsMobileOpen(false); }}
                                className={`relative group px-3 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-2 ${isArticleSelected ? 'bg-emerald-50 border-l-2 border-emerald-500 rounded-l-none' : 'hover:bg-neutral-50'}`}
                              >
                                <FileText className={`w-3 h-3 flex-shrink-0 ${isArticleSelected ? 'text-emerald-600' : 'text-neutral-400'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-[11px] font-medium truncate ${isArticleSelected ? 'text-neutral-900' : 'text-neutral-600'}`}>{article.title || 'Untitled'}</p>
                                </div>
                                {currentUser.role !== Role.Designer && (
                                  <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteArticle(article.id); }}
                                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-neutral-400 hover:text-red-600"
                                    title="Delete Article"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}

                          <div className="pt-0.5 pb-1 pl-1">
                            <button type="button"
                              onClick={() => { openArticleEditor('new'); if (isMobile) setIsMobileOpen(false); }}
                              className="w-full text-[10px] font-medium text-neutral-400 hover:text-neutral-600 py-1.5 flex items-center justify-center gap-1 border border-dashed border-neutral-200 rounded-lg hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>New Article</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>

          {/* Notifications */}
          <div className="border-t border-neutral-200 pt-2">
            <div className="px-3 mb-1 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCollapsedSections({ ...collapsedSections, notifications: !collapsedSections.notifications })}
                className="flex items-center gap-1.5 hover:text-neutral-600 transition-colors"
                aria-expanded={!collapsedSections.notifications}
              >
                <Bell className="w-3 h-3 text-neutral-400" />
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">NOTIFICATIONS</span>
                {notifications.length > 0 && (
                  <span className="text-[9px] font-bold bg-blue-500 text-white px-1.5 py-0 rounded-full min-w-[16px] text-center">{notifications.length}</span>
                )}
              </button>
              <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${collapsedSections.notifications ? '' : 'rotate-180'}`} />
            </div>

            <AnimatePresence>
              {!collapsedSections.notifications && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-3 pb-2 space-y-1 max-h-40 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-[10px] text-neutral-400 py-2 text-center">All clear</p>
                    ) : (
                      notifications.map(n => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => handleNotificationClick(n)}
                          className="w-full text-left p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                        >
                          <p className="text-[10px] text-neutral-600 leading-relaxed">{n.message}</p>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Recent Activity */}
          <div className="border-t border-neutral-200 pt-2">
            <div className="px-3 mb-1 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCollapsedSections({ ...collapsedSections, activity: !collapsedSections.activity })}
                className="flex items-center gap-1.5 hover:text-neutral-600 transition-colors"
                aria-expanded={!collapsedSections.activity}
              >
                <Clock className="w-3 h-3 text-neutral-400" />
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">RECENT ACTIVITY</span>
              </button>
              <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${collapsedSections.activity ? '' : 'rotate-180'}`} />
            </div>

            <AnimatePresence>
              {!collapsedSections.activity && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-3 pb-2 space-y-1 max-h-48 overflow-y-auto">
                    {activities.length === 0 ? (
                      <p className="text-[10px] text-neutral-400 py-2 text-center">No recent activity</p>
                    ) : (
                      activities.slice(0, 5).map(act => (
                        <div key={act.id} className="flex items-start gap-2 p-2 rounded-lg">
                          <div className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[8px] font-bold text-neutral-500">{act.username.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-neutral-600 leading-relaxed">
                              <span className="font-medium text-neutral-800">{act.username}</span> {act.action} {act.detail}
                            </p>
                            <p className="text-[8px] text-neutral-400 mt-0.5">{timeAgo(act.timestamp)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      ) : (
        /* Collapsed sidebar */
        <div className="flex flex-col items-center py-3 space-y-3 h-full">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(false)}
            className="p-1.5 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-600 transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center gap-2 flex-1 overflow-y-auto px-1">
            {allCompanyCampaigns.map(campaign => {
              const isSelected = campaign.id === selectedCampaignId;
              return (
                <button
                  key={campaign.id}
                  type="button"
                  onClick={() => { handleSelectCampaign(campaign.id, isSelected); }}
                  className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-blue-50 text-blue-600' : 'text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600'}`}
                  title={campaign.name}
                >
                  <FileBox className="w-4 h-4" />
                </button>
              );
            })}
            <div className="w-6 h-px bg-neutral-200" />
            {articleFolders.map(folder => {
              const isSelected = folder.id === selectedArticleFolderId;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => handleSelectArticleFolder(folder.id, isSelected)}
                  className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-emerald-50 text-emerald-600' : 'text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600'}`}
                  title={folder.name}
                >
                  <FolderOpen className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
    </>
  );
}
