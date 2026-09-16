// One-shot: rewrite '/uploads/x' → '<R2_PUBLIC_URL>/uploads/x' in assets.s3_file_url and companies.logo_url.
// Usage: set -a; source .env; set +a; node scripts/migrate-upload-urls.mjs
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, R2_PUBLIC_URL } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !R2_PUBLIC_URL) {
  console.error('Need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, R2_PUBLIC_URL');
  process.exit(1);
}
const base = R2_PUBLIC_URL.replace(/\/+$/, '');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function rewrite(table, column) {
  const { data, error } = await supabase.from(table).select(`id, ${column}`).like(column, '/uploads/%');
  if (error) throw new Error(`${table}: ${error.message}`);
  for (const row of data) {
    const next = `${base}${row[column]}`;
    const { error: uErr } = await supabase.from(table).update({ [column]: next }).eq('id', row.id);
    if (uErr) throw new Error(`${table} ${row.id}: ${uErr.message}`);
    console.log(`${table}.${column} ${row.id}: ${row[column]} → ${next}`);
  }
  const { count } = await supabase.from(table).select('id', { count: 'exact', head: true }).like(column, '/uploads/%');
  console.log(`${table}: rewrote ${data.length}, remaining ${count}`);
}

await rewrite('assets', 's3_file_url');
await rewrite('companies', 'logo_url');
