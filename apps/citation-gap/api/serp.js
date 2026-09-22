// One Google query. Normalizes SerpApi and Serper into a single shape so the
// front end never has to know which provider is behind it.

function domainOf(u) {
  try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return ''; }
}

function dedupe(list, keyFn) {
  const seen = new Set(); const out = [];
  for (const item of list) {
    const k = keyFn(item);
    if (!k || seen.has(k)) continue;
    seen.add(k); out.push(item);
  }
  return out;
}

// SerpApi returns the overview as nested text_blocks of varying shape.
function flattenBlocks(blocks, out) {
  out = out || [];
  for (const b of blocks || []) {
    if (typeof b === 'string') { out.push(b); continue; }
    if (b.title) out.push(b.title);
    if (b.snippet) out.push(b.snippet);
    if (b.text) out.push(b.text);
    if (Array.isArray(b.list)) flattenBlocks(b.list, out);
    if (Array.isArray(b.text_blocks)) flattenBlocks(b.text_blocks, out);
    if (Array.isArray(b.table)) for (const row of b.table) out.push((row || []).join(' | '));
  }
  return out;
}

function refsFrom(aio) {
  const refs = [];
  for (const r of aio.references || []) {
    const d = domainOf(r.link || '');
    if (d) refs.push({ domain: d, url: r.link, title: r.title || r.source || '' });
  }
  // Some responses attach links per block instead of a top-level references array.
  const walk = (blocks) => {
    for (const b of blocks || []) {
      if (b && b.link) { const d = domainOf(b.link); if (d) refs.push({ domain: d, url: b.link, title: b.title || '' }); }
      if (b && Array.isArray(b.list)) walk(b.list);
      if (b && Array.isArray(b.text_blocks)) walk(b.text_blocks);
    }
  };
  walk(aio.text_blocks);
  return dedupe(refs, (r) => r.domain);
}

async function viaSerpApi(q, key, gl, hl, num) {
  const base = 'https://serpapi.com/search.json';
  const u = `${base}?engine=google&q=${encodeURIComponent(q)}&api_key=${encodeURIComponent(key)}`
          + `&gl=${gl}&hl=${hl}&num=${num}&device=desktop`;
  const r = await fetch(u);
  const j = await r.json();
  if (j.error) throw new Error('SerpApi: ' + j.error);

  const organic = dedupe(
    (j.organic_results || []).map((o, i) => ({
      position: o.position || i + 1,
      title: o.title || '',
      url: o.link || '',
      domain: domainOf(o.link || ''),
      snippet: o.snippet || ''
    })).filter((o) => o.url && o.domain),
    (o) => o.url
  );

  const paa = (j.related_questions || []).map((x) => x.question).filter(Boolean);

  let aiOverview = null;
  let ai = j.ai_overview;
  if (ai) {
    // The overview often arrives as a token that must be redeemed within ~60s.
    if (ai.page_token && !ai.text_blocks) {
      try {
        const t = await fetch(`${base}?engine=google_ai_overview&page_token=${encodeURIComponent(ai.page_token)}&api_key=${encodeURIComponent(key)}`);
        const tj = await t.json();
        if (tj && tj.ai_overview) ai = tj.ai_overview;
      } catch (e) { /* keep whatever the first call gave us */ }
    }
    if (ai.text_blocks || ai.references) {
      aiOverview = { text: flattenBlocks(ai.text_blocks).join('\n').slice(0, 6000), sources: refsFrom(ai) };
    }
  }

  const features = [];
  if (aiOverview) features.push('ai_overview');
  if (paa.length) features.push('people_also_ask');
  if (j.answer_box) features.push('featured_snippet');
  if (j.ads && j.ads.length) features.push('ads');
  if (j.local_results) features.push('local_pack');

  return { organic, paa, aiOverview, features, provider: 'serpapi' };
}

async function viaSerper(q, key, gl, hl, num) {
  const r = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, gl, hl, num })
  });
  const j = await r.json();
  if (j.message && !j.organic) throw new Error('Serper: ' + j.message);

  const organic = dedupe(
    (j.organic || []).map((o, i) => ({
      position: o.position || i + 1,
      title: o.title || '',
      url: o.link || '',
      domain: domainOf(o.link || ''),
      snippet: o.snippet || ''
    })).filter((o) => o.url && o.domain),
    (o) => o.url
  );

  const paa = (j.peopleAlsoAsk || []).map((x) => x.question).filter(Boolean);

  let aiOverview = null;
  const ai = j.aiOverview || j.answerBox;
  if (j.aiOverview) {
    const srcs = dedupe(
      (j.aiOverview.references || j.aiOverview.sources || [])
        .map((s) => ({ domain: domainOf(s.link || s.url || ''), url: s.link || s.url || '', title: s.title || '' }))
        .filter((s) => s.domain),
      (s) => s.domain
    );
    aiOverview = { text: (j.aiOverview.snippet || j.aiOverview.text || '').slice(0, 6000), sources: srcs };
  }

  const features = [];
  if (aiOverview) features.push('ai_overview');
  if (paa.length) features.push('people_also_ask');
  if (j.answerBox) features.push('featured_snippet');
  return { organic, paa, aiOverview, features, provider: 'serper' };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { q, key, provider = 'serpapi', gl = 'us', hl = 'en', num = '10' } = req.query || {};
    if (!q) return res.status(400).json({ error: 'Missing the search query.' });
    if (!key) return res.status(400).json({ error: 'No API key. Open Settings and paste one in.' });

    const n = Math.min(Math.max(parseInt(num, 10) || 10, 10), 20);
    const out = provider === 'serper'
      ? await viaSerper(q, key, gl, hl, n)
      : await viaSerpApi(q, key, gl, hl, n);

    out.query = q;
    return res.status(200).json(out);
  } catch (err) {
    return res.status(200).json({ error: String(err.message || err), organic: [], paa: [], aiOverview: null, features: [] });
  }
};
