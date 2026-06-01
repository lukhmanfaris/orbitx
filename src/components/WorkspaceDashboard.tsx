import React from 'react';
import {
  Layers, FileBox, ChevronRight,
  Search, Video, Image, Trash2,
  UploadCloud, RefreshCw, AlertCircle, Plus,
} from 'lucide-react';
import FolderSidebar from './FolderSidebar';
import MediaTab from './MediaTab';
import ArticlesTab from './ArticlesTab';
import ArticlesOverview from './ArticlesOverview';
import FullArticleTab from './FullArticleTab';
import CreatePostingModal from './CreatePostingModal';
import { useAppContext } from '../AppContext';
import { Role } from '../types';

export default function WorkspaceDashboard() {
  const {
    currentUser, currentCompany,
    selectedCampaignId, setSelectedCampaignId,
    selectedPostingId, setSelectedPostingId,
    campaigns, postingFolders,
    selectedArticleFolderId, selectedArticleId, showArticlesOverview,
    assets,
    draftCount, refineCount, readyCount,
    searchQuery, setSearchQuery,
    isDragOver,
    isUploading, uploadProgress, uploadError,
    fileInputRef, setIsCreatingPosting,
    isCreatePostingModalOpen, setIsCreatePostingModalOpen,
    handleCreatePostingFromModal,
    handleS3FileUpload, handleDragOver, handleDragLeave, handleDrop,
    handleDeleteCampaign,
  } = useAppContext();

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
  const selectedPosting = postingFolders.find(p => p.id === selectedPostingId);

  if (!currentUser || !currentCompany) return null;

  console.log('[ROUTING] selectedArticleId:', selectedArticleId, 'selectedArticleFolderId:', selectedArticleFolderId);

  // Article editor — replaces main content area (sidebar stays)
  if (selectedArticleId) {
    return (
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <FolderSidebar />
        <section className="flex-1 bg-[#fafafa] flex flex-col overflow-y-auto">
          <FullArticleTab />
        </section>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      <FolderSidebar />

      <section className="flex-1 bg-[#fafafa] flex flex-col overflow-y-auto">

        {/* ── Articles overview ── */}
        {showArticlesOverview && !selectedArticleFolderId ? (
          <ArticlesOverview />

        /* ── Article folder view ── */
        ) : selectedArticleFolderId ? (
          <ArticlesTab />

        /* ── Posting media view ── */
        ) : selectedPostingId ? (
          <div className="p-3 md:p-6 flex-1 flex flex-col space-y-6">
            {/* Breadcrumb + status header */}
            <div className="bg-white border border-[#e5e5e5] rounded-xl p-3 md:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center flex-wrap gap-2 text-xs text-neutral-500 font-mono">
                  <button
                    type="button"
                    onClick={() => { setSelectedCampaignId(''); setSelectedPostingId(''); }}
                    className="uppercase hover:text-neutral-900 transition-colors"
                    title="Go to workspace lobby"
                  >
                    {currentCompany.logoText || currentCompany.name}
                  </button>
                  <ChevronRight className="w-3 h-3 text-neutral-300" />
                  {selectedCampaign && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedPostingId('')}
                        className="flex items-center space-x-1 text-neutral-700 font-bold bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 hover:border-neutral-400 transition-colors"
                        title="Go back to campaign view"
                      >
                        <FileBox className="w-3 h-3" />
                        <span>{selectedCampaign.name}</span>
                      </button>
                      <ChevronRight className="w-3 h-3 text-neutral-300" />
                    </>
                  )}
                  <span className="flex items-center space-x-1 text-neutral-800 font-bold bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                    <Layers className="w-3 h-3" />
                    <span>{selectedPosting?.name}</span>
                  </span>
                </div>
                <h2 className="text-lg font-black text-neutral-900 pt-1">{selectedPosting?.name} Workspace</h2>
                <p className="text-xs text-neutral-600 leading-relaxed font-sans">{selectedPosting?.description || 'Posting folder inside campaign workspace.'}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center flex-shrink-0">
                <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-2 min-w-[75px]">
                  <span className="text-base font-extrabold text-amber-700">{draftCount}</span>
                  <p className="text-[9px] font-bold text-amber-800 font-mono uppercase tracking-wider">Drafting</p>
                </div>
                <div className="bg-indigo-50/50 border border-indigo-200 rounded-lg p-2 min-w-[75px]">
                  <span className="text-base font-extrabold text-indigo-700">{refineCount}</span>
                  <p className="text-[9px] font-bold text-indigo-800 font-mono uppercase tracking-wider">Refining</p>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-2 min-w-[75px]">
                  <span className="text-base font-extrabold text-emerald-700">{readyCount}</span>
                  <p className="text-[9px] font-bold text-emerald-800 font-mono uppercase tracking-wider">Publish</p>
                </div>
              </div>
            </div>

            {/* Media header + upload zone */}
            <div className="flex flex-col lg:flex-row lg:items-stretch gap-2 lg:gap-4 bg-white border border-[#e5e5e5] rounded-xl shadow-xs px-4 py-3">
              <div className="flex items-center gap-2 px-4 py-3 bg-neutral-900 text-white rounded-xl flex-shrink-0">
                <Layers className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wider font-mono whitespace-nowrap">
                  Digital Marketing Media ({assets.length})
                </span>
              </div>

              {currentUser.role !== Role.ContentWriter && (
                <div
                  className="flex-1 flex items-center justify-center min-h-[48px] rounded-xl border border-dashed border-neutral-300 px-4 py-3 cursor-pointer hover:border-neutral-500 hover:bg-neutral-50 transition-colors relative"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => { if (e.target.files && e.target.files.length > 0) { handleS3FileUpload(e.target.files[0]); } }}
                    className="hidden"
                    accept="image/*,video/*,.psd"
                  />
                  {isUploading ? (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-600">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{uploadProgress}%</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-neutral-500" />
                      <span className="text-[10px] text-neutral-600">
                        <span className="font-bold text-neutral-900">Drag & drop</span> or <span className="underline">browse</span> — Images, Videos, raw PSDs &nbsp;
                        <span className="text-neutral-400">MAX: 150MB</span>
                      </span>
                    </div>
                  )}
                  {uploadError && (
                    <div className="absolute bottom-1 left-3 text-[9px] text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" /><span>{uploadError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <MediaTab />
          </div>

        /* ── Campaign view (no posting selected) ── */
        ) : selectedCampaignId ? (
          <div className="flex-1 flex items-center justify-center p-3 md:p-8">
            <div className="text-center max-w-md bg-white border border-[#e5e5e5] rounded-2xl p-8 shadow-xs">
              <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Layers className="w-7 h-7 text-neutral-400" />
              </div>
              <h3 className="text-sm font-black text-neutral-900 uppercase tracking-tight">No posting folders yet</h3>
              <p className="text-xs text-neutral-500 leading-relaxed mt-2">
                This campaign has no posting folders. Create one to start adding assets.
              </p>
              <button
                type="button"
                onClick={() => setIsCreatePostingModalOpen(true)}
                className="mt-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Create New Posting
              </button>
            </div>
          </div>

        /* ── Lobby ── */
        ) : (
          <div className="flex-1 overflow-y-auto bg-neutral-50/50">
            <div className="max-w-6xl mx-auto p-3 md:p-6 lg:p-8 space-y-8">
              <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold font-mono tracking-widest text-neutral-500 uppercase block">
                    CREATIVE WORKSPACE LOBBY
                  </span>
                  <h2 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">
                    Find, View, and Curate your Brand Campaigns
                  </h2>
                  <p className="text-xs text-neutral-500 leading-relaxed max-w-2xl font-sans">
                    Welcome, <span className="font-bold text-neutral-800">{currentUser.username}</span> (Designation: <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-neutral-100 text-neutral-700 rounded border border-neutral-200">{currentUser.role}</span>)! This dashboard organizes your subsidiary's active campaigns and posting sub-folders.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 border border-[#e5e5e5] rounded-2xl shadow-xs">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                  <input type="text" className="w-full text-xs pl-9 pr-4 py-3 bg-neutral-50 border border-[#d4d4d4] rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white text-neutral-900" placeholder="Search campaigns by keyword..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                {searchQuery && (
                  <div className="flex items-center space-x-2">
                    <button type="button" onClick={() => setSearchQuery('')} className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-600 hover:bg-neutral-200 px-3 py-2 rounded-xl border border-neutral-200 transition-colors">
                      Clear Search
                    </button>
                  </div>
                )}
              </div>

              {campaigns.length === 0 ? (
                <div className="text-center py-16 bg-white border border-[#e5e5e5] rounded-2xl shadow-xs">
                  <FileBox className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <h3 className="text-sm font-extrabold text-neutral-900 uppercase">No active campaigns provisioned</h3>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                    Get started by adding your first campaign in the sidebar directory.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campaigns
                    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(campaign => {
                      const campaignLower = campaign.name.toLowerCase();
                      const isVideoChannel = campaignLower.includes('video') || campaignLower.includes('reels') || campaignLower.includes('tiktok') || campaignLower.includes('youtube') || campaignLower.includes('shorts');
                      const isSocialChannel = campaignLower.includes('instagram') || campaignLower.includes('social') || campaignLower.includes('facebook') || campaignLower.includes('pinterest') || campaignLower.includes('caption');

                      return (
                        <div key={campaign.id} onClick={() => setSelectedCampaignId(campaign.id)}
                          className="group bg-white border border-[#e5e5e5] hover:border-neutral-900 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2.5">
                              <div className="p-2.5 rounded-xl transition-colors bg-neutral-100 text-neutral-800 group-hover:bg-neutral-900 group-hover:text-white">
                                {isVideoChannel ? <Video className="w-4 h-4" /> : isSocialChannel ? <Image className="w-4 h-4" /> : <FileBox className="w-4 h-4" />}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {currentUser.role === Role.TeamLead && (
                                  <button type="button" onClick={(e) => {
                                    e.stopPropagation();
                                    const postingCount = postingFolders.filter(p => p.campaignId === campaign.id).length;
                                    const assetCount = assets.filter(a => postingFolders.some(p => p.campaignId === campaign.id && p.id === a.postingFolderId)).length;
                                    if (window.confirm(`Delete campaign '${campaign.name}'?\n\nThis will also delete:\n- ${postingCount} posting folder${postingCount !== 1 ? 's' : ''}\n- ${assetCount} media asset${assetCount !== 1 ? 's' : ''}\n\nThis action cannot be undone.`)) {
                                      handleDeleteCampaign(campaign.id, true);
                                    }
                                  }}
                                    className="text-neutral-400 hover:text-red-500 transition-colors"
                                    title="Delete campaign"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <span className="text-[10px] font-mono font-bold text-neutral-400">
                                  {new Date(campaign.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                            <h4 className="text-xs font-black text-neutral-800 group-hover:text-neutral-900 leading-tight tracking-tight transition-all truncate block capitalize">{campaign.name}</h4>
                            <p className="text-[10px] text-neutral-500 line-clamp-2 mt-1 leading-normal font-sans">{campaign.description || 'Raw digital visual assets campaign.'}</p>
                          </div>
                          <div className="pt-3.5 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                            <span className="text-[9px] font-bold text-neutral-400 font-mono tracking-wider group-hover:text-neutral-900">LAUNCH WORKSPACE</span>
                            <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <CreatePostingModal
        isOpen={isCreatePostingModalOpen}
        onClose={() => setIsCreatePostingModalOpen(false)}
        onCreate={handleCreatePostingFromModal}
      />
    </div>
  );
}
