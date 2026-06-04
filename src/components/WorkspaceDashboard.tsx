import React from 'react';
import { motion } from 'motion/react';
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
import BrandDashboard from './BrandDashboard';
import AllAssetsView from './AllAssetsView';
import { useAppContext } from '../AppContext';
import { Role } from '../types';

export default function WorkspaceDashboard() {
  const {
    currentUser, currentCompany,
    selectedCampaignId, setSelectedCampaignId,
    selectedPostingId, setSelectedPostingId,
    campaigns, postingFolders,
    selectedArticleFolderId, selectedArticleId, showArticlesOverview,
    showAllAssets,
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
  const campaignPostings = postingFolders.filter(p => p.campaignId === selectedCampaignId);
  const currentViewKey = selectedArticleId || selectedArticleFolderId || selectedPostingId || (showAllAssets ? 'all-assets' : '') || selectedCampaignId || (showArticlesOverview ? 'articles-overview' : 'lobby');

  if (!currentUser || !currentCompany) return null;

  // Article editor — replaces main content area (sidebar stays)
  if (selectedArticleId) {
    return (
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <FolderSidebar />
        <section className="flex-1 bg-[#fafafa] flex flex-col overflow-y-auto t-fade-in">
          <FullArticleTab />
        </section>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      <FolderSidebar />

      <section className="flex-1 bg-[#fafafa] flex flex-col overflow-y-auto">
        <div key={currentViewKey} className="t-fade-in flex-1 flex flex-col min-h-0">

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
            <div className="bg-white border border-[#e5e5e5] rounded-xl p-3 md:p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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

        /* ── All Assets grid view ── */
        ) : showAllAssets ? (
          <AllAssetsView />

        /* ── Campaign view (no posting selected) ── */
        ) : selectedCampaignId ? (
          <div className="flex-1 p-3 md:p-6 overflow-y-auto">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight text-neutral-900">{selectedCampaign?.name}</h2>
                {selectedCampaign?.description && (
                  <p className="text-sm text-neutral-400">{selectedCampaign.description}</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {campaignPostings.map(posting => (
                  <motion.div
                    key={posting.id}
                    className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 cursor-pointer flex flex-col gap-3"
                    onClick={() => setSelectedPostingId(posting.id)}
                    whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600 font-bold text-base flex-shrink-0">
                      {posting.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold tracking-tight text-neutral-900 truncate">{posting.name}</h3>
                      {posting.description && (
                        <p className="text-sm text-neutral-400 mt-1 line-clamp-2 leading-relaxed">{posting.description}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100 mt-auto">
                      <span className="text-xs text-neutral-400">Media posting</span>
                      <ChevronRight className="w-4 h-4 text-neutral-300" />
                    </div>
                  </motion.div>
                ))}
                <motion.div
                  className="rounded-2xl p-5 cursor-pointer flex flex-col items-center justify-center min-h-[180px] border-2 border-dashed border-neutral-200 hover:border-neutral-400 transition-colors"
                  onClick={() => setIsCreatePostingModalOpen(true)}
                  whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center mb-2">
                    <Plus className="w-5 h-5 text-neutral-400" />
                  </div>
                  <span className="text-sm font-medium text-neutral-400">Create New Posting</span>
                </motion.div>
              </div>
            </div>
          </div>

        /* ── Lobby (Brand Dashboard) ── */
        ) : (
          <BrandDashboard />
        )}
        </div>
      </section>

      <CreatePostingModal
        isOpen={isCreatePostingModalOpen}
        onClose={() => setIsCreatePostingModalOpen(false)}
        onCreate={handleCreatePostingFromModal}
      />
    </div>
  );
}
