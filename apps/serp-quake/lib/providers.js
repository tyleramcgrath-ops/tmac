// One Google top-10 reading for one keyword, normalized across SerpApi and
// Serper (same shape apps/citation-gap/api/serp.js uses). Only what the
// seismograph measures is kept: ordered organic URLs and which SERP features
// appeared.

'use strict';

const { domainOf } = require('./metrics');

function organicFrom(list) {
  const seen = new Set();
  const out = [];
  for (const [i, o] of (list || []).entries()) {
    const url = o.link || '';
    const domain = domainOf(url);
    if (!url || !domain || seen.has(url)) continue;
    seen.add(url);
    out.push({ position: o.position || i + 1, url, domain, title: o.title || '' });
  }
  return out.slice(0, 10);
}

async function viaSerpApi(st, key) {
  const u = 'https://serpapi.com/search.json?engine=google'
    + `&q=${encodeURIComponent(st.keyword)}&api_key=${encodeURIComponent(key)}`
    + `&gl=${st.gl || 'us'}&hl=${st.hl || 'en'}&num=10&device=desktop&no_cache=true`;
  const r = await fetch(u);
  const j = await r.json();
  if (j.error) throw new Error('SerpApi: ' + j.error);
  const features = [];
  if (j.ai_overview) features.push('ai_overview');
  if (j.answer_box) features.push('featured_snippet');
  if ((j.related_questions || []).length) features.push('people_also_ask');
  if (j.local_results || j.local_map) features.push('local_pack');
  if ((j.top_stories || []).length) features.push('top_stories');
  if ((j.inline_videos || []).length) features.push('videos');
  if ((j.shopping_results || j.immersive_products || []).length) features.push('shopping');
  if (j.knowledge_graph) features.push('knowledge_panel');
  if ((j.discussions_and_forums || []).length) features.push('forums');
  return { organic: organicFrom(j.organic_results), features, provider: 'serpapi' };
}

async function viaSerper(st, key) {
  const r = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: st.keyword, gl: st.gl || 'us', hl: st.hl || 'en', num: 10 }),
  });
  const j = await r.json();
  if (j.message && !j.organic) throw new Error('Serper: ' + j.message);
  const features = [];
  if (j.aiOverview) features.push('ai_overview');
  if (j.answerBox) features.push('featured_snippet');
  if ((j.peopleAlsoAsk || []).length) features.push('people_also_ask');
  if (j.places || j.localResults) features.push('local_pack');
  if ((j.topStories || []).length) features.push('top_stories');
  if ((j.videos || []).length) features.push('videos');
  if ((j.shopping || []).length) features.push('shopping');
  if (j.knowledgeGraph) features.push('knowledge_panel');
  return { organic: organicFrom(j.organic), features, provider: 'serper' };
}

// Every configured provider, primary first. With two, a suspect reading is
// re-read through the other one: a second seismometer at the same station.
function configuredProviders(env = process.env) {
  const out = [];
  if (env.SERPER_API_KEY) out.push({ name: 'serper', read: (st) => viaSerper(st, env.SERPER_API_KEY) });
  if (env.SERPAPI_KEY) out.push({ name: 'serpapi', read: (st) => viaSerpApi(st, env.SERPAPI_KEY) });
  if (env.QUAKE_PRIMARY === 'serpapi') out.reverse();
  return out;
}

module.exports = { configuredProviders, organicFrom };
