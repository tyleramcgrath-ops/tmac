#!/usr/bin/env bash
# Renders every page of the v7 theme to static HTML in ../preview, for the
# Vercel preview deployment. Needs PHP 7.4+.
set -euo pipefail
cd "$(dirname "$0")"
THEME="$(cd ../rma-marketing-agency-v7 && pwd)"
OUT="$(cd .. && pwd)/preview"
rm -rf "$OUT" && mkdir -p "$OUT"
cp -r "$THEME/assets" "$OUT/assets"
PAGES="services case-studies about insights contact ai-search-optimization seo paid-media web-design social-media event-planning branding analytics-reporting"
php wpstub.php "$THEME" "" > "$OUT/index.html"
php wpstub.php "$THEME" 404 > "$OUT/404.html"
for p in $PAGES; do
	mkdir -p "$OUT/$p"
	php wpstub.php "$THEME" "$p" > "$OUT/$p/index.html"
done
# Forms have no WordPress to post to here.
for f in $(find "$OUT" -name '*.html'); do
	sed -i "s|action=\"#\"|action=\"#\" onsubmit=\"event.preventDefault();alert('Preview only: once the theme is installed in WordPress, this form emails the site admin.')\"|g" "$f"
	if grep -q "Warning\|Fatal error\|Notice:" "$f"; then echo "PHP error in $f" >&2; exit 1; fi
done
cat > "$OUT/vercel.json" <<'JSON'
{
  "cleanUrls": true,
  "trailingSlash": true,
  "headers": [{ "source": "/(.*)", "headers": [{ "key": "X-Robots-Tag", "value": "noindex, nofollow" }] }]
}
JSON
echo "Built $(find "$OUT" -name '*.html' | wc -l) pages into $OUT"
