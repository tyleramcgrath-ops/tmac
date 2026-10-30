// Local stand-in for Vercel: static files with clean URLs, and api/*.js run as
// serverless handlers with the same req/res helpers Vercel adds.
//
//   QUAKE_DATA_FILE=demo-data.json node dev-server.js     (port 3000; PORT to change)
//
// Add DATABASE_URL (and RESEND_API_KEY) to exercise sign-in against a real Postgres.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

function decorate(req, res, url) {
  req.query = Object.fromEntries(url.searchParams);
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { if (!res.getHeader('content-type')) res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(obj)); return res; };
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  try { return raw ? JSON.parse(raw) : {}; } catch (e) { return raw; }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) {
      const file = path.join(ROOT, url.pathname.replace(/\/$/, '') + '.js');
      if (!file.startsWith(path.join(ROOT, 'api')) || !fs.existsSync(file)) { res.statusCode = 404; res.end('no such function'); return; }
      const handler = require(file);
      decorate(req, res, url);
      const raw = handler.config && handler.config.api && handler.config.api.bodyParser === false;
      if (!raw && req.method !== 'GET') req.body = await readBody(req);
      await handler(req, res);
      return;
    }
    let p = url.pathname === '/' ? '/index.html' : url.pathname;
    if (!path.extname(p)) p += '.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || /\/(lib|db|test|api)\//.test(p) || !fs.existsSync(file)) { res.statusCode = 404; res.end('not found'); return; }
    res.setHeader('content-type', TYPES[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    console.error(e);
    res.statusCode = 500; res.end(e.message);
  }
}).listen(Number(process.env.PORT || 3000), () => console.log('SERP Quake site on http://localhost:' + (process.env.PORT || 3000)));
