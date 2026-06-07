import React, { useEffect, useState } from 'react';
import { Layers, FileText, Image as ImageIcon, Video, ArrowRight, UploadCloud, Edit3, ChevronRight } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { Asset, Article, AssetStatus } from '../types';

export default function BrandDashboard() {
  const {
    currentCompany,
    fetchRecentAssets,
    fetchRecentArticles,
    setSelectedCampaignId,
    setSelectedPostingId,
    setSelectedArticleId,
    setShowArticlesOverview,
    postingFolders,
    articleFolders,
    campaigns,
    setIsCreatePostingModalOpen,
    addToast,
    setShowAllAssets,
    setSelectedArticleFolderId,
    fetchAllCompanyAssets,
  } = useAppContext();

  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentCompany) {
      setLoading(true);
      Promise.all([
        fetchRecentAssets(currentCompany.id),
        fetchRecentArticles(currentCompany.id)
      ]).then(([assets, articles]) => {
        setRecentAssets(assets);
        setRecentArticles(articles);
        setLoading(false);
      });
    }
  }, [currentCompany, fetchRecentAssets, fetchRecentArticles, postingFolders]);

  if (!currentCompany) return null;

  const handleOpenCreatePosting = () => {
    setIsCreatePostingModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case AssetStatus.Drafting: return 'bg-amber-100 text-amber-800 border-amber-200';
      case AssetStatus.Refining: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case AssetStatus.Ready: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Draft': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Published': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50/50 p-6 md:p-8 t-fade-in">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
            {currentCompany.name} Workspace
          </h2>
          <p className="text-sm text-neutral-500 font-sans">
            Recent activity across your campaigns and articles
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* RECENT MEDIA */}
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-neutral-400" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Recent Media</h3>
              </div>
              <span className="bg-neutral-100 text-neutral-600 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono">
                {recentAssets.length}
              </span>
            </div>
            <div className="p-5 flex-1 flex flex-col space-y-4">
              {loading ? (
                <div className="flex-1 flex items-center justify-center py-12">
                  <div className="animate-spin w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full"></div>
                </div>
              ) : recentAssets.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                  <UploadCloud className="w-10 h-10 text-neutral-300 mb-3" />
                  <p className="text-sm font-bold text-neutral-900">No media assets yet</p>
                  <p className="text-xs text-neutral-500 mt-1 mb-4">Upload media to your campaigns to see them here.</p>
                  <button onClick={handleOpenCreatePosting} className="text-xs font-bold bg-neutral-900 text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition">
                    Create New Postings
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAssets.map(asset => {
                    const posting = postingFolders.find(p => p.id === asset.postingFolderId);
                    const campaign = campaigns.find(c => c.id === (asset.campaignId || posting?.campaignId));
                    const isVideo = asset.fileType.includes('video');
                    return (
                      <div key={asset.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-neutral-50 border border-transparent hover:border-neutral-200 transition group cursor-pointer" onClick={() => {
                          if (asset.campaignId && asset.postingFolderId) {
                            setSelectedCampaignId(asset.campaignId);
                            setSelectedPostingId(asset.postingFolderId);
                            setShowAllAssets(false);
                          }
                        }}>
                        <div
                          className="w-16 h-16 rounded-xl bg-neutral-100 border border-neutral-100 overflow-hidden flex-shrink-0 flex items-center justify-center relative transition-all shadow-sm hover:opacity-90"
                        >
                          {isVideo ? (
                            <Video className="w-8 h-8 text-neutral-400" />
                          ) : (
                            <img src={asset.s3FileUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col h-20 justify-center">
                          <h4 className="text-sm font-medium tracking-tight text-neutral-900 truncate">{asset.s3FileUrl.split('/').pop() || 'Asset'}</h4>
                          {asset.campaignId && asset.postingFolderId && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCampaignId(asset.campaignId!);
                                setSelectedPostingId(asset.postingFolderId);
                              }}
                              className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 mt-1 font-mono tracking-tight truncate w-fit transition text-left"
                            >
                              <Layers className="w-3 h-3" /> {campaign?.name || asset.campaignId} <ChevronRight className="w-3 h-3" /> {posting?.name || asset.postingFolderId}
                            </button>
                          )}
                          <div className="flex items-center gap-2 mt-auto">
                            <span className="text-xs text-neutral-400">{new Date(asset.createdAt).toLocaleDateString()}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getStatusColor(asset.status)}`}>
                              {asset.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="border-t border-neutral-100 bg-neutral-50/50 p-4">
              <button
                className="text-sm font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition w-full justify-center cursor-pointer"
                onClick={() => {
                  setShowAllAssets(true);
                  setSelectedCampaignId('');
                  setSelectedPostingId('');
                  setSelectedArticleFolderId('');
                  setSelectedArticleId(null);
                  setShowArticlesOverview(false);
                  if (currentCompany) fetchAllCompanyAssets(currentCompany.id);
                }}
              >
                View all assets <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* RECENT ARTICLES */}
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-neutral-400" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Recent Articles</h3>
              </div>
              <span className="bg-neutral-100 text-neutral-600 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono">
                {recentArticles.length}
              </span>
            </div>
            <div className="p-5 flex-1 flex flex-col space-y-4">
              {loading ? (
                <div className="flex-1 flex items-center justify-center py-12">
                  <div className="animate-spin w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full"></div>
                </div>
              ) : recentArticles.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                  <Edit3 className="w-10 h-10 text-neutral-300 mb-3" />
                  <p className="text-sm font-bold text-neutral-900">No articles yet</p>
                  <p className="text-xs text-neutral-500 mt-1 mb-4">Start drafting your first article to see it here.</p>
                  <button onClick={() => setShowArticlesOverview(true)} className="text-xs font-bold bg-neutral-900 text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition">
                    Write your first article
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentArticles.map(article => {
                    const folder = articleFolders.find(f => f.id === article.articleFolderId);
                    return (
                      <div key={article.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-neutral-50 border border-transparent hover:border-neutral-200 transition group cursor-pointer" onClick={() => {
                          setSelectedArticleFolderId(article.articleFolderId || '');
                          setSelectedArticleId(article.id);
                          setShowArticlesOverview(false);
                        }}>
                        {article.coverImage ? (
                          <div className="w-16 h-16 rounded-xl bg-neutral-100 border border-neutral-100 overflow-hidden flex-shrink-0 shadow-sm">
                            <img src={article.coverImage} alt="Cover" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-neutral-100 border border-neutral-100 flex-shrink-0 flex items-center justify-center shadow-sm">
                            <FileText className="w-8 h-8 text-neutral-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col h-20 justify-center">
                          <h4 className="text-sm font-medium tracking-tight text-neutral-900 truncate">{article.title}</h4>
                          <span className="text-xs text-neutral-500 mt-1 truncate">
                            {folder ? folder.name : 'Unknown Folder'}
                          </span>
                          <div className="flex items-center gap-2 mt-auto">
                            <span className="text-xs text-neutral-400">{article.createdAt ? new Date(article.createdAt).toLocaleDateString() : 'N/A'}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getStatusColor(article.status || 'Draft')}`}>
                              {article.status || 'Draft'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="border-t border-[#e5e5e5] bg-neutral-50 p-4">
              <button onClick={() => setShowArticlesOverview(true)} className="text-sm font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition w-full justify-center">
                View all articles <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
