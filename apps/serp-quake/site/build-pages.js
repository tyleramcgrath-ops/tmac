// Builds the site for hosts that serve it from a sub-folder with no clean URLs:
//
//   node build-pages.js [outDir]               GitHub Pages: static, no API (default ../pages-dist)
//   node build-pages.js --siteground [outDir]  SiteGround: the PHP API under api/ (default ../siteground-dist)
//
// Both: root-absolute links become relative. Pages: window.SQ_STATIC tells the
// pages there is no API, so the homepage reads the live payload straight from
// the data branch, sign-in says accounts are coming, and /app shows the demo.
// SiteGround: window.SQ_API points every call at api/<name>.php (php/ in this
// folder), which does sign-in, trials, Stripe and the gated data on MySQL.
'use strict';
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const siteground = args.includes('--siteground');
const outArg = args.find((a) => !a.startsWith('--'));
const out = path.resolve(outArg || path.join(__dirname, '..', siteground ? 'siteground-dist' : 'pages-dist'));
const DATA_URL = process.env.QUAKE_DATA_URL || 'https://raw.githubusercontent.com/tyleramcgrath-ops/tmac/serp-quake-data/data.json';

function rewrite(html) {
  return html
    .replace(/href="\/"/g, 'href="index.html"')
    .replace(/href="\/#/g, 'href="index.html#')
    .replace(/(["'])\/login/g, '$1login.html')
    .replace(/(["'])\/app/g, '$1app.html')
    .replace('<script src="quake-ui.js"></script>', '<script>' + (siteground
      ? 'window.SQ_API = ' + JSON.stringify({ base: 'api/', ext: '.php' })
      : 'window.SQ_STATIC = ' + JSON.stringify({ dataUrl: DATA_URL })) + ';</script>\n<script src="quake-ui.js"></script>');
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const f of ['index.html', 'login.html', 'app.html']) fs.writeFileSync(path.join(out, f), rewrite(fs.readFileSync(path.join(__dirname, f), 'utf8')));
for (const f of ['quake-ui.js', 'site.css', 'demo-data.json']) fs.copyFileSync(path.join(__dirname, f), path.join(out, f));
if (siteground) {
  fs.cpSync(path.join(__dirname, 'php'), path.join(out, 'api'), { recursive: true });
  fs.writeFileSync(path.join(out, '.htaccess'), [
    '# SERP Quake on SiteGround (written by build-pages.js --siteground)',
    'Options -Indexes',
    'DirectoryIndex index.html',
    '<IfModule mod_headers.c>',
    '  Header always set X-Content-Type-Options "nosniff"',
    '  Header always set X-Frame-Options "SAMEORIGIN"',
    '  Header always set Referrer-Policy "strict-origin-when-cross-origin"',
    '</IfModule>',
    '',
  ].join('\n'));
}
console.log('wrote', out);
