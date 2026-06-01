import React from 'react';
import {
  RefreshCw,
  Search, Filter, ArrowUpDown, FileQuestion, Image, Upload, Plus,
} from 'lucide-react';
import { Role, AssetStatus } from '../types';
import AssetCard from './AssetCard';
import { useAppContext } from '../AppContext';
import { SkeletonAssetCard } from './common/Skeleton';

export default function MediaTab() {
  const {
    currentUser,
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    sortOrder, setSortOrder,
    loadingAssets,
    filteredAssets,
    editingAssetId,
    fileInputRef,
    isCreatePostingModalOpen, setIsCreatePostingModalOpen,
  } = useAppContext();

  if (!currentUser) return null;

  return (
    <div className="relative">
      {currentUser.role === Role.ContentWriter && (
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-5 text-center shadow-xs">
          <p className="text-xs text-neutral-600 leading-relaxed">Designers hold authorized clearances to upload digital media assets. As a registered Content Writer, you maintain clearance to write, amend, and schedule digital marketing caption drafts.</p>
        </div>
      )}

      <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 shadow-xs">
        <div className="relative flex-1 w-full md:max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input type="text" className="w-full text-xs pl-9 pr-4 py-2 bg-neutral-50 hover:bg-neutral-100 focus:bg-white border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-neutral-900 transition-colors" placeholder="Search within posting caption copy & hashtags..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-3 overflow-x-auto pb-1">
          <div className="flex items-center space-x-1.5 text-xs text-neutral-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-wider">Filter State:</span>
          </div>
          <div className="flex bg-neutral-100 rounded-lg p-0.5 border border-neutral-200">
            {['All', AssetStatus.Drafting, AssetStatus.Refining, AssetStatus.Ready].map(opt => {
              const isSelect = statusFilter === opt;
              const visualLabel = opt === AssetStatus.Ready ? 'Ready' : opt;
              return (
                <button key={opt} type="button" onClick={() => setStatusFilter(opt)}
                  className={`text-[10px] font-bold px-3 py-1 rounded transition-all ${isSelect ? 'bg-neutral-800 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'}`}
                >{visualLabel}</button>
              );
            })}
          </div>
          <button type="button" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="text-xs font-semibold px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-[#e5e5e5] rounded-lg flex items-center space-x-1.5 text-neutral-700"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
            <span>Release: {sortOrder === 'asc' ? 'Earliest first' : 'Latest first'}</span>
          </button>
        </div>
      </div>

      {loadingAssets ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => <SkeletonAssetCard key={i} />)}
        </div>
      ) : filteredAssets.length === 0 ? (
        searchQuery || statusFilter !== 'All' ? (
          <div className="text-center py-12 bg-white border border-[#e5e5e5] rounded-2xl shadow-xs">
            <div className="mx-auto w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3"><FileQuestion className="w-5 h-5" /></div>
            <h3 className="text-xs font-extrabold text-neutral-900 uppercase tracking-wide">No assets match your filters</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">Try adjusting the search or status filter.</p>
            <button type="button" onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
              className="mt-3 text-[10px] font-bold text-neutral-600 hover:text-neutral-900 underline"
            >Clear Filters</button>
          </div>
        ) : (
          <div className="text-center py-12 bg-white border border-[#e5e5e5] rounded-2xl shadow-xs">
            <div className="mx-auto w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
              <Image className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wide">No assets uploaded</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">Drag and drop media files or click to browse and upload.</p>
            <button type="button" onClick={() => fileInputRef?.current?.click()}
              className="mt-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Media
            </button>
          </div>
        )
      ) : (
        <div className="space-y-6 pb-20 md:pb-6">
          {filteredAssets.map(asset => {
            const isEditing = editingAssetId === asset.id;
            return <AssetCard key={asset.id} asset={asset} isEditing={isEditing} />;
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsCreatePostingModalOpen(true)}
        title="New Posting"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-neutral-900 text-white shadow-lg hover:bg-neutral-800 hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
