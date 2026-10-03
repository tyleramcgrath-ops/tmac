// The resumable scan.
//
// A scan is seven phases and roughly 25 calls, several of them headless Chromium loads. That is
// minutes of wall clock, and no serverless function gets minutes. So the job carries a `step` and
// a `cursor`, and one tick does exactly ONE unit of work: one page fetch, one search, one render.
// It banks what it learned into `payload` and returns. A job that dies at competitor_pages
// cursor 5 resumes at competitor_pages cursor 5 with four phases already banked — crash-safety
// falls out of the shape rather than being bolted on.
//
// `io` is injected (page, serp, render) so the tests drive the real steps against a fixture
// server instead of the internet, and `report` is injected so the browser could pass its own
// progress logger where the tick passes a no-op.
//
// Scoring is NOT reimplemented here. It comes from score.js — the same module the browser loads —
// because a scheduled scan and a watched scan producing different numbers is the failure this
// whole arrangement exists to prevent.
const score = require('../score.js');

const STEPS = ['target_page', 'serp_head', 'serp_questions', 'competitor_pages',
               'competitor_renders', 'rescue_renders', 'target_render', 'score'];

const COMP_FLOOR_WORDS = 300;
const BATCH = 3;   // competitor fetches per tick, matching the browser's batching

const noop = () => {};

// The six buyer questions, from the browser's own template. People-also-ask first, template to
// fill: a question Google is already answering is worth more than one we invented.
function questionsFor(kw, paa, want) {
  const tpl = ['what is ' + kw + ' and how does it work', 'how much does ' + kw + ' cost',
               'do ' + kw + ' actually work', 'best ' + kw,
               kw + ' vs alternatives which is better', 'is ' + kw + ' worth it'];
  const seen = new Set(), out = [];
  for (const q of (paa || []).concat(tpl)) {
    const k = String(q).toLowerCase().replace(/\W+/g, ' ').trim();
    if (!k || seen.has(k)) continue;
    seen.add(k); out.push(q);
    if (out.length >= want) break;
  }
  return out;
}

function ownDomainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return ''; }
}

// Competitors to fetch: the organic results, minus your own domain, minus repeats of a domain
// already counted. Every dropped slot is recorded rather than silently vanishing.
function pickTargets(head, ownDomain, depth) {
  const dispositions = [], seen = new Set(), targets = [];
  let deduped = 0;
  const ownHits = head.organic.filter((r) => r.domain === ownDomain).length;
  for (const r of head.organic) {
    if (r.domain === ownDomain) continue;
    if (seen.has(r.domain)) {
      deduped++;
      if (dispositions.length < 40) dispositions.push({ code: 'DEDUPED', domain: r.domain, count: 1,
        reason: 'same domain as an earlier result (' + String(r.url).replace(/^https?:\/\/(www\.)?/, '').slice(0, 60) + ')' });
      continue;
    }
    seen.add(r.domain); targets.push(r);
  }
  const used = targets.slice(0, depth);
  if (ownHits) dispositions.push({ code: 'NOT_A_COMPETITOR', domain: ownDomain, count: Math.min(ownHits, depth),
    reason: 'your own domain' });
  const short = depth - used.length - Math.min(ownHits, depth) - Math.min(deduped, depth);
  if (short > 0) dispositions.push({ code: 'SERP_SHORT', domain: '(google)', count: short,
    reason: 'Google returned only ' + head.organic.length + ' organic results for this query; ' + short
      + ' requested slot' + (short === 1 ? '' : 's') + ' had no page to fill' });
  return { targets: used, dispositions };
}

// --- one step -------------------------------------------------------------
//
// Returns { step, cursor, payload, done?, result? }. It never loops over a fan-out: the cursor
// is how it comes back for the next item, and that is what keeps a tick inside its budget.
async function stepOnce(job, io, report) {
  const say = report || noop;
  const p = job.payload || {};
  const cfg = p.config;
  const step = job.step, cursor = job.cursor || 0;
  const at = (nextStep, nextCursor, patch) =>
    ({ step: nextStep, cursor: nextCursor || 0, payload: Object.assign({}, p, patch || {}) });

  if (step === 'target_page') {
    say('Reading your page…');
    const mine = await io.page({ url: cfg.url, keyword: cfg.keyword, full: '1' });
    if (mine.error || !mine.wordCount) throw new Error('Could not read your page: ' + (mine.error || 'no content found'));
    mine.wordBasis = 'served';
    return at('serp_head', 0, { mine, ownDomain: ownDomainOf(cfg.url) });
  }

  if (step === 'serp_head') {
    say('Reading Google for “' + cfg.keyword + '”…');
    const head = await io.serp({ q: cfg.keyword, num: Math.max(cfg.depth, 10) });
    if (head.error) throw new Error(head.error);
    const picked = pickTargets(head, p.ownDomain, cfg.depth);
    return at('serp_questions', 0, {
      head, targets: picked.targets, dispositions: picked.dispositions,
      questions: questionsFor(cfg.keyword, head.paa, Math.max(cfg.nq, 0)),
      // a plain object rather than a Map: the payload has to survive a round trip through jsonb
      perDomain: {}, comps: [], failed: []
    });
  }

  if (step === 'serp_questions') {
    if (cursor >= p.questions.length) return at('competitor_pages', 0, { cov: coverage(p, cfg) });
    const q = p.questions[cursor];
    const s = await io.serp({ q, num: 10 });
    const perDomain = Object.assign({}, p.perDomain);
    if (!s.error) {
      const hits = new Set((s.organic || []).map((o) => o.domain));
      if (s.aiOverview) for (const x of s.aiOverview.sources || []) hits.add(x.domain);
      for (const d of hits) perDomain[d] = (perDomain[d] || 0) + 1;
      say('  ' + (cursor + 1) + '. ' + (s.aiOverview ? '[AIO] ' : '[   ] ') + q.slice(0, 58));
    }
    const nextCursor = cursor + 1;
    return nextCursor >= p.questions.length
      ? at('competitor_pages', 0, { perDomain, cov: coverage(Object.assign({}, p, { perDomain }), cfg) })
      : at('serp_questions', nextCursor, { perDomain });
  }

  if (step === 'competitor_pages') {
    if (cursor >= p.targets.length) return at('competitor_renders', 0);
    const batch = p.targets.slice(cursor, cursor + BATCH);
    const got = await Promise.all(batch.map((t) =>
      io.page({ url: t.url, keyword: cfg.keyword }).catch((e) => ({ error: String(e) }))));
    const comps = p.comps.slice(), failed = p.failed.slice();
    got.forEach((pg, j) => {
      const t = batch[j];
      if (pg.error || !pg.wordCount) {
        failed.push({ domain: t.domain, reason: pg.error || 'no content',
          code: /timed out|timeout/i.test(pg.error || '') ? 'TIMEOUT' : 'FAILED', url: t.url, position: t.position });
        return;
      }
      // The minimum-content gate. A page with 82 words and no headings is a blocked or
      // script-gated fetch that passed the "readable" check, and it would drag every median down.
      const headings = (pg.h1Count || 0) + (pg.h2Count || 0) + (pg.h3Count || 0);
      if (pg.wordCount < COMP_FLOOR_WORDS || headings === 0) {
        failed.push({ domain: t.domain, code: 'BELOW_MIN_CONTENT', excluded: true,
          reason: pg.wordCount + ' main-content words, ' + headings + ' headings — below the '
            + COMP_FLOOR_WORDS + '-word / 1-heading floor; likely a script-gated or blocked fetch',
          servedWords: pg.wordCount, servedHeadings: headings, url: t.url, position: t.position });
        return;
      }
      pg.domain = t.domain; pg.position = t.position; pg.wordBasis = 'served';
      comps.push(pg);
      say('  ✓ #' + t.position + '  ' + t.domain + '  ' + pg.wordCount + 'w');
    });
    const nextCursor = cursor + batch.length;
    return nextCursor >= p.targets.length
      ? at('competitor_renders', 0, { comps, failed })
      : at('competitor_pages', nextCursor, { comps, failed });
  }

  if (step === 'competitor_renders') {
    // Only on the rendered basis, which v1 of the job does not offer — see SAAS-PLAN. On the
    // served basis every competitor is already measured the same way, so there is nothing to do.
    return at('rescue_renders', 0);
  }

  if (step === 'rescue_renders') {
    // A competitor that failed the floor might be script-gated rather than thin. Rendering it
    // does not change whether it is used — a rendered page cannot share a served-HTML basis — but
    // it changes what the report says happened, and "we could not read it" versus "it is built in
    // JavaScript" are different things to tell someone.
    const candidates = (p.failed || []).filter((f) => f.code === 'BELOW_MIN_CONTENT');
    if (cursor >= candidates.length) return at('target_render', 0);
    const f = candidates[cursor];
    let rr = null;
    try { rr = await io.render({ url: f.url, wait: '1500', parse: '1', keyword: cfg.keyword }); } catch (e) { rr = null; }
    const failed = p.failed.map((x) => {
      if (x.url !== f.url) return x;
      const words = rr && rr.parsed ? (rr.parsed.wordCount || 0) : 0;
      const heads = rr && rr.parsed ? ((rr.parsed.h1Count || 0) + (rr.parsed.h2Count || 0) + (rr.parsed.h3Count || 0)) : 0;
      if (words >= COMP_FLOOR_WORDS && heads > 0) {
        return Object.assign({}, x, { code: 'BASIS_MISMATCH', renderedWords: words,
          reason: 'served HTML gave ' + x.servedWords + ' words (script-gated); rendered in a browser it reads '
            + words + ' words, ' + heads + ' headings — a different measurement basis from the other '
            + 'competitors, so it is NOT used on the served basis.' });
      }
      return Object.assign({}, x, { renderedWords: words,
        reason: x.reason + '; rendered in a browser too: ' + words + ' words, ' + heads + ' headings — still below the floor' });
    });
    return at('rescue_renders', cursor + 1, { failed });
  }

  if (step === 'target_render') {
    say('Rendering your page in a real browser…');
    let rendered = null;
    try { rendered = await io.render({ url: cfg.url, wait: '2500', parse: '1', keyword: cfg.keyword }); }
    catch (e) { rendered = null; }
    return at('score', 0, { rendered });
  }

  if (step === 'score') {
    say('Scoring…');
    const mine = p.mine, comps = p.comps, cov = p.cov, ownDomain = p.ownDomain, rendered = p.rendered;
    const m = score.medians(comps);
    const cats = score.categoryEntities(comps, ownDomain);
    const rk = score.scoreRank(mine, m);
    // Visible text from the render decides PRESENT vs PRESENT BUT HIDDEN — and only when the
    // render's own gate check passed, because a stuck gate says nothing about what a visitor sees.
    const vis = rendered ? { text: rendered.innerText || '', reliable: !(rendered.gate && rendered.gate.state === 'stuck') } : null;
    const an = score.scoreAnswer(mine, m, cov, cats, vis);
    const band = score.looBand(comps, mine, cov, ownDomain, vis);
    const fixes = score.buildFixes(mine, m, rk[1], an[1], cfg.keyword, cats, an[2], cfg.brand || '',
      { band: band, rendered: rendered });

    return {
      step: 'score', cursor: 0, payload: p, done: true,
      result: {
        rank: rk[0], answer: an[0],
        fingerprint: score.fingerprintOf(mine),
        findings: {
          rank: rk[0], answer: an[0], rankRows: rk[1], answerRows: an[1],
          fixes: fixes.map((f) => f.key), tasks: fixes.length,
          band: band, medians: m, cats: cats, missing: an[2],
          sample: { requested: cfg.depth, used: comps.length, dispositions: p.dispositions.concat(
            p.failed.map((f) => ({ code: f.code, domain: f.domain, count: 1, reason: f.reason }))) },
          failed: p.failed
        }
      }
    };
  }

  throw new Error('unknown step: ' + step);
}

// Coverage: how many of the buyer questions you appear in, against the median of your peers.
function coverage(p, cfg) {
  const ranked = Object.entries(p.perDomain || {}).sort((a, b) => b[1] - a[1]);
  const peers = ranked.filter((x) => x[0] !== p.ownDomain).slice(0, 10).map((x) => x[1]);
  return {
    queries: (p.questions || []).length, questions: p.questions || [], domains: ranked,
    mine: (p.perDomain || {})[p.ownDomain] || 0,
    peerMedian: peers.length ? Math.round(score.median(peers)) : 1
  };
}

// Drives a job to completion in one process. This is what the tests use and what a browser
// driver would use; the tick deliberately does not, because the whole point there is to stop
// after one step.
async function runToCompletion(job, io, report, maxSteps) {
  let j = Object.assign({}, job);
  for (let i = 0; i < (maxSteps || 200); i++) {
    const out = await stepOnce(j, io, report);
    j = { step: out.step, cursor: out.cursor, payload: out.payload };
    if (out.done) return { job: j, result: out.result, steps: i + 1 };
  }
  throw new Error('scan did not finish within the step budget');
}

module.exports = { STEPS, COMP_FLOOR_WORDS, BATCH, stepOnce, runToCompletion, questionsFor, pickTargets, coverage };
