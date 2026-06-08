import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileBox, Plus, Trash2, ChevronDown } from 'lucide-react';
import { Role, Campaign, PostingFolder } from '../../types';

const blurFade = {
  initial: { opacity: 0, filter: 'blur(4px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(4px)' },
  transition: { duration: 0.2, ease: 'easeOut' },
} as const;

export interface SidebarCampaignsHandle {
  openCreateCampaign: () => void;
}

interface Props {
  filteredCampaigns: Campaign[];
  postingFolders: PostingFolder[];
  selectedCampaignId: string;
  selectedPostingId: string;
  campaignPostingCounts: Record<string, number>;
  folderError: string;
  isCreatingPosting: boolean;
  handleCreateCampaign: (formData: { name: string; description: string; projectType: 'both' | 'media' | 'articles' }) => void;
  handleDeleteCampaign: (id: string) => void;
  handleDeletePosting: (id: string) => void;
  setIsCreatePostingModalOpen: (v: boolean) => void;
  currentUserRole: Role;
  searchQuery: string;
  onSelectCampaign: (campaignId: string, isSelected: boolean) => void;
  onSelectPosting: (postingId: string, isSelected: boolean) => void;
  onShowAllAssets?: () => void;
  isSidebarCollapsed: boolean;
}

const SidebarCampaigns = forwardRef<SidebarCampaignsHandle, Props>(function SidebarCampaigns({
  filteredCampaigns, postingFolders, selectedCampaignId, selectedPostingId,
  campaignPostingCounts, folderError, isCreatingPosting, handleCreateCampaign,
  handleDeleteCampaign, handleDeletePosting,
  setIsCreatePostingModalOpen, currentUserRole, searchQuery, onSelectCampaign, onSelectPosting,
  onShowAllAssets, isSidebarCollapsed,
}, ref) {
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDescription, setNewCampaignDescription] = useState('');
  const [newCampaignProjectType, setNewCampaignProjectType] = useState<'both' | 'media' | 'articles'>('both');
  const [campaignFormError, setCampaignFormError] = useState('');

  useImperativeHandle(ref, () => ({
    openCreateCampaign: () => setIsCreatingCampaign(true),
  }), []);

  const [hoveredCampaignId, setHoveredCampaignId] = useState<string | null>(null);
  const [hoveredPostingId, setHoveredPostingId] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) {
      setCampaignFormError('Campaign name is required.');
      return;
    }
    await handleCreateCampaign({
      name: newCampaignName,
      description: newCampaignDescription,
      projectType: newCampaignProjectType,
    });
    setNewCampaignName('');
    setNewCampaignDescription('');
    setNewCampaignProjectType('both');
    setCampaignFormError('');
    setIsCreatingCampaign(false);
  };

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {isSidebarCollapsed ? (
        <motion.div key="collapsed" {...blurFade} className="flex flex-col items-center gap-1 py-2 px-1 border-t border-neutral-200/60">
          {filteredCampaigns.map(campaign => {
            const isSelected = campaign.id === selectedCampaignId;
            return (
              <button
                key={campaign.id}
                type="button"
                onClick={() => onSelectCampaign(campaign.id, isSelected)}
                title={campaign.name}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold transition-colors ${
                  isSelected
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                }`}
              >
                {campaign.name.charAt(0).toUpperCase()}
              </button>
            );
          })}
        </motion.div>
      ) : (
        <motion.div key="expanded" {...blurFade}>
          {/* Section header */}
          <div className="px-3 pt-3 pb-1 mb-1 flex items-center justify-between">
            <span
              className="text-[10px] font-bold text-neutral-400 hover:text-neutral-900 cursor-pointer transition-colors uppercase tracking-widest"
              onClick={() => onShowAllAssets?.()}
              title="View all media assets"
            >
              CAMPAIGNS
            </span>
            {currentUserRole === Role.TeamLead && (
              <button
                type="button"
                onClick={() => setIsCreatingCampaign(!isCreatingCampaign)}
                className="p-0.5 rounded hover:bg-neutral-200 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {isCreatingCampaign && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-neutral-50 border-b border-neutral-200 overflow-hidden"
              >
                <form onSubmit={onSubmit} className="p-3 space-y-2.5">
                  <input
                    type="text"
                    className="w-full text-xs p-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-200 transition-colors"
                    placeholder="Campaign name"
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                    autoFocus
                  />
                  <textarea
                    rows={2}
                    className="w-full text-xs p-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-200 transition-colors resize-none"
                    placeholder="Description..."
                    value={newCampaignDescription}
                    onChange={(e) => setNewCampaignDescription(e.target.value)}
                  />
                  {campaignFormError && <p className="text-[9px] text-red-600 font-medium">{campaignFormError}</p>}
                  <div className="flex gap-2 pt-1">
                    <button type="submit" className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-medium py-1.5 rounded-lg transition-colors">Create</button>
                    <button type="button" onClick={() => setIsCreatingCampaign(false)} className="bg-white border border-neutral-200 text-neutral-600 text-[11px] px-3 py-1.5 rounded-lg hover:bg-neutral-50 transition-colors">Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Campaign list */}
          <div className="px-2 py-1 space-y-0.5 max-h-[40vh] overflow-y-auto">
            {filteredCampaigns.length === 0 ? (
              <div className="p-4 text-center">
                <FileBox className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs text-neutral-400">{searchQuery.trim() ? 'No matches found' : 'No active campaigns'}</p>
              </div>
            ) : (
              filteredCampaigns.map(campaign => {
                const isSelected = campaign.id === selectedCampaignId;
                const campaignPostings = postingFolders.filter(p => p.campaignId === campaign.id);

                return (
                  <div key={campaign.id}>
                    <div
                      onMouseEnter={() => setHoveredCampaignId(campaign.id)}
                      onMouseLeave={() => setHoveredCampaignId(null)}
                      onClick={() => onSelectCampaign(campaign.id, isSelected)}
                      className="relative group px-3 py-2.5 rounded-lg cursor-pointer flex items-center gap-2"
                    >
                      {/* Selected background */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            className="absolute inset-0 bg-neutral-200 rounded-lg z-0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          />
                        )}
                      </AnimatePresence>
                      {/* Hover background */}
                      <AnimatePresence>
                        {hoveredCampaignId === campaign.id && !isSelected && (
                          <motion.span
                            layoutId="campaign-hover-bg"
                            className="absolute inset-0 bg-neutral-200/50 rounded-lg z-0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          />
                        )}
                      </AnimatePresence>
                      <FileBox className={`relative z-10 w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-neutral-700' : 'text-neutral-400'}`} />
                      <div className="relative z-10 flex-1 min-w-0">
                        <p className={`text-sm tracking-tight truncate ${isSelected ? 'text-neutral-900 font-medium' : 'text-neutral-500'}`}>{campaign.name}</p>
                        <p className="text-[10px] text-neutral-400 truncate">{campaignPostingCounts[campaign.id] ?? 0} posting{(campaignPostingCounts[campaign.id] ?? 0) !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="relative z-10 flex items-center gap-0.5">
                        {currentUserRole === Role.TeamLead && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(campaign.id); }}
                            className="p-1 rounded text-neutral-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Campaign"
                            aria-label={`Delete campaign ${campaign.name}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isSelected ? 'rotate-0' : '-rotate-90'}`} />
                      </div>
                    </div>

                    {/* Postings sub-list */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="ml-4 border-l border-neutral-200 pl-2 space-y-0.5 mt-0.5 overflow-hidden"
                        >
                          {campaignPostings.length === 0 && !isCreatingPosting && (campaignPostingCounts[campaign.id] ?? 0) === 0 && (
                            <p className="text-[10px] text-neutral-400 py-2 pl-1 italic">No postings yet</p>
                          )}
                          {campaignPostings.map(posting => {
                            const isPostingSelected = posting.id === selectedPostingId;
                            return (
                              <div
                                key={posting.id}
                                onMouseEnter={() => setHoveredPostingId(posting.id)}
                                onMouseLeave={() => setHoveredPostingId(null)}
                                onClick={() => onSelectPosting(posting.id, isPostingSelected)}
                                className="relative group px-3 py-2.5 rounded-lg cursor-pointer flex items-center gap-2"
                              >
                                {/* Selected background */}
                                <AnimatePresence>
                                  {isPostingSelected && (
                                    <motion.div
                                      className="absolute inset-0 bg-neutral-200 rounded-lg z-0"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 0.15 }}
                                    />
                                  )}
                                </AnimatePresence>
                                {/* Hover background */}
                                <AnimatePresence>
                                  {hoveredPostingId === posting.id && !isPostingSelected && (
                                    <motion.span
                                      layoutId="posting-hover-bg"
                                      className="absolute inset-0 bg-neutral-200/50 rounded-lg z-0"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                    />
                                  )}
                                </AnimatePresence>
                                <div className={`relative z-10 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPostingSelected ? 'bg-neutral-700' : 'bg-neutral-300'}`} />
                                <div className="relative z-10 flex-1 min-w-0">
                                  <p className={`text-sm tracking-tight truncate ${isPostingSelected ? 'text-neutral-900 font-medium' : 'text-neutral-500'}`}>{posting.name}</p>
                                  {posting.description && <p className="text-[10px] text-neutral-400 truncate">{posting.description}</p>}
                                </div>
                                {currentUserRole === Role.TeamLead && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleDeletePosting(posting.id); }}
                                    className="relative z-10 p-0.5 rounded text-neutral-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete Posting"
                                    aria-label={`Delete posting ${posting.name}`}
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}

                          {currentUserRole === Role.TeamLead && (
                            <div className="pt-0.5 pb-1 pl-1">
                              <button
                                type="button"
                                onClick={() => setIsCreatePostingModalOpen(true)}
                                className="w-full text-[10px] font-medium text-neutral-400 hover:text-neutral-600 py-1.5 flex items-center justify-center gap-1 border border-dashed border-neutral-200 rounded-lg hover:border-neutral-400 hover:bg-neutral-100 transition-colors"
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
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default SidebarCampaigns;
