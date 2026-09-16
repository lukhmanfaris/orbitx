-- Equivalent of scripts/migrate-upload-urls.mjs, for the Supabase SQL editor.
-- Before: '/uploads/upload_x.jpg'  After: '<R2_PUBLIC_URL>/uploads/upload_x.jpg'
UPDATE assets    SET s3_file_url = '<R2_PUBLIC_URL>' || s3_file_url WHERE s3_file_url LIKE '/uploads/%';
UPDATE companies SET logo_url    = '<R2_PUBLIC_URL>' || logo_url    WHERE logo_url    LIKE '/uploads/%';
-- Verify: both must return 0
SELECT count(*) FROM assets    WHERE s3_file_url LIKE '/uploads/%';
SELECT count(*) FROM companies WHERE logo_url    LIKE '/uploads/%';
