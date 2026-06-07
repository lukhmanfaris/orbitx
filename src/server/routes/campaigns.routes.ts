import { Router } from 'express';
import { RouteDeps } from '../types';
import { toCamel, toSnakeCase } from '../utils';
import { campaignId, postingFolderId } from '../ids';
import * as v from '../middleware/validators';
import { handleValidation } from '../middleware/validate';

export default function campaignRoutes(deps: RouteDeps): Router {
  const router = Router();
  const { supabase } = deps;

  router.get('/companies/:companyId/campaigns', async (req, res) => {
    const { companyId } = req.params;
    const { data, error } = await supabase.from('campaigns').select('*').eq('company_id', companyId);
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  router.post('/companies/:companyId/campaigns', v.createCampaign, handleValidation, async (req, res) => {
    const { companyId } = req.params;
    const { name, description, projectType } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Campaign name is required" });
    const newCampaign = {
      id: campaignId(),
      companyId,
      name: name.trim(),
      description: description?.trim() || "",
      createdAt: new Date().toISOString(),
      projectType: projectType || "both"
    };
    const { data, error } = await supabase.from('campaigns').insert([toSnakeCase(newCampaign)]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(toCamel(data));
  });

  router.get('/companies/:companyId/campaign-counts', async (req, res) => {
    const { companyId } = req.params;
    const { data: campaigns, error: cError } = await supabase.from('campaigns').select('id').eq('company_id', companyId);
    if (cError) return res.status(500).json({ error: cError.message });
    if (!campaigns || campaigns.length === 0) return res.json([]);

    const campaignIds = campaigns.map(c => c.id);
    const { data: postings, error: pError } = await supabase.from('posting_folders').select('campaign_id').in('campaign_id', campaignIds);
    if (pError) return res.status(500).json({ error: pError.message });

    const counts: Record<string, number> = {};
    campaignIds.forEach(id => { counts[id] = 0; });
    (postings || []).forEach(p => { counts[p.campaign_id] = (counts[p.campaign_id] || 0) + 1; });

    res.json(campaignIds.map(id => ({ campaignId: id, postingCount: counts[id] })));
  });

  router.delete('/campaigns/:id', async (req, res) => {
    const { id } = req.params;
    const { data: campaign, error: cError } = await supabase.from('campaigns').select('id').eq('id', id).single();
    if (cError || !campaign) return res.status(404).json({ error: "Campaign not found" });

    const { data: postings, error: pError } = await supabase.from('posting_folders').select('id').eq('campaign_id', id);
    if (pError) return res.status(500).json({ error: pError.message });
    const postingIds = (postings || []).map(p => p.id);

    let deletedAssetCount = 0;
    if (postingIds.length > 0) {
      const { count } = await supabase.from('assets').select('*', { count: 'exact', head: true }).in('posting_folder_id', postingIds);
      deletedAssetCount = count || 0;

      const { error: aDelError } = await supabase.from('assets').delete().in('posting_folder_id', postingIds);
      if (aDelError) return res.status(500).json({ error: aDelError.message });
      const { error: artDelError } = await supabase.from('articles').delete().in('posting_folder_id', postingIds);
      if (artDelError) return res.status(500).json({ error: artDelError.message });
    }

    const { error: pfDelError } = await supabase.from('posting_folders').delete().eq('campaign_id', id);
    if (pfDelError) return res.status(500).json({ error: pfDelError.message });
    const { error: cDelError } = await supabase.from('campaigns').delete().eq('id', id);
    if (cDelError) return res.status(500).json({ error: cDelError.message });

    res.json({ postingCount: postingIds.length, assetCount: deletedAssetCount });
  });

  router.get('/campaigns/:campaignId/postings', async (req, res) => {
    const { campaignId } = req.params;
    const { data, error } = await supabase.from('posting_folders').select('*').eq('campaign_id', campaignId);
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  router.post('/campaigns/:campaignId/postings', v.createPosting, handleValidation, async (req, res) => {
    const { campaignId } = req.params;
    const { name, description, projectType } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Posting folder name is required" });
    const newPosting = {
      id: postingFolderId(),
      campaignId,
      name: name.trim(),
      description: description?.trim() || "",
      createdAt: new Date().toISOString(),
      projectType: projectType || "both"
    };
    const { data, error } = await supabase.from('posting_folders').insert([toSnakeCase(newPosting)]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(toCamel(data));
  });

  router.delete('/postings/:postingId', async (req, res) => {
    const { postingId } = req.params;
    const { data: posting, error: fError } = await supabase.from('posting_folders').select('id').eq('id', postingId).single();
    if (fError || !posting) return res.status(404).json({ error: "Posting folder not found" });

    const { error: aDelError } = await supabase.from('assets').delete().eq('posting_folder_id', postingId);
    if (aDelError) return res.status(500).json({ error: aDelError.message });
    const { error: artDelError } = await supabase.from('articles').delete().eq('posting_folder_id', postingId);
    if (artDelError) return res.status(500).json({ error: artDelError.message });
    const { error: pfDelError } = await supabase.from('posting_folders').delete().eq('id', postingId);
    if (pfDelError) return res.status(500).json({ error: pfDelError.message });

    res.json({ message: "Posting folder and linked assets deleted" });
  });

  return router;
}
