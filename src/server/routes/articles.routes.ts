import { Router } from 'express';
import { RouteDeps } from '../types';
import { toCamel, toSnakeCase } from '../utils';
import { articleId, articleFolderId } from '../ids';

export default function articleRoutes(deps: RouteDeps): Router {
  const router = Router();
  const { supabase } = deps;

  router.get('/companies/:companyId/articles', async (req, res) => {
    const { companyId } = req.params;
    const { data: folders, error: fError } = await supabase.from('article_folders').select('id').eq('company_id', companyId);
    if (fError) return res.status(500).json({ error: fError.message });
    if (!folders || folders.length === 0) return res.json([]);

    const folderIds = folders.map(f => f.id);
    const { data: articles, error: aError } = await supabase.from('articles').select('*').in('article_folder_id', folderIds);
    if (aError) return res.status(500).json({ error: aError.message });
    res.json(toCamel(articles));
  });

  router.get('/companies/:companyId/article-folders', async (req, res) => {
    const { companyId } = req.params;
    const { data, error } = await supabase.from('article_folders').select('*').eq('company_id', companyId);
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  router.post('/companies/:companyId/article-folders', async (req, res) => {
    const { companyId } = req.params;
    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Folder name is required" });
    const newFolder = {
      id: articleFolderId(),
      companyId,
      name: name.trim(),
      description: description?.trim() || "",
      createdAt: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('article_folders').insert([toSnakeCase(newFolder)]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(toCamel(data));
  });

  router.delete('/article-folders/:id', async (req, res) => {
    const { id } = req.params;
    const { data: existing, error: fError } = await supabase.from('article_folders').select('id').eq('id', id).single();
    if (fError || !existing) return res.status(404).json({ error: "Article folder not found" });

    const { error: artDelError } = await supabase.from('articles').delete().eq('article_folder_id', id);
    if (artDelError) return res.status(500).json({ error: artDelError.message });
    const { error } = await supabase.from('article_folders').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Article folder and linked articles deleted" });
  });

  router.get('/article-folders/:folderId/articles', async (req, res) => {
    const { folderId } = req.params;
    const { data, error } = await supabase.from('articles').select('*').eq('article_folder_id', folderId);
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  router.post('/article-folders/:folderId/articles', async (req, res) => {
    const { folderId } = req.params;
    const { title, body, preparedBy, createdAt, coverImage, status } = req.body;
    if (!title?.trim() || !preparedBy?.trim()) {
      return res.status(400).json({ error: "Article title and 'Prepared By' are required." });
    }
    const newArticle = {
      id: articleId(),
      articleFolderId: folderId,
      title: title.trim(),
      body: body || "",
      preparedBy: preparedBy.trim(),
      createdAt: createdAt || new Date().toISOString().split("T")[0],
      coverImage: coverImage || "",
      status: status === 'Published' ? 'Published' : 'Draft',
    };
    const { data, error } = await supabase.from('articles').insert([toSnakeCase(newArticle)]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(toCamel(data));
  });

  router.get('/postings/:postingId/articles', async (req, res) => {
    const { postingId } = req.params;
    const { data, error } = await supabase.from('articles').select('*').eq('posting_folder_id', postingId);
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  router.post('/postings/:postingId/articles', async (req, res) => {
    const { postingId } = req.params;
    const { title, body, preparedBy, createdAt, coverImage } = req.body;
    if (!title?.trim() || !preparedBy?.trim()) {
      return res.status(400).json({ error: "Article title and 'Prepared By' author name are required." });
    }
    const newArticle = {
      id: articleId(),
      postingFolderId: postingId,
      title: title.trim(),
      body: body || "",
      preparedBy: preparedBy.trim(),
      createdAt: createdAt || new Date().toISOString().split("T")[0],
      coverImage: coverImage || "",
    };
    const { data, error } = await supabase.from('articles').insert([toSnakeCase(newArticle)]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(toCamel(data));
  });

  router.put('/articles/:id', async (req, res) => {
    const { id } = req.params;
    const { title, body, preparedBy, createdAt, coverImage, status } = req.body;
    const { data: existing, error: fError } = await supabase.from('articles').select('id').eq('id', id).single();
    if (fError || !existing) return res.status(404).json({ error: "Article not found." });

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title.trim();
    if (body !== undefined) updates.body = body;
    if (preparedBy !== undefined) updates.preparedBy = preparedBy.trim();
    if (createdAt !== undefined) updates.createdAt = createdAt;
    if (coverImage !== undefined) updates.coverImage = coverImage;
    if (status === 'Draft' || status === 'Published') updates.status = status;

    const { data, error } = await supabase.from('articles').update(toSnakeCase(updates)).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  router.delete('/articles/:id', async (req, res) => {
    const { id } = req.params;
    const { data: existing, error: fError } = await supabase.from('articles').select('id').eq('id', id).single();
    if (fError || !existing) return res.status(404).json({ error: "Article not found" });

    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Article successfully deleted" });
  });

  return router;
}
