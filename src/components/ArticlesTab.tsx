import React from 'react';
import { Plus, FileText, Trash2, User, ChevronRight } from 'lucide-react';
import { Role } from '../types';
import { useAppContext } from '../AppContext';
import { SkeletonArticleRow } from './common/Skeleton';

export default function ArticlesTab() {
  const {
    currentUser,
    articleFolders, selectedArticleFolderId,
    articles, loadingArticles,
    openArticleEditor, handleDeleteArticle,
  } = useAppContext();

  if (!currentUser) return null;

  const selectedFolder = articleFolders.find(f => f.id === selectedArticleFolderId);

  return (
    <div className="p-6 flex-1 flex flex-col space-y-6">
      {/* Folder header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Articles</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-neutral-700 font-bold">{selectedFolder?.name || 'Folder'}</span>
          </div>
          <h3 className="text-sm font-extrabold text-neutral-900 uppercase font-mono tracking-wider">
            {selectedFolder?.name}
          </h3>
          {selectedFolder?.description && (
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{selectedFolder.description}</p>
          )}
        </div>
        {(currentUser.role === Role.ContentWriter || currentUser.role === Role.TeamLead) && (
          <button
            type="button"
            onClick={() => openArticleEditor('new')}
            className="font-mono text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-2 transition-all shadow-xs flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Article</span>
          </button>
        )}
      </div>

      {/* Article list */}
      {loadingArticles ? (
        <div className="space-y-6">
          {[1, 2].map(i => <SkeletonArticleRow key={i} />)}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 bg-white border border-neutral-200 rounded-2xl shadow-xs">
          <div className="mx-auto w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wide">No articles yet</h4>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Create the first article in this folder.
          </p>
          {(currentUser.role === Role.ContentWriter || currentUser.role === Role.TeamLead) && (
            <button
              type="button"
              onClick={() => openArticleEditor('new')}
              className="mt-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              New Article
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map(article => {
            const plainBody = (article.body || '').replace(/[#*_~`>\[\]\(\)\-]/g, '').trim();
            const previewText = plainBody.substring(0, 80) + (plainBody.length > 80 ? '...' : '');
            return (
            <div
              key={article.id}
              onClick={() => openArticleEditor(article.id)}
              className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs cursor-pointer hover:border-neutral-400 hover:shadow-sm transition-all group flex items-start gap-4"
            >
              {article.coverImage && (
                <img src={article.coverImage} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-neutral-900 truncate group-hover:text-neutral-700 transition-colors">
                  {article.title || 'Untitled Article'}
                </h4>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed font-sans">
                  {previewText || 'No content yet.'}
                </p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-400 font-mono">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />{article.preparedBy}
                  </span>
                  {article.createdAt && (
                    <span>{new Date(article.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  )}
                  <span>{article.body ? `${article.body.split(/\s+/).filter(Boolean).length} words` : '0 words'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-600 transition-colors" />
                {currentUser.role !== Role.Designer && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDeleteArticle(article.id); }}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete article"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
