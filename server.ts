import dotenv from "dotenv";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Role, AssetStatus, Company, User, Campaign, PostingFolder, Asset, ArticleFolder, Article } from "./src/types";

dotenv.config();

const DB_PATH = path.join(process.cwd(), "db.json");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

interface DB {
  companies: Company[];
  users: User[];
  campaigns: Campaign[];
  postingFolders: PostingFolder[];
  assets: Asset[];
  articleFolders: ArticleFolder[];
  articles: Article[];
  projectFolders?: Campaign[];
}

const DEFAULT_COMPANIES: Company[] = [];
const DEFAULT_USERS: User[] = [];

const DEFAULT_DB: DB = {
  companies: DEFAULT_COMPANIES,
  users: DEFAULT_USERS,
  campaigns: [],
  postingFolders: [],
  assets: [],
  articleFolders: [],
  articles: []
};

function readDB(): DB {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
      return DEFAULT_DB;
    }
    const data = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(data);
    if (parsed.companies === undefined) {
      fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
      return DEFAULT_DB;
    }
    let dirty = false;

    if (!parsed.articles) {
      parsed.articles = DEFAULT_DB.articles;
      dirty = true;
    }

    if (!parsed.articleFolders) {
      parsed.articleFolders = [];
      dirty = true;
    }

    if (!parsed.postingFolders) {
      parsed.postingFolders = [];
      dirty = true;
    }

    if (parsed.projectFolders && !parsed.campaigns) {
      parsed.campaigns = parsed.projectFolders;
      delete parsed.projectFolders;
      dirty = true;
    }

    if (parsed.assets) {
      parsed.assets.forEach((a: any) => {
        if (a.projectFolderId && !a.postingFolderId) {
          a.postingFolderId = a.projectFolderId;
          delete a.projectFolderId;
          dirty = true;
        }
        if (a.captionText && (a.captionText.startsWith('[Project Frame:') || a.captionText.includes('#BrandCampaign #MediaAssetHub'))) {
          a.captionText = '';
          dirty = true;
        }
        if (a.artworkComment && (a.artworkComment === 'None.' || a.artworkComment === 'No comments for artwork.')) {
          a.artworkComment = '';
          dirty = true;
        }
        if (a.revisedCaption && a.revisedCaption === 'No revised caption provided.') {
          a.revisedCaption = '';
          dirty = true;
        }
      });
    }

    if (parsed.assets) {
      parsed.assets.forEach((a: any) => {
        if (a.postingFolderId && a.postingFolderId.startsWith('f-')) {
          const postingExists = parsed.postingFolders && parsed.postingFolders.some((pf: any) => pf.id === a.postingFolderId);
          if (!postingExists) {
            const campaign = parsed.campaigns && parsed.campaigns.find((c: any) => c.id === a.postingFolderId);
            if (campaign) {
              const firstPosting = parsed.postingFolders && parsed.postingFolders.find((pf: any) => pf.campaignId === campaign.id);
              if (firstPosting) {
                a.postingFolderId = firstPosting.id;
                dirty = true;
              }
            }
          }
        }
      });
    }

    if (parsed.articles) {
      parsed.articles.forEach((a: any) => {
        if (a.projectFolderId && !a.postingFolderId) {
          a.postingFolderId = a.projectFolderId;
          delete a.projectFolderId;
          dirty = true;
        }
      });
    }

    if (parsed.users) {
      parsed.users.forEach((u: any) => {
        if (u.role === "Lead" || u.role === "HoD" || u.role === "Team Lead") {
          if (u.role !== Role.TeamLead) { u.role = Role.TeamLead; dirty = true; }
        } else if (u.role === "Viewer" || u.role === "Content Writer" || u.role === "ContentWriter") {
          if (u.role !== Role.ContentWriter) { u.role = Role.ContentWriter; dirty = true; }
        } else if (u.role === "Designer") {
          if (u.role !== Role.Designer) { u.role = Role.Designer; dirty = true; }
        }
      });
    }

    if (dirty) { writeDB(parsed); }
    return parsed;
  } catch (err) {
    console.error("Error reading database file, returning default", err);
    return DEFAULT_DB;
  }
}

function writeDB(data: DB) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to database file", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use("/uploads", express.static(UPLOADS_DIR));

  app.get("/api/companies", (req, res) => {
    const db = readDB();
    res.json(db.companies);
  });

  app.post("/api/companies", (req, res) => {
    const { name, logoText, logoType, logoData, description, logoUrl } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ error: "Company name is required" });
      return;
    }
    const db = readDB();
    const newCompany: Company = {
      id: `co-${Date.now()}`,
      name: name.trim(),
      logoText: logoText?.trim().toUpperCase() || name.trim().substring(0, 3).toUpperCase(),
      accentColor: "neutral",
      description: description || "",
      logoUrl: logoUrl || "",
      logoType: logoType || "none",
      logoData: logoData || ""
    };
    db.companies.push(newCompany);
    writeDB(db);
    res.json(newCompany);
  });

  app.put("/api/companies/:companyId", (req, res) => {
    const { companyId } = req.params;
    const { logoUrl, logoType, logoData, logoText } = req.body;
    const db = readDB();
    const company = db.companies.find(c => c.id === companyId);
    if (!company) { res.status(404).json({ error: "Company not found" }); return; }
    if (logoUrl !== undefined) { company.logoUrl = logoUrl; }
    if (logoType !== undefined) { company.logoType = logoType; }
    if (logoData !== undefined) { company.logoData = logoData; }
    if (logoText !== undefined) { company.logoText = logoText; }
    writeDB(db);
    res.json(company);
  });

  app.post("/api/login-code", (req, res) => {
    const { code } = req.body;
    if (!code || !code.trim()) { res.status(400).json({ error: "Access Code is required" }); return; }
    const cleanCode = code.trim().toUpperCase();
    const db = readDB();
    const user = db.users.find(u => u.accessCode.toUpperCase() === cleanCode);
    if (!user) { res.status(401).json({ error: "Invalid Access Code. Check reference directory." }); return; }
    res.json({ user });
  });

  app.get("/api/companies/:companyId/campaigns", (req, res) => {
    const { companyId } = req.params;
    const db = readDB();
    const campaigns = db.campaigns.filter(f => f.companyId === companyId);
    res.json(campaigns);
  });

  app.post("/api/companies/:companyId/campaigns", (req, res) => {
    const { companyId } = req.params;
    const { name, description, projectType } = req.body;
    if (!name?.trim()) { res.status(400).json({ error: "Campaign name is required" }); return; }
    const db = readDB();
    const newCampaign: Campaign = {
      id: "c-" + Date.now().toString(36),
      companyId,
      name: name.trim(),
      description: description?.trim() || "",
      createdAt: new Date().toISOString(),
      projectType: projectType || "both"
    };
    db.campaigns.push(newCampaign);
    writeDB(db);
    res.status(201).json(newCampaign);
  });

  app.get("/api/companies/:companyId/campaign-counts", (req, res) => {
    const { companyId } = req.params;
    const db = readDB();
    const companyCampaigns = db.campaigns.filter(c => c.companyId === companyId);
    const counts = companyCampaigns.map(c => ({
      campaignId: c.id,
      postingCount: db.postingFolders.filter(p => p.campaignId === c.id).length
    }));
    res.json(counts);
  });

  app.delete("/api/campaigns/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const idx = db.campaigns.findIndex(f => f.id === id);
    if (idx === -1) { res.status(404).json({ error: "Campaign not found" }); return; }
    db.campaigns.splice(idx, 1);
    const postingIds = db.postingFolders.filter(p => p.campaignId === id).map(p => p.id);
    const deletedPostingCount = postingIds.length;
    const deletedAssetCount = db.assets.filter(a => postingIds.includes(a.postingFolderId)).length;
    db.postingFolders = db.postingFolders.filter(p => p.campaignId !== id);
    db.assets = db.assets.filter(a => !postingIds.includes(a.postingFolderId));
    db.articles = db.articles.filter(a => !postingIds.includes(a.postingFolderId));
    writeDB(db);
    res.json({ postingCount: deletedPostingCount, assetCount: deletedAssetCount });
  });

  app.get("/api/campaigns/:campaignId/postings", (req, res) => {
    const { campaignId } = req.params;
    const db = readDB();
    const postings = db.postingFolders.filter(p => p.campaignId === campaignId);
    res.json(postings);
  });

  app.post("/api/campaigns/:campaignId/postings", (req, res) => {
    const { campaignId } = req.params;
    const { name, description, projectType } = req.body;
    if (!name?.trim()) { res.status(400).json({ error: "Posting folder name is required" }); return; }
    const db = readDB();
    const newPosting: PostingFolder = {
      id: "p-" + Date.now().toString(36),
      campaignId,
      name: name.trim(),
      description: description?.trim() || "",
      createdAt: new Date().toISOString(),
      projectType: projectType || "both"
    };
    db.postingFolders.push(newPosting);
    writeDB(db);
    res.status(201).json(newPosting);
  });

  app.delete("/api/postings/:postingId", (req, res) => {
    const { postingId } = req.params;
    const db = readDB();
    const idx = db.postingFolders.findIndex(p => p.id === postingId);
    if (idx === -1) { res.status(404).json({ error: "Posting folder not found" }); return; }
    db.postingFolders.splice(idx, 1);
    db.assets = db.assets.filter(a => a.postingFolderId !== postingId);
    db.articles = db.articles.filter(a => a.postingFolderId !== postingId);
    writeDB(db);
    res.json({ message: "Posting folder and linked assets deleted" });
  });

  app.get("/api/postings/:postingId/assets", (req, res) => {
    const { postingId } = req.params;
    const db = readDB();
    const assets = db.assets.filter(a => a.postingFolderId === postingId);
    res.json(assets);
  });

  app.get("/api/postings/:postingId/articles", (req, res) => {
    const { postingId } = req.params;
    const db = readDB();
    const folderArticles = (db.articles || []).filter(art => art.postingFolderId === postingId);
    res.json(folderArticles);
  });

  app.post("/api/postings/:postingId/articles", (req, res) => {
    const { postingId } = req.params;
    const { title, body, preparedBy, createdAt, coverImage } = req.body;
    console.log('[POST ARTICLE] coverImage length:', (coverImage || '').length, 'first60:', (coverImage || '').substring(0, 60));
    if (!title?.trim() || !preparedBy?.trim()) {
      res.status(400).json({ error: "Article title and 'Prepared By' author name are required." });
      return;
    }
    const db = readDB();
    const newArticle: Article = {
      id: "art-" + Date.now().toString(36),
      postingFolderId: postingId,
      title: title.trim(),
      body: body || "",
      preparedBy: preparedBy.trim(),
      createdAt: createdAt || new Date().toISOString().split("T")[0],
      coverImage: coverImage || "",
    };
    if (!db.articles) db.articles = [];
    db.articles.unshift(newArticle);
    writeDB(db);
    res.status(201).json(newArticle);
  });

  app.put("/api/articles/:id", (req, res) => {
    const { id } = req.params;
    const { title, body, preparedBy, createdAt, coverImage } = req.body;
    console.log('[PUT ARTICLE] id:', id, 'coverImage length:', (coverImage || '').length, 'first60:', (coverImage || '').substring(0, 60));
    const db = readDB();
    const article = (db.articles || []).find(art => art.id === id);
    if (!article) { res.status(404).json({ error: "Article not found." }); return; }
    if (title !== undefined) article.title = title.trim();
    if (body !== undefined) article.body = body;
    if (preparedBy !== undefined) article.preparedBy = preparedBy.trim();
    if (createdAt !== undefined) article.createdAt = createdAt;
    if (coverImage !== undefined) article.coverImage = coverImage;
    writeDB(db);
    res.json(article);
  });

  app.delete("/api/articles/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    if (!db.articles) db.articles = [];
    const index = db.articles.findIndex(art => art.id === id);
    if (index === -1) { res.status(404).json({ error: "Article not found." }); return; }
    db.articles.splice(index, 1);
    writeDB(db);
    res.json({ message: "Article successfully deleted" });
  });

  app.get("/api/companies/:companyId/articles", (req, res) => {
    const { companyId } = req.params;
    const db = readDB();
    const folderIds = new Set((db.articleFolders || []).filter(f => f.companyId === companyId).map(f => f.id));
    const articles = (db.articles || []).filter(a => a.articleFolderId && folderIds.has(a.articleFolderId));
    res.json(articles);
  });

  app.get("/api/companies/:companyId/article-folders", (req, res) => {
    const { companyId } = req.params;
    const db = readDB();
    const folders = (db.articleFolders || []).filter(f => f.companyId === companyId);
    res.json(folders);
  });

  app.post("/api/companies/:companyId/article-folders", (req, res) => {
    const { companyId } = req.params;
    const { name, description } = req.body;
    if (!name?.trim()) { res.status(400).json({ error: "Folder name is required" }); return; }
    const db = readDB();
    const newFolder: ArticleFolder = {
      id: "af-" + Date.now().toString(36),
      companyId,
      name: name.trim(),
      description: description?.trim() || "",
      createdAt: new Date().toISOString(),
    };
    if (!db.articleFolders) db.articleFolders = [];
    db.articleFolders.push(newFolder);
    writeDB(db);
    res.status(201).json(newFolder);
  });

  app.delete("/api/article-folders/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    if (!db.articleFolders) db.articleFolders = [];
    const idx = db.articleFolders.findIndex(f => f.id === id);
    if (idx === -1) { res.status(404).json({ error: "Article folder not found" }); return; }
    db.articleFolders.splice(idx, 1);
    db.articles = (db.articles || []).filter(a => a.articleFolderId !== id);
    writeDB(db);
    res.json({ message: "Article folder and linked articles deleted" });
  });

  app.get("/api/article-folders/:folderId/articles", (req, res) => {
    const { folderId } = req.params;
    const db = readDB();
    const articles = (db.articles || []).filter(a => a.articleFolderId === folderId);
    res.json(articles);
  });

  app.post("/api/article-folders/:folderId/articles", (req, res) => {
    const { folderId } = req.params;
    const { title, body, preparedBy, createdAt, coverImage } = req.body;
    if (!title?.trim() || !preparedBy?.trim()) {
      res.status(400).json({ error: "Article title and 'Prepared By' are required." });
      return;
    }
    const db = readDB();
    const newArticle: Article = {
      id: "art-" + Date.now().toString(36),
      articleFolderId: folderId,
      title: title.trim(),
      body: body || "",
      preparedBy: preparedBy.trim(),
      createdAt: createdAt || new Date().toISOString().split("T")[0],
      coverImage: coverImage || "",
    };
    if (!db.articles) db.articles = [];
    db.articles.unshift(newArticle);
    writeDB(db);
    res.status(201).json(newArticle);
  });

  app.get("/api/users", (req, res) => {
    const db = readDB();
    res.json(db.users);
  });

  app.post("/api/users", (req, res) => {
    const { username, role, accessCode, password } = req.body;
    if (!username?.trim() || !role || !accessCode?.trim()) {
      res.status(400).json({ error: "Username, designated position, and access code are required." });
      return;
    }
    if (password !== process.env.ONBOARD_PASSWORD) {
      res.status(400).json({ error: "Access Denied: Invalid Onboarding Security Password." });
      return;
    }
    const db = readDB();
    const cleanCode = accessCode.trim().toUpperCase();
    const existing = db.users.find(u => u.accessCode.toUpperCase() === cleanCode);
    if (existing) {
      res.status(400).json({ error: `Access code '${cleanCode}' is already assigned to ${existing.username}.` });
      return;
    }
    const newUser: User = {
      id: "u-" + Date.now().toString(36),
      username: username.trim(),
      role,
      accessCode: cleanCode
    };
    db.users.push(newUser);
    writeDB(db);
    res.status(201).json(newUser);
  });

  app.put("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const { username, role, accessCode } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.id === id);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    if (username !== undefined) user.username = username.trim();
    if (role !== undefined) user.role = role;
    if (accessCode !== undefined) {
      const cleanCode = accessCode.trim().toUpperCase();
      const existing = db.users.find(u => u.accessCode.toUpperCase() === cleanCode && u.id !== id);
      if (existing) { res.status(400).json({ error: `Access code '${cleanCode}' belongs to another user.` }); return; }
      user.accessCode = cleanCode;
    }
    writeDB(db);
    res.json(user);
  });

  app.delete("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const { password } = req.body as { password?: string };
    const onboardPassword = process.env.ONBOARD_PASSWORD;
    if (!onboardPassword || !password || password !== onboardPassword) {
      res.status(403).json({ error: "Invalid onboarding password" });
      return;
    }
    const db = readDB();
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) { res.status(404).json({ error: "User not found" }); return; }
    db.users.splice(idx, 1);
    writeDB(db);
    res.json({ message: "User deleted" });
  });

  app.get("/api/upload/presigned-url", (req, res) => {
    const filename = (req.query.filename as string) || "unnamed_asset";
    const fileType = (req.query.fileType as string) || "application/octet-stream";
    const cleanFilename = filename.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
    const key = `upload_${Date.now()}_${cleanFilename}`;
    const uploadUrl = `/api/simulated-s3/${key}`;
    const publicUrl = `/uploads/${key}`;
    res.json({ uploadUrl, publicUrl, fileType, key });
  });

  app.put("/api/simulated-s3/:key", express.raw({ type: "*/*", limit: "150mb" }), (req, res) => {
    const { key } = req.params;
    const fileData = req.body;
    if (!fileData || fileData.length === 0) { res.status(400).json({ error: "No data uploaded" }); return; }
    const targetPath = path.join(UPLOADS_DIR, key);
    fs.writeFile(targetPath, fileData, (err) => {
      if (err) { console.error("Failed to write simulated S3 file", err); res.status(500).json({ error: "Failed to upload file to simulated S3" }); return; }
      console.log(`Simulated AWS S3 direct upload: Stored ${key} successfully (${fileData.length} bytes)`);
      res.status(200).json({ message: "Upload success", key });
    });
  });

  app.get("/api/assets", (req, res) => {
    const db = readDB();
    res.json(db.assets);
  });

  app.post("/api/assets", (req, res) => {
    const { postingFolderId, s3FileUrl, fileType, captionText, artworkComment, revisedCaption, scheduledDate, status, uploadedBy } = req.body;
    if (!postingFolderId || !s3FileUrl) { res.status(400).json({ error: "Posting Folder ID and File URL are required" }); return; }
    const db = readDB();
    const user = db.users.find(u => u.id === uploadedBy) || db.users[0];
    const newAsset: Asset = {
      id: "a-" + Date.now().toString(36),
      postingFolderId,
      s3FileUrl,
      fileType,
      captionText: captionText || "",
      artworkComment: artworkComment || "",
      revisedCaption: revisedCaption || "",
      scheduledDate: scheduledDate || new Date().toISOString().split("T")[0],
      status: status || AssetStatus.Drafting,
      uploadedBy: user.id,
      uploadedByName: user.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.assets.unshift(newAsset);
    writeDB(db);
    res.status(201).json(newAsset);
  });

  app.put("/api/assets/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) { res.status(400).json({ error: "Status value is required" }); return; }
    const db = readDB();
    const asset = db.assets.find(a => a.id === id);
    if (!asset) { res.status(404).json({ error: "Asset not found" }); return; }
    asset.status = status;
    asset.updatedAt = new Date().toISOString();
    writeDB(db);
    res.json(asset);
  });

  app.put("/api/assets/:id", (req, res) => {
    const { id } = req.params;
    const { captionText, artworkComment, revisedCaption, scheduledDate, status, postingFolderId } = req.body;
    const db = readDB();
    const asset = db.assets.find(a => a.id === id);
    if (!asset) { res.status(404).json({ error: "Asset not found" }); return; }
    if (captionText !== undefined) asset.captionText = captionText;
    if (artworkComment !== undefined) asset.artworkComment = artworkComment;
    if (revisedCaption !== undefined) asset.revisedCaption = revisedCaption;
    if (scheduledDate !== undefined) asset.scheduledDate = scheduledDate;
    if (status !== undefined) asset.status = status;
    if (postingFolderId !== undefined) asset.postingFolderId = postingFolderId;
    asset.updatedAt = new Date().toISOString();
    writeDB(db);
    res.json(asset);
  });

  app.delete("/api/assets/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const assetIndex = db.assets.findIndex(a => a.id === id);
    if (assetIndex === -1) { res.status(404).json({ error: "Asset not found" }); return; }
    const asset = db.assets[assetIndex];
    if (asset.s3FileUrl && asset.s3FileUrl.startsWith("/uploads/")) {
      const fileKey = asset.s3FileUrl.replace("/uploads/", "");
      const filePath = path.join(UPLOADS_DIR, fileKey);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); console.log(`Cleaned up physical file: ${fileKey}`); }
        catch (err) { console.error(`Failed to delete physical file: ${filePath}`, err); }
      }
    }
    db.assets.splice(assetIndex, 1);
    writeDB(db);
    res.json({ message: "Asset successfully deleted from registry" });
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
