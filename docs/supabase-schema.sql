-- ============================================================
-- OrbitX — Supabase SQL Schema
-- Generated from: src/types.ts + server.ts + db.json
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- companies
-- ────────────────────────────────────────────────────────────
CREATE TABLE companies (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  logo_text     text,
  accent_color  text DEFAULT 'neutral',
  description   text NOT NULL DEFAULT '',
  logo_url      text NOT NULL DEFAULT '',
  logo_type     text NOT NULL DEFAULT 'none', -- 'upload' | 'icon' | 'none'
  logo_data     text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON companies FOR ALL USING (true);

-- ────────────────────────────────────────────────────────────
-- users
-- ────────────────────────────────────────────────────────────
CREATE TABLE users (
  id           text PRIMARY KEY,
  username     text NOT NULL,
  role         text NOT NULL, -- 'Designer' | 'Content Writer' | 'Team Lead'
  access_code  text NOT NULL UNIQUE,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON users FOR ALL USING (true);

-- ────────────────────────────────────────────────────────────
-- campaigns
-- ────────────────────────────────────────────────────────────
CREATE TABLE campaigns (
  id            text PRIMARY KEY,
  company_id    text NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  project_type  text NOT NULL DEFAULT 'both' -- 'both' | 'media' | 'articles'
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON campaigns FOR ALL USING (true);

CREATE INDEX idx_campaigns_company_id ON campaigns (company_id);

-- ────────────────────────────────────────────────────────────
-- posting_folders
-- ────────────────────────────────────────────────────────────
CREATE TABLE posting_folders (
  id            text PRIMARY KEY,
  campaign_id   text NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  project_type  text NOT NULL DEFAULT 'both' -- 'both' | 'media' | 'articles'
);

ALTER TABLE posting_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON posting_folders FOR ALL USING (true);

CREATE INDEX idx_posting_folders_campaign_id ON posting_folders (campaign_id);

-- ────────────────────────────────────────────────────────────
-- assets
-- ────────────────────────────────────────────────────────────
CREATE TABLE assets (
  id                 text PRIMARY KEY,
  posting_folder_id  text NOT NULL REFERENCES posting_folders (id) ON DELETE CASCADE,
  s3_file_url        text NOT NULL,
  file_type          text NOT NULL DEFAULT '',
  caption_text       text NOT NULL DEFAULT '',
  artwork_comment    text NOT NULL DEFAULT '',
  revised_caption    text NOT NULL DEFAULT '',
  scheduled_date     text NOT NULL DEFAULT '', -- stored as 'YYYY-MM-DD' string
  status             text NOT NULL DEFAULT 'Drafting', -- 'Drafting' | 'Refining' | 'Ready for Publishing'
  uploaded_by        text NOT NULL DEFAULT '', -- references users.id (not enforced — server uses fallback)
  uploaded_by_name   text NOT NULL DEFAULT '',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON assets FOR ALL USING (true);

CREATE INDEX idx_assets_posting_folder_id ON assets (posting_folder_id);

-- ────────────────────────────────────────────────────────────
-- article_folders
-- ────────────────────────────────────────────────────────────
CREATE TABLE article_folders (
  id           text PRIMARY KEY,
  company_id   text NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  name         text NOT NULL,
  description  text NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE article_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON article_folders FOR ALL USING (true);

CREATE INDEX idx_article_folders_company_id ON article_folders (company_id);

-- ────────────────────────────────────────────────────────────
-- articles
-- Dual-parent: belongs to EITHER article_folder OR posting_folder
-- Both cascade-delete when parent is removed (server enforces both)
-- ────────────────────────────────────────────────────────────
CREATE TABLE articles (
  id                 text PRIMARY KEY,
  article_folder_id  text REFERENCES article_folders (id) ON DELETE CASCADE,
  posting_folder_id  text REFERENCES posting_folders (id) ON DELETE CASCADE,
  title              text NOT NULL,
  body               text NOT NULL DEFAULT '',
  prepared_by        text NOT NULL,
  created_at         timestamptz DEFAULT now(),
  cover_image        text NOT NULL DEFAULT '',
  status             text NOT NULL DEFAULT 'Draft' -- 'Draft' | 'Published'
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON articles FOR ALL USING (true);

CREATE INDEX idx_articles_article_folder_id  ON articles (article_folder_id);
CREATE INDEX idx_articles_posting_folder_id  ON articles (posting_folder_id);
