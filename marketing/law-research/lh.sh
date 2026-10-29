#!/bin/bash
cd /tmp/claude-0/-home-user-tmac/d07e34f1-d986-5a87-b848-aec96afae97f/scratchpad/lawfirms
for d in johnfoy.com piastawalker.com chicagodivorceatty.com monastlaw.com forthepeople.com aramilaw.com ramimmigrationlaw.com larrimer.com businessattorneysandiego.com npavliklaw.com; do
  u=$(node -e "console.log(require('./results.json').find(r=>r.domain=='$d').final_url)")
  CHROME_PATH=/opt/pw-browsers/chromium timeout 180 node /root/.npm/_npx/0f94ee7615faf582/node_modules/lighthouse/cli/index.js "$u" --quiet --only-categories=performance,seo,accessibility --chrome-flags="--headless=new --no-sandbox --ignore-certificate-errors-spki-list=PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0=,KnP1OnzHv/y42eRQmbGwoYTHcSJF448m6CU5mdngwKk=" --output=json --output-path=lh/$d.json > lh/$d.log 2>&1
  echo "$d exit=$?"
done
