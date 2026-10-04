#!/bin/bash
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
d=$1; u=$2
curl -sS -L --max-time 15 --compressed -A "$UA" -H 'Accept: text/html,application/xhtml+xml' -H 'Accept-Language: en-US,en;q=0.9' \
  -D html/$d.headers -o html/$d.html \
  -w '{"http_code":%{http_code},"ttfb":%{time_starttransfer},"total":%{time_total},"size":%{size_download},"url_effective":"%{url_effective}","redirects":%{num_redirects}}' "$u" > html/$d.curl 2> html/$d.err
echo "{\"exit\":$?}" > html/$d.exit
