import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Image as ImageIcon, Video } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { AssetStatus } from '../types';

export default function AllAssetsView() {
  const {
    currentCompany,
    fetchAllCompanyAssets,
    allCompanyAssets,
    setSelectedCampaignId,
    setSelectedPostingId,
    setShowAllAssets,
  } = useAppContext();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentCompany) {
      setLoading(true);
      fetchAllCompanyAssets(currentCompany.id).finally(() => setLoading(false));
    }
  }, [currentCompany?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case AssetStatus.Drafting: return 'bg-amber-100 text-amber-800';
      case AssetStatus.Refining: return 'bg-indigo-100 text-indigo-800';
      case AssetStatus.Ready: return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50/50 p-6 md:p-8 t-fade-in">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-2xl font-black text-neutral-900 tracking-tight uppercase">All Media Assets</h2>
            <p className="text-sm text-neutral-500">
              {loading ? 'Loading...' : `${allCompanyAssets.length} total assets across all campaigns`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAllAssets(false)}
            className="text-xs font-bold text-neutral-500 hover:text-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-neutral-400 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full" />
          </div>
        ) : allCompanyAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ImageIcon className="w-12 h-12 text-neutral-300 mb-3" />
            <p className="text-sm font-bold text-neutral-900">No media assets yet</p>
            <p className="text-xs text-neutral-500 mt-1">Upload media to your campaigns to see them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {allCompanyAssets.map(asset => {
              const isVideo = asset.fileType?.includes('video');
              return (
                <motion.div
                  key={asset.id}
                  className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden cursor-pointer flex flex-col"
                  onClick={() => {
                    if (asset.campaignId) {
                      setSelectedCampaignId(asset.campaignId);
                      setSelectedPostingId(asset.postingFolderId);
                      setShowAllAssets(false);
                    }
                  }}
                  whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="relative aspect-square overflow-hidden bg-neutral-100">
                    {isVideo ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-10 h-10 text-neutral-400" />
                      </div>
                    ) : (
                      <img
                        src={asset.s3FileUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                    <span className={`absolute top-1.5 right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${getStatusColor(asset.status)}`}>
                      {asset.status === AssetStatus.Ready ? 'Ready' : asset.status}
                    </span>
                  </div>

                  <div className="px-3 py-2 flex items-center justify-between gap-2">
                    {asset.postingName ? (
                      <span className="text-xs text-neutral-500 truncate">{asset.postingName}</span>
                    ) : (
                      <span className="text-xs text-neutral-400 truncate">—</span>
                    )}
                  </div>
                </motion.div>

              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
