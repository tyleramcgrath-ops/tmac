#!/usr/bin/env bash
# Renders every page of the DRIP theme to static HTML in ../preview for the
# Vercel preview deployment, and zips the theme for WordPress. Needs PHP 7.4+.
# Product data comes from products.json (the live store's Store API export).
set -euo pipefail
cd "$(dirname "$0")"
THEME="$(cd ../drip-clothing && pwd)"
OUT="$(cd .. && pwd)/preview"
rm -rf "$OUT" && mkdir -p "$OUT"
cp -r "$THEME/assets" "$OUT/assets"
cp preview.js "$OUT/assets/js/preview.js"

render() { # route, output file
	mkdir -p "$(dirname "$2")"
	php wpstub.php "$THEME" "$1" > "$2"
}
render "" "$OUT/index.html"
render 404 "$OUT/404.html"
for p in shop about contact cart; do render "$p" "$OUT/$p/index.html"; done
for c in $(php -r '$s=[];foreach(json_decode(file_get_contents("products.json"),true) as $p)foreach($p["categories"] as $c)$s[$c["slug"]]=1;echo implode(" ",array_keys($s));'); do
	render "product-category/$c" "$OUT/product-category/$c/index.html"
done
for s in $(php -r 'foreach(json_decode(file_get_contents("products.json"),true) as $p)echo $p["slug"]," ";'); do
	render "product/$s" "$OUT/product/$s/index.html"
done

for f in $(find "$OUT" -name '*.html'); do
	if grep -q "Warning\|Fatal error\|Notice:\|Deprecated:" "$f"; then echo "PHP error in $f" >&2; grep -m3 "Warning\|Fatal error\|Notice:\|Deprecated:" "$f" >&2; exit 1; fi
done

cat > "$OUT/vercel.json" <<'JSON'
{
  "cleanUrls": true,
  "trailingSlash": true,
  "headers": [{ "source": "/(.*)", "headers": [{ "key": "X-Robots-Tag", "value": "noindex, nofollow" }] }]
}
JSON

# The installable theme.
(cd .. && rm -f drip-clothing.zip && zip -qr drip-clothing.zip drip-clothing -x '*.DS_Store')
echo "Built $(find "$OUT" -name '*.html' | wc -l) pages into $OUT, and ../drip-clothing.zip"
