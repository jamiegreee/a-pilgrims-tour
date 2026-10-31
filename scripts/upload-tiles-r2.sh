#!/usr/bin/env bash
# Uploads baked flythrough tiles (public/tiles) to a Cloudflare R2 bucket, so they can be
# served from R2 instead of the site. R2's free tier covers 10 GB of storage and has no
# charge for downloads.
#
# One-time setup in the Cloudflare dashboard:
#   1. R2 > Create bucket (e.g. "pilgrim-tiles"), then Settings > Public access: allow
#      the r2.dev URL or connect a custom domain.
#   2. Settings > CORS policy:
#        [{ "AllowedOrigins": ["*"], "AllowedMethods": ["GET"], "AllowedHeaders": ["*"] }]
#   3. R2 > Manage API tokens > Create token with Object Read & Write on the bucket.
#
# Then, with the AWS CLI installed:
#   R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET=pilgrim-tiles \
#     scripts/upload-tiles-r2.sh
# and set NEXT_PUBLIC_FLYTHROUGH_TILE_BASE to the bucket's public URL (no trailing slash).
set -euo pipefail

: "${R2_ACCOUNT_ID:?set R2_ACCOUNT_ID}"
: "${R2_ACCESS_KEY_ID:?set R2_ACCESS_KEY_ID}"
: "${R2_SECRET_ACCESS_KEY:?set R2_SECRET_ACCESS_KEY}"
: "${R2_BUCKET:?set R2_BUCKET}"

AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" AWS_DEFAULT_REGION=auto \
  aws s3 sync public/tiles "s3://$R2_BUCKET" \
    --endpoint-url "https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com" \
    --content-type image/webp \
    --cache-control "public, max-age=31536000, immutable"
