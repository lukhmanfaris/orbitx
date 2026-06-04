import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Plus, Trash2, ChevronDown, FolderOpen } from 'lucide-react';
import { Role, ArticleFolder, Article } from '../../types';

const blurFade = {
  initial: { opacity: 0, filter: 'blur(4px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(4px)' },
  transition: { duration: 0.2, ease: 'easeOut' },
} as const;

interface Props {
  filteredArticles: ArticleFolder[];
  articles: Article[];
  selectedArticleFolderId: string;
  selectedArticleId: string | null;
  currentUserRole: Role;
  searchQuery: string;
  handleCreateArticleFolder: (name: string, description: string) => Promise<void>;
  handleDeleteArticleFolder: (id: string) => void;
  handleDeleteArticle: (id: string) => void;
  openArticleEditor: (id: string) => void;
  onSelectArticleFolder: (folderId: string, isSelected: boolean) => void;
  onShowArticlesOverview: () => void;
  onAfterFolderCreated: () => void;
  onMobileClose: () => void;
  isSidebarCollapsed: boolean;
}

export default function SidebarArticles({
  filteredArticles, articles, selectedArticleFolderId, selectedArticleId,
  currentUserRole, searchQuery, handleCreateArticleFolder,
  handleDeleteArticleFolder, handleDeleteArticle, openArticleEditor,
  onSelectArticleFolder, onShowArticlesOverview, onAfterFolderCreated, onMobileClose,
  isSidebarCollapsed,
}: Props) {
  const [isCreatingArticleFolder, setIsCreatingArticleFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [folderFormError, setFolderFormError] = useState('');
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null);
  const [hoveredArticleId, setHoveredArticleId] = useState<string | null>(null);

  const handleSubmitArticleFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFolderFormError('');
    if (!newFolderName.trim()) { setFolderFormError('Folder name is required.'); return; }
    try {
      await handleCreateArticleFolder(newFolderName.trim(), newFolderDescription.trim());
      onAfterFolderCreated();
      setNewFolderName('');
      setNewFolderDescription('');
      setIsCreatingArticleFolder(false);
    } catch (err: any) {
      setFolderFormError(err.message || 'Failed to create folder.');
    }
  };

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {isSidebarCollapsed ? (
        <motion.div key="collapsed" {...blurFade} className="flex flex-col items-center gap-1 py-2 px-1 border-t border-neutral-200/60">
          {filteredArticles.map(folder => {
            const isSelected = folder.id === selectedArticleFolderId;
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => onSelectArticleFolder(folder.id, isSelected)}
                title={folder.name}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </motion.div>
      ) : (
        <motion.div key="expanded" {...blurFade}>
          {/* Section header */}
          <div className="px-3 pt-3 pb-1 mb-1 flex items-center justify-between border-t border-neutral-200/60 mt-1">
            <button
              type="button"
              onClick={onShowArticlesOverview}
              className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest hover:text-neutral-900 transition-colors"
            >
              ARTICLES
            </button>
            {currentUserRole === Role.TeamLead && (
              <button
                type="button"
                onClick={() => setIsCreatingArticleFolder(!isCreatingArticleFolder)}
                className="p-0.5 rounded hover:bg-neutral-200 text-neutral-400 hover:text-neutral-600 transition-colors"
                title="New Article Folder"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {isCreatingArticleFolder && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-neutral-50 border-b border-neutral-200 overflow-hidden"
              >
                <form onSubmit={handleSubmitArticleFolder} className="p-3 space-y-2">
                  <input
                    type="text"
                    className="w-full text-xs p-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 transition-colors"
                    placeholder="Folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    autoFocus
                  />
                  <input
                    type="text"
                    className="w-full text-xs p-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 transition-colors"
                    placeholder="Description (optional)"
                    value={newFolderDescription}
                    onChange={(e) => setNewFolderDescription(e.target.value)}
                  />
                  {folderFormError && <p className="text-[9px] text-red-600 font-medium">{folderFormError}</p>}
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-medium py-1.5 rounded-lg transition-colors">Create</button>
                    <button
                      type="button"
                      onClick={() => { setIsCreatingArticleFolder(false); setFolderFormError(''); }}
                      className="bg-white border border-neutral-200 text-neutral-600 text-[11px] px-3 py-1.5 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Article folder list */}
          <div className="px-2 py-1 space-y-0.5 flex-1">
            {filteredArticles.length === 0 ? (
              <div className="p-4 text-center">
                <FileText className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs text-neutral-400">{searchQuery.trim() ? 'No matches found' : 'No article folders'}</p>
              </div>
            ) : (
              filteredArticles.map(folder => {
                const isSelected = folder.id === selectedArticleFolderId;

                return (
                  <div key={folder.id}>
                    <div
                      onMouseEnter={() => setHoveredFolderId(folder.id)}
                      onMouseLeave={() => setHoveredFolderId(null)}
                      onClick={() => onSelectArticleFolder(folder.id, isSelected)}
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
                        {hoveredFolderId === folder.id && !isSelected && (
                          <motion.span
                            layoutId="article-hover-bg"
                            className="absolute inset-0 bg-neutral-200/50 rounded-lg z-0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          />
                        )}
                      </AnimatePresence>
                      <FolderOpen className={`relative z-10 w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-neutral-700' : 'text-neutral-400'}`} />
                      <div className="relative z-10 flex-1 min-w-0">
                        <p className={`text-sm tracking-tight truncate ${isSelected ? 'text-neutral-900 font-medium' : 'text-neutral-500'}`}>{folder.name}</p>
                        {folder.description && <p className="text-[10px] text-neutral-400 truncate">{folder.description}</p>}
                      </div>
                      <div className="relative z-10 flex items-center gap-0.5">
                        {currentUserRole === Role.TeamLead && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteArticleFolder(folder.id); }}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-neutral-400 hover:text-red-600"
                            title="Delete Folder"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isSelected ? 'rotate-0' : '-rotate-90'}`} />
                      </div>
                    </div>

                    {/* Articles sub-list */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="ml-4 border-l border-neutral-200 pl-2 space-y-0.5 mt-0.5 overflow-hidden"
                        >
                          {articles.length === 0 && (
                            <p className="text-[10px] text-neutral-400 py-2 pl-1 italic">No articles yet</p>
                          )}
                          {articles.map(article => {
                            const isArticleSelected = selectedArticleId === article.id;
                            return (
                              <div
                                key={article.id}
                                onMouseEnter={() => setHoveredArticleId(article.id)}
                                onMouseLeave={() => setHoveredArticleId(null)}
                                onClick={() => { openArticleEditor(article.id); onMobileClose(); }}
                                className="relative group px-3 py-2.5 rounded-lg cursor-pointer flex items-center gap-2"
                              >
                                {/* Selected background */}
                                <AnimatePresence>
                                  {isArticleSelected && (
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
                                  {hoveredArticleId === article.id && !isArticleSelected && (
                                    <motion.span
                                      layoutId="article-item-hover-bg"
                                      className="absolute inset-0 bg-neutral-200/50 rounded-lg z-0"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                    />
                                  )}
                                </AnimatePresence>
                                <FileText className={`relative z-10 w-3 h-3 flex-shrink-0 ${isArticleSelected ? 'text-neutral-700' : 'text-neutral-400'}`} />
                                <div className="relative z-10 flex-1 min-w-0">
                                  <p className={`text-sm tracking-tight truncate ${isArticleSelected ? 'text-neutral-900 font-medium' : 'text-neutral-500'}`}>{article.title || 'Untitled'}</p>
                                </div>
                                {currentUserRole !== Role.Designer && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteArticle(article.id); }}
                                    className="relative z-10 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-neutral-400 hover:text-red-600"
                                    title="Delete Article"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}

                          <div className="pt-0.5 pb-1 pl-1">
                            <button
                              type="button"
                              onClick={() => { openArticleEditor('new'); onMobileClose(); }}
                              className="w-full text-[10px] font-medium text-neutral-400 hover:text-neutral-600 py-1.5 flex items-center justify-center gap-1 border border-dashed border-neutral-200 rounded-lg hover:border-neutral-400 hover:bg-neutral-100 transition-colors"
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
