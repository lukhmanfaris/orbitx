import { Router } from 'express';
import { RouteDeps } from '../types';
import { toCamel, toSnakeCase } from '../utils';
import { companyId } from '../ids';
import * as v from '../middleware/validators';
import { handleValidation } from '../middleware/validate';

export default function companyRoutes(deps: RouteDeps): Router {
  const router = Router();
  const { supabase } = deps;

  router.get('/companies', async (req, res) => {
    const { data, error } = await supabase.from('companies').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  router.post('/companies', v.createCompany, handleValidation, async (req, res) => {
    const { name, logoText, logoType, logoData, description, logoUrl } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: "Company name is required" });
    }
    const newCompany = {
      id: companyId(),
      name: name.trim(),
      logoText: (logoText?.trim() || name.trim().substring(0, 3)).toUpperCase(),
      accentColor: "neutral",
      description: description || "",
      logoUrl: logoUrl || "",
      logoType: logoType || "none",
      logoData: logoData || ""
    };
    const { data, error } = await supabase.from('companies').insert([toSnakeCase(newCompany)]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  router.put('/companies/:companyId', v.updateCompany, handleValidation, async (req, res) => {
    const { companyId } = req.params;
    const { name, description, logoUrl, logoType, logoData, logoText } = req.body;
    const { data: existing, error: fetchError } = await supabase.from('companies').select('id').eq('id', companyId).single();
    if (fetchError || !existing) return res.status(404).json({ error: "Company not found" });

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (logoUrl !== undefined) updates.logoUrl = logoUrl;
    if (logoType !== undefined) updates.logoType = logoType;
    if (logoData !== undefined) updates.logoData = logoData;
    if (logoText !== undefined) updates.logoText = logoText;

    const { data, error } = await supabase.from('companies').update(toSnakeCase(updates)).eq('id', companyId).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  router.get('/companies/:companyId/stats', async (req, res) => {
    const { companyId } = req.params;
    const { count: campaignCount, error: cError } = await supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('company_id', companyId);
    if (cError) return res.status(500).json({ error: cError.message });

    const { data: campaigns, error: c2Error } = await supabase.from('campaigns').select('id').eq('company_id', companyId);
    if (c2Error) return res.status(500).json({ error: c2Error.message });
    const campaignIds = (campaigns || []).map(c => c.id);

    let postingFolderCount = 0;
    let assetCount = 0;
    if (campaignIds.length > 0) {
      const { count: pCount, error: pError } = await supabase.from('posting_folders').select('*', { count: 'exact', head: true }).in('campaign_id', campaignIds);
      if (pError) return res.status(500).json({ error: pError.message });
      postingFolderCount = pCount || 0;

      const { data: postings, error: p2Error } = await supabase.from('posting_folders').select('id').in('campaign_id', campaignIds);
      if (p2Error) return res.status(500).json({ error: p2Error.message });
      const postingIds = (postings || []).map(p => p.id);

      if (postingIds.length > 0) {
        const { count: aCount, error: aError } = await supabase.from('assets').select('*', { count: 'exact', head: true }).in('posting_folder_id', postingIds);
        if (aError) return res.status(500).json({ error: aError.message });
        assetCount = aCount || 0;
      }
    }

    const { count: articleFolderCount, error: afError } = await supabase.from('article_folders').select('*', { count: 'exact', head: true }).eq('company_id', companyId);
    if (afError) return res.status(500).json({ error: afError.message });

    const { data: articleFolders, error: af2Error } = await supabase.from('article_folders').select('id').eq('company_id', companyId);
    if (af2Error) return res.status(500).json({ error: af2Error.message });
    const articleFolderIds = (articleFolders || []).map(f => f.id);

    let articleCount = 0;
    if (articleFolderIds.length > 0) {
      const { count: artCount, error: artError } = await supabase.from('articles').select('*', { count: 'exact', head: true }).in('article_folder_id', articleFolderIds);
      if (artError) return res.status(500).json({ error: artError.message });
      articleCount = artCount || 0;
    }

    res.json({
      campaigns: campaignCount || 0,
      postingFolders: postingFolderCount,
      assets: assetCount,
      articleFolders: articleFolderCount || 0,
      articles: articleCount,
    });
  });

  router.delete('/companies/:id', async (req, res) => {
    const { id } = req.params;
    const { data: company, error: fError } = await supabase.from('companies').select('id').eq('id', id).single();
    if (fError || !company) return res.status(404).json({ error: "Company not found" });

    const { data: campaigns, error: cError } = await supabase.from('campaigns').select('id').eq('company_id', id);
    if (cError) return res.status(500).json({ error: cError.message });
    const campaignIds = (campaigns || []).map(c => c.id);

    const { data: postings, error: pError } = await supabase.from('posting_folders').select('id').in('campaign_id', campaignIds.length > 0 ? campaignIds : ['__none__']);
    if (pError) return res.status(500).json({ error: pError.message });
    const postingIds = (postings || []).map(p => p.id);

    const { data: articleFolders, error: afError } = await supabase.from('article_folders').select('id').eq('company_id', id);
    if (afError) return res.status(500).json({ error: afError.message });
    const articleFolderIds = (articleFolders || []).map(f => f.id);

    let deletedAssetCount = 0;
    let deletedArticleCount = 0;

    if (postingIds.length > 0) {
      const { count: aCount } = await supabase.from('assets').select('*', { count: 'exact', head: true }).in('posting_folder_id', postingIds);
      deletedAssetCount = aCount || 0;
      const { error: aDelError } = await supabase.from('assets').delete().in('posting_folder_id', postingIds);
      if (aDelError) return res.status(500).json({ error: aDelError.message });
      const { error: artDelError } = await supabase.from('articles').delete().in('posting_folder_id', postingIds);
      if (artDelError) return res.status(500).json({ error: artDelError.message });
    }

    if (articleFolderIds.length > 0) {
      const { count: artCount } = await supabase.from('articles').select('*', { count: 'exact', head: true }).in('article_folder_id', articleFolderIds);
      deletedArticleCount = artCount || 0;
      const { error: artDelError2 } = await supabase.from('articles').delete().in('article_folder_id', articleFolderIds);
      if (artDelError2) return res.status(500).json({ error: artDelError2.message });
    }

    const { error: pfDelError } = await supabase.from('posting_folders').delete().in('campaign_id', campaignIds.length > 0 ? campaignIds : ['__none__']);
    if (pfDelError) return res.status(500).json({ error: pfDelError.message });
    const { error: c2DelError } = await supabase.from('campaigns').delete().eq('company_id', id);
    if (c2DelError) return res.status(500).json({ error: c2DelError.message });
    const { error: afDelError } = await supabase.from('article_folders').delete().eq('company_id', id);
    if (afDelError) return res.status(500).json({ error: afDelError.message });
    const { error: coDelError } = await supabase.from('companies').delete().eq('id', id);
    if (coDelError) return res.status(500).json({ error: coDelError.message });

    res.json({
      campaigns: campaignIds.length,
      postingFolders: postingIds.length,
      assets: deletedAssetCount,
      articleFolders: articleFolderIds.length,
      articles: deletedArticleCount,
    });
  });

  return router;
}
