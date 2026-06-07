import { useState, useEffect, useRef } from 'react';
import { Article, ArticleFolder, User } from '../types';
import { ToastType } from './useToast';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';

export interface UseArticlesParams {
  currentUser: User | null;
  currentCompanyId: string;
  addToast?: (type: ToastType, title: string, message: string) => void;
}

export interface UseArticlesReturn {
  articleFolders: ArticleFolder[];
  selectedArticleFolderId: string;
  setSelectedArticleFolderId: (id: string) => void;
  selectedArticleId: string | null;
  setSelectedArticleId: (id: string | null) => void;
  openArticleEditor: (articleId: string) => void;
  articles: Article[];
  allArticles: Article[];
  loadingArticles: boolean;
  showArticlesOverview: boolean;
  setShowArticlesOverview: (v: boolean) => void;
  articleTitle: string;
  setArticleTitle: (v: string) => void;
  articleBody: string;
  setArticleBody: (v: string) => void;
  articlePreparedBy: string;
  setArticlePreparedBy: (v: string) => void;
  articleDate: string;
  setArticleDate: (v: string) => void;
  articleError: string;
  setArticleError: (v: string) => void;
  articleCoverImage: string;
  setArticleCoverImage: (v: string) => void;
  handleSaveEditorArticle: (status?: 'Draft' | 'Published') => Promise<void>;
  handleDeleteArticle: (articleId: string) => void;
  fetchArticles: (folderId: string) => void;
  fetchArticleFolders: (companyId: string) => void;
  fetchRecentArticles: (companyId: string) => Promise<Article[]>;
  handleCreateArticleFolder: (name: string, description: string) => Promise<void>;
  handleDeleteArticleFolder: (id: string) => Promise<void>;
}

export function useArticles({ currentUser, currentCompanyId, addToast }: UseArticlesParams): UseArticlesReturn {
  const [articleFolders, setArticleFolders] = useState<ArticleFolder[]>([]);
  const [selectedArticleFolderId, setSelectedArticleFolderId] = useState<string>(() => localStorage.getItem('hub_article_folder') || '');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(() => localStorage.getItem('hub_article'));
  const [articles, setArticles] = useState<Article[]>([]);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [showArticlesOverview, setShowArticlesOverview] = useState(false);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleBody, setArticleBody] = useState('');
  const [articlePreparedBy, setArticlePreparedBy] = useState('');
  const [articleDate, setArticleDate] = useState('');
  const [articleError, setArticleError] = useState('');
  const [articleCoverImage, setArticleCoverImage] = useState('');

  const fetchArticleFolders = async (companyId: string) => {
    if (!currentUser) return;
    try {
      const data = await apiGet<ArticleFolder[]>(`/api/companies/${companyId}/article-folders`);
      setArticleFolders(data);
    } catch (err) { console.error(err); }
  };

  const fetchArticles = async (folderId: string) => {
    if (!currentUser) return;
    setLoadingArticles(true);
    try {
      const data = await apiGet<Article[]>(`/api/article-folders/${folderId}/articles`);
      setArticles(data);
    } catch (err) { console.error(err); }
    finally { setLoadingArticles(false); }
  };

  const fetchAllArticles = async (companyId: string) => {
    if (!currentUser) return;
    try {
      const data = await apiGet<Article[]>(`/api/companies/${companyId}/articles`);
      setAllArticles(data);
    } catch (err) { console.error(err); }
  };

  const fetchRecentArticles = async (companyId: string): Promise<Article[]> => {
    try {
      const data = await apiGet<Article[]>(`/api/companies/${companyId}/articles`);
      return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (currentCompanyId) {
      fetchArticleFolders(currentCompanyId);
    } else {
      setArticleFolders([]);
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSelectedArticleFolderId('');
    setSelectedArticleId(null);
    setShowArticlesOverview(false);
    localStorage.removeItem('hub_article_folder');
    localStorage.removeItem('hub_article');
  }, [currentCompanyId]);

  useEffect(() => {
    if (selectedArticleFolderId) {
      fetchArticles(selectedArticleFolderId);
      localStorage.setItem('hub_article_folder', selectedArticleFolderId);
    } else {
      setArticles([]);
      localStorage.removeItem('hub_article_folder');
    }
  }, [selectedArticleFolderId]);

  useEffect(() => {
    if (selectedArticleId) {
      localStorage.setItem('hub_article', selectedArticleId);
    } else {
      localStorage.removeItem('hub_article');
    }
  }, [selectedArticleId]);

  useEffect(() => {
    if (showArticlesOverview && currentCompanyId) {
      fetchAllArticles(currentCompanyId);
    }
  }, [showArticlesOverview, currentCompanyId]);

  const openArticleEditor = (articleId: string) => {
    setArticleError('');
    if (articleId === 'new') {
      setArticleTitle('');
      setArticleBody('');
      setArticlePreparedBy(currentUser?.username || '');
      setArticleDate('');
      setArticleCoverImage('');
    } else {
      const article = articles.find(a => a.id === articleId);
      if (article) {
        setArticleTitle(article.title);
        setArticleBody(article.body);
        setArticlePreparedBy(article.preparedBy);
        setArticleDate(article.createdAt?.substring(0, 10) || '');
        setArticleCoverImage(article.coverImage || '');
      }
    }
    setSelectedArticleId(articleId);
  };

  const handleSaveEditorArticle = async (status?: 'Draft' | 'Published') => {
    setArticleError('');
    if (!articleTitle.trim()) { setArticleError('Title is required.'); return; }
    if (!articlePreparedBy.trim()) { setArticleError('Author name is required.'); return; }

    if (selectedArticleId === 'new') {
      if (!selectedArticleFolderId) { setArticleError('No article folder selected.'); return; }
      try {
        const created = await apiPost<Article>(`/api/article-folders/${selectedArticleFolderId}/articles`, {
          title: articleTitle, body: articleBody, preparedBy: articlePreparedBy,
          createdAt: articleDate || undefined, coverImage: articleCoverImage || undefined,
          status: status ?? 'Draft',
        });
        setArticles(prev => [created, ...prev]);
        setSelectedArticleId(created.id);
        const toastMsg = status === 'Published' ? 'Article published' : 'Draft saved';
        addToast?.('success', toastMsg, created.title);
      } catch (err: any) { setArticleError(err.message || 'Failed to create article.'); }
    } else if (selectedArticleId) {
      try {
        const updated = await apiPut<Article>(`/api/articles/${selectedArticleId}`, {
          title: articleTitle, body: articleBody, preparedBy: articlePreparedBy,
          createdAt: articleDate || undefined, coverImage: articleCoverImage || undefined,
          status: status,
        });
        setArticles(prev => prev.map(a => a.id === selectedArticleId ? updated : a));
        const toastMsg = status === 'Published' ? 'Article published' : 'Draft saved';
        addToast?.('success', toastMsg, updated.title);
      } catch (err: any) { setArticleError(err.message || 'Failed to save article.'); }
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!window.confirm('Delete this article?')) return;
    try {
      await apiDelete(`/api/articles/${articleId}`);
      setArticles(prev => prev.filter(a => a.id !== articleId));
      if (selectedArticleId === articleId) setSelectedArticleId(null);
      addToast?.('success', 'Article Deleted', 'Article deleted.');
    } catch (err) { console.error(err); }
  };

  const handleCreateArticleFolder = async (name: string, description: string) => {
    if (!currentCompanyId) return;
    try {
      const created = await apiPost<ArticleFolder>(`/api/companies/${currentCompanyId}/article-folders`, { name, description });
      setArticleFolders(prev => [...prev, created]);
      setSelectedArticleFolderId(created.id); // auto-navigate into the new folder
      addToast?.('success', 'Folder Created', created.name);
    } catch (err: any) { throw err; }
  };

  const handleDeleteArticleFolder = async (id: string) => {
    if (!window.confirm('Delete this article folder and all articles inside?')) return;
    try {
      await apiDelete(`/api/article-folders/${id}`);
      setArticleFolders(prev => prev.filter(f => f.id !== id));
      if (selectedArticleFolderId === id) {
        setSelectedArticleFolderId('');
        setArticles([]);
        setSelectedArticleId(null);
      }
      addToast?.('success', 'Folder Deleted', 'Article folder removed.');
    } catch (err) { console.error(err); }
  };

  return {
    articleFolders,
    selectedArticleFolderId, setSelectedArticleFolderId,
    selectedArticleId, setSelectedArticleId,
    openArticleEditor,
    articles, allArticles, loadingArticles,
    showArticlesOverview, setShowArticlesOverview,
    articleTitle, setArticleTitle,
    articleBody, setArticleBody,
    articlePreparedBy, setArticlePreparedBy,
    articleDate, setArticleDate,
    articleError, setArticleError,
    articleCoverImage, setArticleCoverImage,
    handleSaveEditorArticle, handleDeleteArticle, fetchArticles,
    fetchArticleFolders, fetchRecentArticles, handleCreateArticleFolder, handleDeleteArticleFolder,
  };
}
