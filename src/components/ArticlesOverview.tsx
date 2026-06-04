import React from 'react';
import { motion } from 'motion/react';
import { FileText, ChevronRight, FolderOpen } from 'lucide-react';
import { useAppContext } from '../AppContext';

export default function ArticlesOverview() {
  const {
    articleFolders,
    allArticles,
    setSelectedArticleFolderId,
    setShowArticlesOverview,
    setSelectedCampaignId,
    setSelectedPostingId,
    setSelectedArticleId,
  } = useAppContext();

  const handleSelectFolder = (folderId: string) => {
    setSelectedCampaignId('');
    setSelectedPostingId('');
    setSelectedArticleId(null);
    setSelectedArticleFolderId(folderId);
    setShowArticlesOverview(false);
  };

  return (
    <div className="p-6 flex-1 flex flex-col space-y-6">
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1">
          <FileText className="w-3.5 h-3.5" />
          <span>Articles</span>
        </div>
        <h3 className="text-sm font-extrabold text-neutral-900 uppercase font-mono tracking-wider">
          All Articles
        </h3>
        <p className="text-xs text-neutral-500 mt-1">
          {articleFolders.length} folder{articleFolders.length !== 1 ? 's' : ''} · {allArticles.length} article{allArticles.length !== 1 ? 's' : ''} total
        </p>
      </div>

      {articleFolders.length === 0 ? (
        <div className="text-center py-16 bg-white border-2 border-dashed border-neutral-200 rounded-2xl">
          <div className="mx-auto w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center mb-3">
            <FolderOpen className="w-5 h-5 text-neutral-400" />
          </div>
          <h4 className="text-sm font-semibold tracking-tight text-neutral-900">No article folders yet</h4>
          <p className="text-xs text-neutral-400 mt-1">Create a folder from the sidebar to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articleFolders.map(folder => {
            const folderArticles = allArticles.filter(a => a.articleFolderId === folder.id);
            const latest = folderArticles.sort((a, b) => {
              const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return bDate - aDate;
            })[0];

            return (
              <motion.div
                key={folder.id}
                onClick={() => handleSelectFolder(folder.id)}
                className="group bg-white border border-neutral-100 rounded-2xl shadow-sm p-5 cursor-pointer flex flex-col gap-3"
                whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 flex-shrink-0">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300 mt-0.5 flex-shrink-0" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold tracking-tight text-neutral-900 truncate">{folder.name}</h4>
                  {folder.description && (
                    <p className="text-xs text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">{folder.description}</p>
                  )}
                </div>

                <div className="border-t border-neutral-100 pt-3 space-y-1.5">
                  <p className="text-sm text-neutral-400">
                    {folderArticles.length} article{folderArticles.length !== 1 ? 's' : ''}
                  </p>
                  {latest ? (
                    <div className="flex items-start gap-1.5">
                      <FileText className="w-3 h-3 text-neutral-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs text-neutral-400 truncate mt-2">{latest.title || 'Untitled'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400 italic">No articles yet</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
