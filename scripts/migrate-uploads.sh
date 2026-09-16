#!/bin/bash
# One-shot: copy every file in ./uploads to R2 under uploads/<name>.
# Usage: R2_BUCKET_NAME=<bucket> bash scripts/migrate-uploads.sh
set -euo pipefail
: "${R2_BUCKET_NAME:?set R2_BUCKET_NAME}"

count=0
for f in uploads/*; do
  [ -f "$f" ] || continue
  name=$(basename "$f")
  mime=$(file -b --mime-type "$f")
  echo "→ uploads/$name ($mime)"
  npx wrangler r2 object put "$R2_BUCKET_NAME/uploads/$name" --file "$f" --content-type "$mime" --remote
  count=$((count + 1))
done
echo "Uploaded $count files."
