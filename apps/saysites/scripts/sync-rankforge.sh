#!/usr/bin/env bash
# Copies RankForge's engines (the root app of this repo) into
# apps/saysites/lib/rankforge, so SaySites runs them in-process. SaySites
# deploys from a subtree split of apps/saysites and cannot import the root,
# so the code is vendored. Run from the repo root after RankForge changes:
#   bash apps/saysites/scripts/sync-rankforge.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
DST="$ROOT/apps/saysites/lib/rankforge"
mkdir -p "$DST/seo-scan" "$DST/engine" "$DST/reco"
cp "$ROOT/app/api/seo-scan/analyze.ts" "$ROOT/app/api/seo-scan/url-guard.ts" "$ROOT/app/api/seo-scan/page-validity.ts" "$DST/seo-scan/"
cp "$ROOT/lib/engine/crawl-batch.ts" "$DST/engine/"
sed -i "s#'../../app/api/seo-scan/#'../seo-scan/#g" "$DST/engine/crawl-batch.ts"
cp "$ROOT"/lib/foundation/reco/*.ts "$DST/reco/"
cp "$ROOT/lib/foundation/types.ts" "$ROOT/lib/foundation/ai-citations.ts" "$ROOT/lib/foundation/serp.ts" "$ROOT/lib/foundation/backlinks.ts" "$DST/"
echo "RankForge engines synced into $DST"
