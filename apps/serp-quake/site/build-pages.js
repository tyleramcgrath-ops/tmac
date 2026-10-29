// Builds the static, API-free copy of the site for GitHub Pages:
//   node build-pages.js [outDir]        (default ../pages-dist)
//
// What changes in the copy: root-absolute links become relative (Pages serves
// the site from a sub-path, and has no clean URLs), and window.SQ_STATIC tells
// the pages there is no API. The homepage then reads the live payload straight
// from the data branch, sign-in says accounts are coming, and /app shows the demo.
'use strict';
const fs = require('fs');
const path = require('path');

const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'pages-dist'));
const DATA_URL = process.env.QUAKE_DATA_URL || 'https://raw.githubusercontent.com/tyleramcgrath-ops/tmac/serp-quake-data/data.json';

function rewrite(html) {
  return html
    .replace(/href="\/"/g, 'href="index.html"')
    .replace(/href="\/#/g, 'href="index.html#')
    .replace(/(["'])\/login/g, '$1login.html')
    .replace(/(["'])\/app/g, '$1app.html')
    .replace('<script src="quake-ui.js"></script>', '<script>window.SQ_STATIC = ' + JSON.stringify({ dataUrl: DATA_URL }) + ';</script>\n<script src="quake-ui.js"></script>');
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const f of ['index.html', 'login.html', 'app.html']) fs.writeFileSync(path.join(out, f), rewrite(fs.readFileSync(path.join(__dirname, f), 'utf8')));
for (const f of ['quake-ui.js', 'site.css', 'demo-data.json']) fs.copyFileSync(path.join(__dirname, f), path.join(out, f));
console.log('wrote', out);
