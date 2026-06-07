import dotenv from "dotenv";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { authMiddleware } from "./src/server/middleware/auth";
import { Role, AssetStatus, Company, User, Campaign, PostingFolder, Asset, ArticleFolder, Article } from "./src/types";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function toCamel(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        toCamel(v)
      ])
    );
  }
  return obj;
}

function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`),
        toSnakeCase(v)
      ])
    );
  }
  return obj;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use("/uploads", express.static(UPLOADS_DIR));
  app.use('/api', authMiddleware);

  app.get("/api/companies", async (req, res) => {
    const { data, error } = await supabase.from('companies').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  app.post("/api/companies", async (req, res) => {
    const { name, logoText, logoType, logoData, description, logoUrl } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: "Company name is required" });
    }
    const newCompany = {
      id: `co-${Date.now()}`,
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

  app.put("/api/companies/:companyId", async (req, res) => {
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

  app.post("/api/login-code", async (req, res) => {
    const { code } = req.body;
    if (!code || !code.trim()) return res.status(400).json({ error: "Access Code is required" });
    const cleanCode = code.trim().toUpperCase();
    const { data, error } = await supabase.from('users').select('*').eq('access_code', cleanCode).single();
    if (error || !data) return res.status(401).json({ error: "Invalid Access Code. Check reference directory." });
    const user = toCamel(data);
    const { accessCode, ...safeUser } = user as any;
    const token = Buffer.from(JSON.stringify({ ...safeUser, issuedAt: Date.now() })).toString('base64');
    res.json({ user: safeUser, token });
  });

  app.get("/api/companies/:companyId/campaigns", async (req, res) => {
    const { companyId } = req.params;
    const { data, error } = await supabase.from('campaigns').select('*').eq('company_id', companyId);
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  app.post("/api/companies/:companyId/campaigns", async (req, res) => {
    const { companyId } = req.params;
    const { name, description, projectType } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Campaign name is required" });
    const newCampaign = {
      id: `c-${Date.now().toString(36)}`,
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

  app.get("/api/companies/:companyId/campaign-counts", async (req, res) => {
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

  app.delete("/api/campaigns/:id", async (req, res) => {
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

  app.get("/api/campaigns/:campaignId/postings", async (req, res) => {
    const { campaignId } = req.params;
    const { data, error } = await supabase.from('posting_folders').select('*').eq('campaign_id', campaignId);
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  app.post("/api/campaigns/:campaignId/postings", async (req, res) => {
    const { campaignId } = req.params;
    const { name, description, projectType } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Posting folder name is required" });
    const newPosting = {
      id: `p-${Date.now().toString(36)}`,
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

  app.delete("/api/postings/:postingId", async (req, res) => {
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

  app.get("/api/postings/:postingId/assets", async (req, res) => {
    const { postingId } = req.params;
    const { data, error } = await supabase.from('assets').select('*').eq('posting_folder_id', postingId);
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  app.get("/api/postings/:postingId/articles", async (req, res) => {
    const { postingId } = req.params;
    const { data, error } = await supabase.from('articles').select('*').eq('posting_folder_id', postingId);
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  app.post("/api/postings/:postingId/articles", async (req, res) => {
    const { postingId } = req.params;
    const { title, body, preparedBy, createdAt, coverImage } = req.body;
    console.log('[POST ARTICLE] coverImage length:', (coverImage || '').length, 'first60:', (coverImage || '').substring(0, 60));
    if (!title?.trim() || !preparedBy?.trim()) {
      return res.status(400).json({ error: "Article title and 'Prepared By' author name are required." });
    }
    const newArticle = {
      id: `art-${Date.now().toString(36)}`,
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

  app.put("/api/articles/:id", async (req, res) => {
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

  app.delete("/api/articles/:id", async (req, res) => {
    const { id } = req.params;
    const { data: existing, error: fError } = await supabase.from('articles').select('id').eq('id', id).single();
    if (fError || !existing) return res.status(404).json({ error: "Article not found" });

    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Article successfully deleted" });
  });

  app.get("/api/companies/:companyId/articles", async (req, res) => {
    const { companyId } = req.params;
    const { data: folders, error: fError } = await supabase.from('article_folders').select('id').eq('company_id', companyId);
    if (fError) return res.status(500).json({ error: fError.message });
    if (!folders || folders.length === 0) return res.json([]);

    const folderIds = folders.map(f => f.id);
    const { data: articles, error: aError } = await supabase.from('articles').select('*').in('article_folder_id', folderIds);
    if (aError) return res.status(500).json({ error: aError.message });
    res.json(toCamel(articles));
  });

  app.get("/api/companies/:companyId/article-folders", async (req, res) => {
    const { companyId } = req.params;
    const { data, error } = await supabase.from('article_folders').select('*').eq('company_id', companyId);
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  app.post("/api/companies/:companyId/article-folders", async (req, res) => {
    const { companyId } = req.params;
    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Folder name is required" });
    const newFolder = {
      id: `af-${Date.now().toString(36)}`,
      companyId,
      name: name.trim(),
      description: description?.trim() || "",
      createdAt: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('article_folders').insert([toSnakeCase(newFolder)]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(toCamel(data));
  });

  app.delete("/api/article-folders/:id", async (req, res) => {
    const { id } = req.params;
    const { data: existing, error: fError } = await supabase.from('article_folders').select('id').eq('id', id).single();
    if (fError || !existing) return res.status(404).json({ error: "Article folder not found" });

    const { error: artDelError } = await supabase.from('articles').delete().eq('article_folder_id', id);
    if (artDelError) return res.status(500).json({ error: artDelError.message });
    const { error } = await supabase.from('article_folders').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Article folder and linked articles deleted" });
  });

  app.get("/api/article-folders/:folderId/articles", async (req, res) => {
    const { folderId } = req.params;
    const { data, error } = await supabase.from('articles').select('*').eq('article_folder_id', folderId);
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  app.post("/api/article-folders/:folderId/articles", async (req, res) => {
    const { folderId } = req.params;
    const { title, body, preparedBy, createdAt, coverImage, status } = req.body;
    if (!title?.trim() || !preparedBy?.trim()) {
      return res.status(400).json({ error: "Article title and 'Prepared By' are required." });
    }
    const newArticle = {
      id: `art-${Date.now().toString(36)}`,
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

  app.get("/api/users", async (req, res) => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data).map(({ accessCode, ...rest }: any) => rest));
  });

  app.post("/api/users", async (req, res) => {
    const { username, role, accessCode, password } = req.body;
    if (!username?.trim() || !role || !accessCode?.trim()) {
      return res.status(400).json({ error: "Username, designated position, and access code are required." });
    }
    if (password !== process.env.ONBOARD_PASSWORD) {
      return res.status(400).json({ error: "Access Denied: Invalid Onboarding Security Password." });
    }
    const cleanCode = accessCode.trim().toUpperCase();
    const { data: existing } = await supabase.from('users').select('id, username').eq('access_code', cleanCode).single();
    if (existing) {
      const existingUser = toCamel(existing) as User;
      return res.status(400).json({ error: `Access code '${cleanCode}' is already assigned to ${existingUser.username}.` });
    }
    const newUser = {
      id: `u-${Date.now().toString(36)}`,
      username: username.trim(),
      role,
      accessCode: cleanCode
    };
    const { data, error } = await supabase.from('users').insert([toSnakeCase(newUser)]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(toCamel(data));
  });

  app.put("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    const { username, role, accessCode } = req.body;

    const { data: user, error: fError } = await supabase.from('users').select('*').eq('id', id).single();
    if (fError || !user) return res.status(404).json({ error: "User not found" });

    const updates: Record<string, any> = {};
    if (username !== undefined) updates.username = username.trim();
    if (role !== undefined) updates.role = role;
    if (accessCode !== undefined) {
      const cleanCode = accessCode.trim().toUpperCase();
      const { data: existing } = await supabase.from('users').select('id').eq('access_code', cleanCode).neq('id', id).single();
      if (existing) return res.status(400).json({ error: `Access code '${cleanCode}' belongs to another user.` });
      updates.accessCode = cleanCode;
    }

    const { data, error } = await supabase.from('users').update(toSnakeCase(updates)).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  app.delete("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    const { password } = req.body as { password?: string };
    const onboardPassword = process.env.ONBOARD_PASSWORD;
    if (!onboardPassword || !password || password !== onboardPassword) {
      return res.status(403).json({ error: "Invalid onboarding password" });
    }
    const { data: user, error: fError } = await supabase.from('users').select('id').eq('id', id).single();
    if (fError || !user) return res.status(404).json({ error: "User not found" });

    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "User deleted" });
  });

  app.post("/api/upload", upload.single("file"), async (req, res) => {
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

  app.get("/api/companies/:companyId/assets", async (req, res) => {
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

  app.get("/api/assets", async (req, res) => {
    const { data, error } = await supabase.from('assets').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  app.post("/api/assets", async (req, res) => {
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
      id: `a-${Date.now().toString(36)}`,
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

  app.put("/api/assets/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status value is required" });

    const { data: existing, error: fError } = await supabase.from('assets').select('id').eq('id', id).single();
    if (fError || !existing) return res.status(404).json({ error: "Asset not found" });

    const { data, error } = await supabase.from('assets').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(toCamel(data));
  });

  app.put("/api/assets/:id", async (req, res) => {
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

  app.delete("/api/assets/:id", async (req, res) => {
    const { id } = req.params;
    const { data: asset, error: fError } = await supabase.from('assets').select('s3_file_url').eq('id', id).single();
    if (fError || !asset) return res.status(404).json({ error: "Asset not found" });

    const s3FileUrl = asset.s3_file_url;
    if (s3FileUrl && s3FileUrl.startsWith("/uploads/")) {
      const fileKey = s3FileUrl.replace("/uploads/", "");
      const filePath = path.join(UPLOADS_DIR, fileKey);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); console.log(`Cleaned up physical file: ${fileKey}`); }
        catch (err) { console.error(`Failed to delete physical file: ${filePath}`, err); }
      }
    }

    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Asset successfully deleted from registry" });
  });

  app.get("/api/companies/:companyId/all-assets", async (req, res) => {
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

  app.get("/api/companies/:companyId/stats", async (req, res) => {
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

  app.delete("/api/companies/:id", async (req, res) => {
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

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => { res.sendFile(path.join(distPath, "index.html")); });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OrbitX Server running on http://localhost:${PORT}`);
  });
}

startServer();