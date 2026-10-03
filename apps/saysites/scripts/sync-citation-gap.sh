#!/usr/bin/env bash
# Copies Citation Gap's scanner (apps/citation-gap) into
# apps/saysites/lib/citation-gap, so SaySites runs the same scoring
# in-process. SaySites deploys alone (a subtree split of apps/saysites), so
# the code is vendored. Run from the repo root after Citation Gap changes:
#   bash apps/saysites/scripts/sync-citation-gap.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SRC="$ROOT/apps/citation-gap"
DST="$ROOT/apps/saysites/lib/citation-gap"
mkdir -p "$DST"
cp "$SRC/score.js" "$SRC/lib/scan-job.js" "$SRC/lib/page.impl.js" "$SRC/api/serp.js" "$DST/"
sed -i "s#require('../score.js')#require('./score.js')#" "$DST/scan-job.js"
echo "Citation Gap synced into $DST"
