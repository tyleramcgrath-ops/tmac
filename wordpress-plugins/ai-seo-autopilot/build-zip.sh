#!/usr/bin/env bash
# Builds the installable plugin zip at wordpress-plugins/dist/ai-seo-autopilot.zip.
set -euo pipefail
cd "$(dirname "$0")"
OUT="$(cd .. && pwd)/dist"
TMP="$(mktemp -d)"
mkdir -p "$OUT" "$TMP/ai-seo-autopilot"
cp -r ai-seo-autopilot.php uninstall.php readme.txt README.md includes assets "$TMP/ai-seo-autopilot/"
rm -f "$OUT/ai-seo-autopilot.zip"
( cd "$TMP" && zip -qr -X "$OUT/ai-seo-autopilot.zip" ai-seo-autopilot )
rm -rf "$TMP"
echo "Wrote $OUT/ai-seo-autopilot.zip"
