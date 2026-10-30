// Citation Gap as one long-running Node server, for SiteGround's Node.js hosting (the same
// hosting SaySites and LawMatchNow run on). On Vercel each file under api/ was its own
// serverless function and public/ was served by the CDN; here one process does both, with the
// handlers running unchanged.
//
//   npm run build   (node build.js: verify the manifest, write public/)
//   npm start       (node server.js, on $PORT)
//
// What this adds that Vercel used to provide:
//   req.query / req.body / res.status / res.json / res.send, the helpers the handlers expect;
//   a body left raw for handlers that opt out (stripe-webhook.js's bodyParser: false);
//   the job runner: api/tick.js used to be woken by a Vercel cron, now by a timer here, and
//     TICK_BASE_URL defaults to this server so a tick can hand off to the next;
//   pruning SiteGround's old release folders, which it never removes on its own.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const API = path.join(ROOT, 'api');
const PORT = Number(process.env.PORT || 3000);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.webp': 'image/webp',
};

if (!process.env.TICK_BASE_URL) process.env.TICK_BASE_URL = 'http://127.0.0.1:' + PORT;

function helpers(req, res, url) {
  req.query = Object.fromEntries(url.searchParams);
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    if (!res.getHeader('content-type')) res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(obj));
    return res;
  };
  res.send = (body) => {
    if (body !== null && typeof body === 'object' && !Buffer.isBuffer(body)) return res.json(body);
    res.end(body);
    return res;
  };
  res.redirect = (a, b) => {
    const [code, loc] = typeof a === 'number' ? [a, b] : [307, a];
    res.writeHead(code, { location: loc });
    res.end();
    return res;
  };
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

function parseBody(buf, type) {
  const text = buf.toString('utf8');
  if (!text) return undefined;
  if (/application\/json/i.test(type || '')) { try { return JSON.parse(text); } catch (e) { return text; } }
  if (/application\/x-www-form-urlencoded/i.test(type || '')) return Object.fromEntries(new URLSearchParams(text));
  return text;
}

// /api/auth/link → api/auth/link.js, nothing outside api/.
function apiFile(pathname) {
  const rel = pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  if (!rel || rel.split('/').some((p) => p === '..' || p.startsWith('.'))) return null;
  const file = path.join(API, rel + '.js');
  return file.startsWith(API + path.sep) && fs.existsSync(file) ? file : null;
}

function staticFile(pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(PUBLIC, rel);
  if (!file.startsWith(PUBLIC + path.sep) && file !== PUBLIC) return null;
  try {
    if (fs.statSync(file).isFile()) return file;
  } catch (e) {}
  try {
    if (!path.extname(file) && fs.statSync(file + '.html').isFile()) return file + '.html';
  } catch (e) {}
  return null;
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/healthz') { res.writeHead(200, { 'content-type': 'text/plain' }); res.end('ok'); return; }

  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
    const file = apiFile(url.pathname);
    if (!file) { res.writeHead(404, { 'content-type': 'application/json' }); res.end('{"error":"Not found."}'); return; }
    const handler = require(file);
    helpers(req, res, url);
    const raw = handler.config && handler.config.api && handler.config.api.bodyParser === false;
    if (!raw && req.method !== 'GET' && req.method !== 'HEAD') {
      req.body = parseBody(await readBody(req), req.headers['content-type']);
    }
    await handler(req, res);
    return;
  }

  const file = staticFile(url.pathname);
  if (!file) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('Not found'); return; }
  res.writeHead(200, {
    'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'cache-control': path.basename(file) === 'index.html' ? 'no-cache' : 'public, max-age=3600',
  });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((e) => {
    console.error('request failed:', req.method, req.url, e && e.stack || e);
    if (!res.headersSent) res.writeHead(500, { 'content-type': 'application/json' });
    res.end('{"error":"Something went wrong."}');
  });
});

// The job runner. Vercel woke api/tick.js once a day (the Hobby plan's cron limit) and every
// scan chained ticks after that; here the server is always up, so check the queue every ten
// minutes. An empty queue is one cheap query.
function tickNow() {
  if (!process.env.CRON_SECRET || !process.env.DATABASE_URL) return;
  fetch(process.env.TICK_BASE_URL + '/api/tick', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-cron-secret': process.env.CRON_SECRET },
    body: '{}',
  }).catch((e) => console.error('tick failed:', e.message));
}

// SiteGround puts every deploy in a new folder (".nodeapp/1790973536-im6ky2") beside the last and
// never removes the old ones, so each update adds thousands of files toward the plan's inode
// limit. Keep the release running now and the one before it; never let this stop the app.
// (Same rule as apps/lawmatchnow/lib/prune-releases.ts.)
function pruneReleases(cwd = process.cwd()) {
  const RELEASE = /^(\d{10})-[a-z0-9]{6}$/;
  try {
    const release = [cwd, path.dirname(cwd)].find((d) => RELEASE.test(path.basename(d)));
    if (!release) return;
    const mine = Number(path.basename(release).match(RELEASE)[1]);
    const parent = path.dirname(release);
    const older = fs.readdirSync(parent, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.isSymbolicLink())
      .map((d) => ({ name: d.name, at: Number((d.name.match(RELEASE) || [])[1]) }))
      .filter((d) => d.at > 1600000000 && d.at < mine && !d.name.endsWith('-origin'))
      .sort((a, b) => b.at - a.at);
    for (const old of older.slice(1)) {
      fs.rmSync(path.join(parent, old.name), { recursive: true, force: true });
      console.log('[prune-releases] removed old release ' + old.name);
    }
  } catch (e) {
    console.error('[prune-releases] skipped:', e.message);
  }
}

if (require.main === module) {
  server.listen(PORT, () => {
    console.log('Citation Gap on port ' + PORT);
    setTimeout(pruneReleases, 60000).unref();
    setTimeout(tickNow, 30000).unref();
    setInterval(tickNow, 10 * 60 * 1000).unref();
  });
}

module.exports = { server, apiFile, staticFile, parseBody };
