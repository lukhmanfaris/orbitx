import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { RouteDeps } from '../types';
import { toCamel, toSnakeCase } from '../utils';
import { assetId } from '../ids';
import { AssetStatus } from '../../types';
import * as v from '../middleware/validators';
import { handleValidation } from '../middleware/validate';

export default function assetRoutes(deps: RouteDeps): Router {
  const router = Router();
  const { supabase, r2, upload: uploadMiddleware } = deps;

  router.get('/postings/:postingId/assets', async (req, res) => {
    const { postingId } = req.params;
    const { data, error } = await supabase.from('assets').select('*').eq('posting_folder_id', postingId);
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  router.get('/companies/:companyId/assets', async (req, res) => {
    const { companyId } = req.params;
    const { data: campaigns, error: cError } = await supabase.from('campaigns').select('id').eq('company_id', companyId);
    if (cError) return res.status(500).json({ error: cError.message });
    if (!campaigns || campaigns.length === 0) return res.json([]);

    const campaignIds = campaigns.map(c => c.id);
    const { data: postings, error: pError } = await supabase.from('posting_folders').select('id, campaign_id').in('campaign_id', campaignIds);
    if (pError) return res.status(500).json({ error: pError.message });
    if (!postings || postings.length === 0) return res.json([]);

    const postingIds = postings.map(p => p.id);
    const { data: assets, error: aError } = await supabase.from('assets').select('*').in('posting_folder_id', postingIds);
    if (aError) return res.status(500).json({ error: aError.message });

    const postingMap = new Map(postings.map(p => [p.id, p]));
    const enrichedAssets = (assets || []).map((asset: any) => {
      const posting = postingMap.get(asset.posting_folder_id);
      return { ...toCamel(asset), campaignId: posting?.campaign_id || '' };
    });
    res.json(enrichedAssets);
  });

  router.get('/companies/:companyId/all-assets', async (req, res) => {
    const { companyId } = req.params;
    const { data: campaigns, error: cError } = await supabase.from('campaigns').select('id, name').eq('company_id', companyId);
    if (cError) return res.status(500).json({ error: cError.message });
    if (!campaigns || campaigns.length === 0) return res.json([]);

    const campaignIds = campaigns.map(c => c.id);
    const campaignMap = new Map(campaigns.map(c => [c.id, c]));

    const { data: postings, error: pError } = await supabase.from('posting_folders').select('id, name, campaign_id').in('campaign_id', campaignIds);
    if (pError) return res.status(500).json({ error: pError.message });
    if (!postings || postings.length === 0) return res.json([]);

    const postingIds = postings.map(p => p.id);
    const postingMap = new Map(postings.map(p => [p.id, p]));

    const { data: assets, error: aError } = await supabase.from('assets').select('*').in('posting_folder_id', postingIds).order('created_at', { ascending: false });
    if (aError) return res.status(500).json({ error: aError.message });

    const enrichedAssets = (assets || []).map((a: any) => {
      const posting = postingMap.get(a.posting_folder_id);
      const campaign = posting ? campaignMap.get(posting.campaign_id) : undefined;
      return { ...toCamel(a), postingName: posting?.name, campaignId: campaign?.id };
    });
    res.json(enrichedAssets);
  });

  router.get('/assets', async (req, res) => {
    const { data, error } = await supabase.from('assets').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  router.post('/assets', v.createAsset, handleValidation, async (req, res) => {
    const { postingFolderId, s3FileUrl, fileType, captionText, artworkComment, revisedCaption, scheduledDate, status, uploadedBy } = req.body;
    if (!postingFolderId || !s3FileUrl) return res.status(400).json({ error: "Posting Folder ID and File URL are required" });

    let user: any;
    if (uploadedBy) {
      const { data: foundUser } = await supabase.from('users').select('*').eq('id', uploadedBy).single();
      user = foundUser;
    }
    if (!user) {
      const { data: firstUser } = await supabase.from('users').select('*').limit(1).single();
      user = firstUser;
    }
    const camelUser = toCamel(user);

    const newAsset = {
      id: assetId(),
      postingFolderId,
      s3FileUrl,
      fileType: fileType || "",
      captionText: captionText || "",
      artworkComment: artworkComment || "",
      revisedCaption: revisedCaption || "",
      scheduledDate: scheduledDate || new Date().toISOString().split("T")[0],
      status: status || AssetStatus.Drafting,
      uploadedBy: camelUser?.id,
      uploadedByName: camelUser?.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const { data, error } = await supabase.from('assets').insert([toSnakeCase(newAsset)]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(toCamel(data));
  });

  router.put('/assets/:id/status', v.updateAssetStatus, handleValidation, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status value is required" });

    const { data: existing, error: fError } = await supabase.from('assets').select('id').eq('id', id).single();
    if (fError || !existing) return res.status(404).json({ error: "Asset not found" });

    const { data, error } = await supabase.from('assets').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  router.put('/assets/:id', v.updateAsset, handleValidation, async (req, res) => {
    const { id } = req.params;
    const { captionText, artworkComment, revisedCaption, scheduledDate, status, postingFolderId } = req.body;

    const { data: existing, error: fError } = await supabase.from('assets').select('id').eq('id', id).single();
    if (fError || !existing) return res.status(404).json({ error: "Asset not found" });

    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (captionText !== undefined) updates.captionText = captionText;
    if (artworkComment !== undefined) updates.artworkComment = artworkComment;
    if (revisedCaption !== undefined) updates.revisedCaption = revisedCaption;
    if (scheduledDate !== undefined) updates.scheduledDate = scheduledDate;
    if (status !== undefined) updates.status = status;
    if (postingFolderId !== undefined) updates.postingFolderId = postingFolderId;

    const { data, error } = await supabase.from('assets').update(toSnakeCase(updates)).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  router.delete('/assets/:id', async (req, res) => {
    const { id } = req.params;
    const { data: asset, error: fError } = await supabase.from('assets').select('s3_file_url').eq('id', id).single();
    if (fError || !asset) return res.status(404).json({ error: "Asset not found" });

    const s3FileUrl = asset.s3_file_url;
    if (s3FileUrl && s3FileUrl.startsWith("/uploads/")) {
      const fileKey = s3FileUrl.replace("/uploads/", "");
      const filePath = path.join(deps.uploadsDir, fileKey);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); console.log(`Cleaned up physical file: ${fileKey}`); }
        catch (err) { console.error(`Failed to delete physical file: ${filePath}`, err); }
      }
    }

    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Asset successfully deleted from registry" });
  });

  router.post('/upload', uploadMiddleware.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }

      const key = `uploads/${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

      await r2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      }));

      const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
      res.json({ publicUrl, fileType: req.file.mimetype });
    } catch (err: any) {
      console.error("Failed to upload to R2", err);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  return router;
}
