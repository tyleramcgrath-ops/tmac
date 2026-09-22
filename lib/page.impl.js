// Fetch one page and extract every on-page signal both engines score against.
// This is the IBP "code verification" core, ported to zero-dependency Node.
//
// Every figure this file emits has to be reproducible by a person with a browser and ten
// minutes, because that is exactly what STEP 0 of the work order asks them to do. So the
// counting rules are stated explicitly (WORD_RULE, BLOCK_RULE), the stripped text is hashed
// and returned on request, and nothing is claimed about JavaScript that was not checked
// against the served markup.

const crypto = require('crypto');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
         + '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

const WORD_RULE =
  'Source: the HTML as the server sent it (no JavaScript run, no DOMParser innerText). Section boundary: '
  + 'the first <main> or <article> whose text exceeds 500 characters, otherwise <body> with <nav>, <header>, '
  + '<footer>, <aside> and <form> removed. <script>, <style>, <noscript>, <template>, <svg>, comments, and any '
  + 'element with a hidden attribute or an inline display:none / visibility:hidden are dropped with their '
  + 'contents (a stylesheet rule cannot be resolved without rendering; see the rendered count). Carousel clone '
  + 'slides (swiper-slide-duplicate, slick-cloned, owl-item cloned, splide__slide--clone) are dropped, since a '
  + 'loop carousel repeats every slide and would count each testimonial twice. Every tag is '
  + 'removed, so alt text, aria-labels, title attributes and other attribute values are NOT counted; HTML '
  + 'entities are decoded; whitespace is collapsed. The text is split on whitespace and a token counts as a '
  + 'word only if it contains at least one letter or digit (so a lone dash or pipe is not a word). Hyphenated '
  + 'compounds are one word; numerals are words.';

const BLOCK_RULE =
  'A block is the OUTERMOST element carrying an entrance-animation marker (class elementor-invisible, '
  + 'wpb_animate_when_almost_visible, wow, animate__animated, or a data-aos attribute) that contains '
  + 'text. A gated element nested inside another gated element is counted within its parent, not '
  + 'separately. The raw element count is every element carrying a marker, nested or not.';

const ENTITY_STOP = new Set(('The This That These Those You Your Our We It And But For With From How What Why '
  + 'When Where Who Which Get See Learn More Read All New Best Top Now Home Blog Contact About Privacy Terms '
  + 'Cookie Cookies Menu Search Close Open Next Previous Skip Toggle Sign Log Free Demo Request Explore '
  + 'Discover Introducing Meet Start Try Book Watch January February March April May June July August '
  + 'September October November December Monday Tuesday Wednesday Thursday Friday Saturday Sunday').split(' '));
// Generic marketing filler that is capitalized (usually because it leads a bullet or a
// bolded phrase) but names nothing - it pads the category-vocabulary list without
// representing a real missing concept.
const ENTITY_STOP2 = new Set(['Key', 'Team', 'Beyond', 'Related', 'Complete', 'Leading',
  'Trusted', 'Proven', 'Powerful', 'Advanced', 'Innovative', 'Comprehensive', 'Everything',
  'Everyone', 'Anytime', 'Anywhere', 'Today']);
// Section-header boilerplate ("Key Takeaways", "Table of Contents") and locale / UI chrome
// (a language switcher's "French") are not topic vocabulary, however often they recur.
const ENTITY_BOILERPLATE = new Set(('Takeaways Takeaway Summary Overview Conclusion Conclusions Introduction FAQ FAQs '
  + 'Resources Contents Content Table Share Tags Tag Categories Category Comments Comment Author Posted Updated '
  + 'Published Reviewed Written Sources References Footnotes Sitemap Navigation Subscribe Newsletter Login '
  + 'Register Account Cart Checkout Wishlist Compare Filter Sort Results Loading Continue Reading Article Articles '
  + 'Posts Post Page Pages Section Chapter Step Steps Part Note Notes Tip Tips Example Examples Pros Cons Verdict '
  + 'Highlights Details Specifications Specs Features Benefits Pricing Plans Testimonials Partners Clients Careers '
  + 'Press Media Events Webinar Webinars Podcast Video Videos Gallery Download Downloads Support Help Docs').split(' '));
const LANGUAGE_NAMES = new Set(('English French Spanish German Italian Portuguese Dutch Chinese Japanese Korean Arabic '
  + 'Russian Hindi Polish Swedish Norwegian Danish Finnish Turkish Greek Hebrew Thai Vietnamese Indonesian Czech '
  + 'Hungarian Romanian Ukrainian Català Français Español Deutsch Italiano Português Nederlands Svenska Norsk Dansk '
  + 'Suomi Polski Türkçe Русский 日本語 中文 한국어 Українська Čeština Magyar Română Ελληνικά').split(' '));
// Connectors that sit INSIDE one proper-noun-ish phrase ("Bank of America", "Software as
// a Service", "Department of Transportation") - not "and"/"or"/"with", which coordinate
// two SEPARATE entities and must never fuse them into one.
const ENTITY_GLUE = new Set(['of', 'for', 'as', 'the', 'a', 'an', 'to', 'in', 'on', 'de', '&']);

const STAT_RE = /(?:\$\s?\d[\d,]*(?:\.\d+)?\s?(?:[KMB]\b|million|billion|k\b)?)|(?:\d[\d,]*(?:\.\d+)?\s?%)|(?:\b\d+(?:\.\d+)?\s?[xX]\b)|(?:\b\d[\d,]*\+)/;
// A quantified CLAIM is a figure inside a sentence. A naked "31 %" lifted out of a
// counter widget is the same fact as the caption beside it - counting both inflates
// the score and misrepresents how much real proof the page carries.
const CLAIM_RE = /[A-Za-z]{3,}/;
// Words that mark an attribute value that leaked into text. No caption contains these.
const ATTR_LEAK_RE = /\b(id|class|srcset|sizes|viewbox|clippath|clip-path|xmlns|href|src|width|height|style|aria-[a-z]+|data-[a-z-]+)\b/i;

function decode(s) {
  return String(s || '')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'").replace(/&#(\d+);/g, (m, d) => String.fromCharCode(+d));
}
const norm = (s) => decode(String(s || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const fold = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
const sha256 = (s) => crypto.createHash('sha256').update(String(s || ''), 'utf8').digest('hex');
// The word rule, applied. Exported so a test can prove the count is reproducible from the text.
const wordsOf = (text) => String(text || '').split(/\s+/).filter((t) => /[A-Za-z0-9]/.test(t));

// Elements the served HTML itself declares hidden: a `hidden` attribute, or an inline
// display:none / visibility:hidden. Removed with their contents before any counting. A rule
// in a stylesheet cannot be resolved here — that is what the rendered count is for.
// Also matches carousel clone slides: a loop carousel (Swiper, Slick, Owl, Splide) duplicates every
// slide in the DOM, so counting them would count each testimonial twice.
// Clone selectors, specific first, generic fallback last. Each match is attributed to the
// selector that caught it, so the report can say "30 dropped by .owl-item.cloned" rather than
// "30 things dropped". A fallback that fires on a page is a signal to add a specific entry.
const CLONE_RULES = [
  ['.owl-item.cloned', (c) => /\bowl-item\b/.test(c) && /\bcloned\b/.test(c), 'specific'],
  ['.swiper-slide-duplicate', (c) => /\bswiper-slide-duplicate\b/.test(c), 'specific'],
  ['.slick-cloned', (c) => /\bslick-cloned\b/.test(c), 'specific'],
  ['.splide__slide--clone', (c) => /\bsplide__slide--clone\b/.test(c), 'specific'],
  ['.ue-carousel-item.cloned', (c) => /\bue-carousel-item\b/.test(c) && /\bcloned\b/.test(c), 'specific'],
  // .uc_classic_carousel_placeholder was listed here in v10.4 and removed in v10.5: it is a
  // layout placeholder (one per real card), not a duplicate slide, and never a clone.
  ['[class*="swiper-slide-duplicate"]', (c) => /swiper-slide-duplicate/.test(c), 'fallback'],
  ['[class*="slick-cloned"]', (c) => /slick-cloned/.test(c), 'fallback'],
  ['[class*="--clone"]', (c) => /--clone/.test(c), 'fallback'],
  ['[class*="__clone"]', (c) => /__clone/.test(c), 'fallback'],
  ['[class$="-cloned"]', (c) => /-cloned$/.test(c.trim()), 'fallback']
];
function cloneRuleFor(cls) {
  for (const r of CLONE_RULES) if (r[1](cls)) return r;
  return null;
}
const HIDDEN_OPEN_RE = /<([a-z][a-z0-9]*)(?=[\s>])[^>]*?(?:\shidden(?=[\s>\/=])|style\s*=\s*["'][^"']*(?:display\s*:\s*none|visibility\s*:\s*hidden)[^"']*["']|class\s*=\s*["'][^"']*(?:swiper-slide-duplicate|slick-cloned|cloned|--clone|__clone)[^"']*["'])[^>]*>/gi;
// The declared-hidden spans of a document: [start, end, {tag, cls, reason}]. Used twice — to
// drop hidden text from word counts, and to LABEL (never drop) headings that sit inside one,
// so a heading census matches what a person counts in the page source.
function hiddenSpans(html) {
  const spans = [];
  let pos = 0, n = 0, m;
  HIDDEN_OPEN_RE.lastIndex = 0;
  while ((m = HIDDEN_OPEN_RE.exec(html)) && n < 500) {
    if (m.index < pos) continue;                     // inside a span already recorded
    const tag = (m[1] || 'div').toLowerCase();
    if (/^(input|img|br|hr|meta|link|source|wbr|area|col|embed|track|param)$/.test(tag)) continue;
    const open = m[0];
    const clsM = open.match(/class\s*=\s*["']([^"']*)["']/i);
    const cls = clsM ? clsM[1] : '';
    let reason = /\shidden(?=[\s>\/=])/i.test(open) ? 'hidden attribute'
      : /display\s*:\s*none/i.test(open) ? 'inline display:none'
      : /visibility\s*:\s*hidden/i.test(open) ? 'inline visibility:hidden' : '';
    let rule = null;
    if (!reason) {
      rule = cloneRuleFor(cls);
      if (!rule) continue;                            // the coarse regex matched a class that no rule accepts
      reason = 'carousel clone slide';
    }
    const end = elementEnd(html, m.index, tag);
    spans.push([m.index, end, { tag, cls: cls.trim().split(/\s+/).slice(0, 4).join(' '), reason, rule: rule ? rule[0] : '', ruleKind: rule ? rule[2] : '' }]);
    pos = end; n++;
    HIDDEN_OPEN_RE.lastIndex = end;
  }
  return spans;
}
function stripHidden(html) {
  let out = '', pos = 0;
  for (const [start, end] of hiddenSpans(html)) { out += html.slice(pos, start) + ' '; pos = end; }
  return out + html.slice(pos);
}

// Scripts, styles, templates, SVG and comments go; declared-hidden elements STAY here (they
// are dropped from the word count later, and labelled in the heading census).
function stripNoise(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<template[\s\S]*?<\/template>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
}

function mainRegion(html) {
  for (const tag of ['main', 'article']) {
    const m = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    if (m && norm(m[1]).length > 500) return { html: m[1], regionName: '<' + tag + '>' };
  }
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let region = body ? body[1] : html;
  region = region
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<aside[\s\S]*?<\/aside>/gi, ' ')
    .replace(/<form[\s\S]*?<\/form>/gi, ' ');
  return { html: region, regionName: '<body> minus nav/header/footer/aside/form' };
}

// ---- Headings ---------------------------------------------------------------------------
// A heading generated by a post-feed / loop widget is TEMPLATE: it changes when the feed
// changes and cannot be "merged" by an editor. Only EDITORIAL headings are consolidation
// targets. The widget wrappers are literal classes in the served HTML.
const TEMPLATE_WRAP_RE = new RegExp(
  '<([a-z][a-z0-9]*)[^>]*class\\s*=\\s*["\'][^"\']*\\b(elementor-widget-posts|elementor-posts|elementor-widget-loop-grid|elementor-loop-container|elementor-widget-archive-posts|elementor-widget-portfolio|wp-block-latest-posts|wp-block-query|wp-block-post-template|recent-posts|latest-posts|related-posts|post-list|posts-list|posts-grid|post-grid|blog-list|blog-feed|blog-grid|post-feed|post-carousel|posts-carousel|ue-post|ue_post|jet-listing|widget_recent_entries|et_pb_blog|w-dyn-list|swiper-wrapper|owl-stage)\\b[^"\']*["\'][^>]*>',
  'gi');
const TEMPLATE_HEAD_RE = /class\s*=\s*["'][^"']*\b(elementor-post__title|entry-title|post-title|card-title|blog-title|ue-title|slide-title|swiper-slide-title|product-title|woocommerce-loop-product__title)\b/i;

function templateSpans(html) {
  const spans = [];
  TEMPLATE_WRAP_RE.lastIndex = 0;
  let m;
  while ((m = TEMPLATE_WRAP_RE.exec(html)) && spans.length < 200) {
    const end = elementEnd(html, m.index, (m[1] || 'div').toLowerCase());
    spans.push([m.index, end, m[2]]);
  }
  const artRe = /<article[\s>]/gi;
  while ((m = artRe.exec(html)) && spans.length < 400) spans.push([m.index, elementEnd(html, m.index, 'article'), 'article']);
  return spans;
}

// Levenshtein similarity ratio for short strings (headings).
function similarity(a, b) {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const n = a.length, mlen = b.length;
  let prev = new Array(mlen + 1), cur = new Array(mlen + 1);
  for (let j = 0; j <= mlen; j++) prev[j] = j;
  for (let i = 1; i <= n; i++) {
    cur[0] = i;
    for (let j = 1; j <= mlen; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    [prev, cur] = [cur, prev];
  }
  return 1 - prev[mlen] / Math.max(n, mlen);
}

function headings(html) {
  const out = { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [], outline: [] };
  const spans = templateSpans(html);
  const hid = hiddenSpans(html);
  const re = /<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(html))) {
    const t = norm(m[3]);
    if (!t) continue;
    const level = +m[1];
    const inTemplate = TEMPLATE_HEAD_RE.test(m[2]) || spans.some((s) => m.index > s[0] && m.index < s[1]);
    // Every served heading is counted — the census must match what a person counts in the
    // page source. One sitting inside a declared-hidden container is labelled, not dropped.
    const hs = hid.find((s) => m.index > s[0] && m.index < s[1]);
    out['h' + level].push(t);
    if (out.outline.length < 150) out.outline.push(Object.assign({ level, text: t.slice(0, 160), kind: inTemplate ? 'template' : 'editorial' },
      hs ? { hidden: true, hiddenBy: hs[2].reason + (hs[2].cls ? ' on .' + hs[2].cls.split(' ')[0] : '') } : {}));
  }
  // Per-level editorial / template / hidden counts, unique counts, and duplicates (exact
  // after folding, then near-duplicates at >90% similarity).
  const byLevel = {};
  for (let lv = 1; lv <= 6; lv++) byLevel[lv] = { total: 0, editorial: 0, template: 0, unique: 0, hidden: 0 };
  out.outline.forEach((h) => { byLevel[h.level].total++; byLevel[h.level][h.kind]++; if (h.hidden) byLevel[h.level].hidden++; });
  const dups = [];
  const groups = []; // {key, text, level, count, near, template, hidden}
  out.outline.forEach((h) => {
    const key = fold(h.text);
    let g = groups.find((x) => x.level === h.level && x.key === key);
    let near = false;
    if (!g) { g = groups.find((x) => x.level === h.level && key.length > 12 && similarity(x.key, key) > 0.9); near = !!g; }
    if (g) { g.count++; if (near) g.near = true; if (h.kind === 'template') g.template++; if (h.hidden) g.hidden++; }
    else groups.push({ key, text: h.text, level: h.level, count: 1, near: false, template: h.kind === 'template' ? 1 : 0, hidden: h.hidden ? 1 : 0 });
  });
  groups.forEach((g) => { byLevel[g.level].unique++; if (g.count > 1) dups.push({ text: g.text.slice(0, 160), level: g.level, count: g.count, near: g.near, inTemplate: g.template > 0, hiddenCopies: g.hidden }); });
  out.byLevel = byLevel;
  out.duplicates = dups.slice(0, 40);
  return out;
}

// ---- Structured data -------------------------------------------------------------------
// Top-level nodes (the roots, or the members of an @graph) are the entities a page actually
// declares. Everything below them - Question, Answer, Offer, PostalAddress - is a property
// of one of those. Merging the two makes a page look better covered than it is.
function parseJsonLd(html) {
  const roots = [];
  const re = /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    const raw = m[1].trim();
    let obj = null;
    try { obj = JSON.parse(raw); }
    catch (e) { try { obj = JSON.parse(raw.replace(/,\s*([}\]])/g, '$1')); } catch (e2) { obj = null; } }
    if (obj) roots.push(obj);
  }
  return roots;
}
const typesOf = (o) => {
  const t = o && o['@type'];
  if (typeof t === 'string') return [t];
  if (Array.isArray(t)) return t.filter((x) => typeof x === 'string');
  return [];
};
function schemaInfo(html, pageText) {
  const roots = parseJsonLd(html);
  const top = new Set(), nested = new Set();
  const topNodes = [];
  const visitTop = (o) => {
    if (!o) return;
    if (Array.isArray(o)) return o.forEach(visitTop);
    if (typeof o !== 'object') return;
    if (Array.isArray(o['@graph'])) { o['@graph'].forEach(visitTop); return; }
    typesOf(o).forEach((t) => top.add(t));
    topNodes.push(o);
  };
  roots.forEach(visitTop);
  const walk = (o, depth) => {
    if (!o) return;
    if (Array.isArray(o)) return o.forEach((x) => walk(x, depth));
    if (typeof o !== 'object') return;
    if (depth > 0 && !Array.isArray(o['@graph'])) typesOf(o).forEach((t) => { if (!top.has(t)) nested.add(t); });
    Object.keys(o).forEach((k) => { if (k !== '@context') walk(o[k], depth + 1); });
  };
  roots.forEach((r) => walk(r, 0));

  // Every type Google requires to be visibly supported gets its text string-matched against
  // the page. PRESENT/ABSENT per item, never inferred from a count.
  const folded = ' ' + fold(pageText) + ' ';
  const claims = [];
  const textOf = (v) => norm(typeof v === 'string' ? v : (v && (v.text || v.name)) || '');
  const check = (kind, text) => {
    if (!text || claims.length >= 60) return;
    const f = fold(text);
    if (!f) return;
    let present, matched;
    if (f.length <= 120) { present = folded.includes(' ' + f + ' ') || folded.includes(f); matched = 'full text'; }
    else { const head = f.slice(0, 100).replace(/\s+\S*$/, ''); present = folded.includes(head); matched = 'first ~15 words'; }
    claims.push({ kind, text: text.slice(0, 220), present, matched });
  };
  const seen = new Set();
  const walkClaims = (o) => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) return o.forEach(walkClaims);
    if (seen.has(o)) return; seen.add(o);
    const ts = typesOf(o).map((t) => t.toLowerCase());
    if (ts.includes('question')) {
      check('FAQ question', textOf(o.name));
      const a = o.acceptedAnswer || (Array.isArray(o.suggestedAnswer) ? o.suggestedAnswer[0] : o.suggestedAnswer);
      if (a) check('FAQ answer', textOf(a.text || a));
    }
    if (ts.includes('product') || ts.includes('service')) check(ts.includes('product') ? 'Product name' : 'Service name', textOf(o.name));
    if (ts.includes('offer') || ts.includes('aggregateoffer')) {
      const price = o.price != null ? String(o.price) : (o.lowPrice != null ? String(o.lowPrice) : '');
      if (price) check('Offer price', price);
    }
    if (ts.includes('review')) check('Review text', textOf(o.reviewBody || o.name));
    if (ts.includes('aggregaterating')) {
      if (o.ratingValue != null) check('Rating value', String(o.ratingValue));
      const n = o.reviewCount != null ? o.reviewCount : o.ratingCount;
      if (n != null) check('Rating count', String(n));
    }
    Object.keys(o).forEach((k) => { if (k !== '@context') walkClaims(o[k]); });
  };
  roots.forEach(walkClaims);

  const all = new Set([...top, ...nested]);
  return {
    schemaTypes: [...all].sort(),
    schemaTopLevel: [...top].sort(),
    schemaNested: [...nested].sort(),
    schemaTopLevelCount: topNodes.length,
    schemaClaims: claims,
    schemaClaimsAbsent: claims.filter((c) => !c.present).length
  };
}

// A capitalized word at the very start of a sentence is just English grammar, not a
// signal - "The Company ships..." capitalizes "The" for free. So the first word of
// every sentence is excluded from starting a phrase UNLESS it's already acronym-shaped
// (a digit, or a second internal capital: "IoT", "GPS", "OBD-II") - those are proper
// nouns regardless of position, and dropping them at sentence-start was how "OBD-II"
// used to vanish from every scan that happened to open with it.
function looksAcronymish(w) { return /[0-9]/.test(w) || /[A-Z]/.test(w.slice(1)); }
const capShaped = (w) => /^[A-Z][A-Za-z0-9&.\-]{1,23}$/.test(w);
function isCapWord(w, i, words) {
  if (!capShaped(w)) return false;
  if (i > 0 || looksAcronymish(w)) return true;
  // Sentence-initial, but the words after it continue a Title-Case phrase ("Global
  // Positioning System", "Internet of Things"): that is a proper phrase, not grammar.
  // A lone sentence-initial capital ("Fleet managers...") is still excluded.
  if (!words) return false;
  const clean = (x) => String(x || '').replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
  const n1 = clean(words[1]), n2 = clean(words[2]);
  if (n1 && capShaped(n1) && !/^\(/.test(words[1] || '')) return true;
  return !!(n1 && ENTITY_GLUE.has(n1.toLowerCase()) && n2 && capShaped(n2));
}

function entities(text) {
  // term -> { prose: occurrences inside a sentence of 6+ words, short: occurrences in a
  // heading / label / button-length fragment }. A term that lives only in short fragments
  // is a label, not vocabulary, unless it recurs as one (3+ times).
  const seen = new Map();
  for (const sentence of text.split(/(?<=[.!?])\s+|\n+/)) {
    const words = sentence.trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    // A heading is Title Case throughout; a sentence is not. Title-Case fragments are label
    // context however long they are.
    const capRatio = words.filter((w) => /^[A-Z]/.test(w.replace(/^[^A-Za-z0-9]+/, ''))).length / words.length;
    const prose = words.length >= 6 && capRatio < 0.7;
    const add = (term) => {
      const rec = seen.get(term) || { prose: 0, short: 0 };
      if (prose) rec.prose++; else rec.short++;
      seen.set(term, rec);
    };
    let run = [];
    // A run of adjacent capitalized words (optionally glued by an internal connector
    // like "of" or "as") is ONE concept - "Internet of Things" or "Global Positioning
    // System" - and is emitted once, whole. It is never also exploded into its
    // component unigrams and skip-bigrams ("Positioning System", "Global Positioning"),
    // which is how a single missing phrase used to turn into eight fake gaps.
    const flush = () => {
      if (!run.length) return;
      // A stop word inside a run SPLITS it ("Fleet Fuel Theft: How Telematics Helps" is two
      // fragments, never one fused phrase); it is not silently deleted from the middle.
      const isStop = (t) => ENTITY_STOP.has(t) || ENTITY_STOP2.has(t) || ENTITY_BOILERPLATE.has(t);
      const parts = [[]];
      run.forEach((t) => { if (isStop(t)) { if (parts[parts.length - 1].length) parts.push([]); } else parts[parts.length - 1].push(t); });
      parts.forEach((clean) => {
        while (clean.length && ENTITY_GLUE.has(clean[0])) clean.shift();
        while (clean.length && ENTITY_GLUE.has(clean[clean.length - 1])) clean.pop();
        if (clean.some((t) => /^[A-Z]/.test(t)) && !clean.every((t) => LANGUAGE_NAMES.has(t) || ENTITY_GLUE.has(t))) add(clean.join(' '));
      });
      run = [];
    };
    for (let i = 0; i < words.length; i++) {
      const raw = words[i];
      // A parenthetical gloss - "Internet of Things (IoT)" - names a SEPARATE, shorter
      // form of the same concept, not a continuation of the phrase before it. Close the
      // run first so "Things (IoT)" becomes "Things" + "IoT", not "Things IoT".
      const hadParenOpen = /^\(/.test(raw);
      const w = raw.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
      if (!w) { flush(); continue; }
      if (hadParenOpen && run.length) flush();
      if (isCapWord(w, i, words)) {
        if (run.length >= 6) flush(); // bound runaway runs (all-caps banners, nav strings)
        run.push(w);
      } else if (ENTITY_GLUE.has(w.toLowerCase()) && run.length) {
        const nextRaw = words[i + 1] || '';
        const next = nextRaw.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
        if (!/^\(/.test(nextRaw) && isCapWord(next, i + 1, words)) run.push(w.toLowerCase());
        else flush();
      } else {
        flush();
      }
    }
    flush();
  }
  return [...seen.entries()].filter(([, r]) => r.prose >= 1 || r.short >= 3).map(([t]) => t);
}

// ---- Counter widgets -------------------------------------------------------------------
// Animated counters (Elementor, Divi, WPBakery, Webflow) keep their figure in a data
// attribute. Whether the served text ALSO carries the figure varies by theme: some print
// the real value as the element's text, some print 0, some print nothing. That difference
// is exactly what decides whether a non-JS crawler can read the number, so it is measured
// per counter and reported, never assumed.
const COUNTER_ATTR = /(data-to-value|data-to|data-counter|data-count|data-target|data-number|data-end-value)\s*=\s*["']\s*([\d][\d.,]*)\s*["']/gi;

// Text nodes only. A label is read from the text between tags; attribute values are never
// consulted, so an SVG clip-path id or an <img sizes> value cannot be spliced onto a number.
function textNodes(fragment) {
  return fragment.split(/<[^>]*>/).map((t) => decode(t).replace(/\s+/g, ' ').trim()).filter(Boolean);
}
const letters = (s) => (s.match(/[A-Za-z]/g) || []).length;

function counterStats(html) {
  const out = [];
  COUNTER_ATTR.lastIndex = 0;
  let m;
  while ((m = COUNTER_ATTR.exec(html))) {
    const raw = m[2];
    const num = parseFloat(String(raw).replace(/,/g, ''));
    if (!num) continue;
    const tagStart = html.lastIndexOf('<', m.index);
    const tagEnd = html.indexOf('>', m.index);
    if (tagStart === -1 || tagEnd === -1) continue;
    const tag = html.slice(tagStart, tagEnd + 1);
    const attr = (name) => { const a = tag.match(new RegExp(name + '\\s*=\\s*["\']([^"\']*)["\']', 'i')); return a ? a[1].trim() : null; };
    const fromValue = attr('data-from-value');
    const toValue = attr('data-to-value') || raw;
    // The element's own served text: what a non-JS reader sees where the number goes.
    const nextLt = html.indexOf('<', tagEnd + 1);
    const elementText = norm(html.slice(tagEnd + 1, nextLt === -1 ? tagEnd + 1 : nextLt)).slice(0, 40);

    // AFTER window, cut back to the last complete tag so no partial tag survives.
    let after = html.slice(tagEnd + 1, tagEnd + 1 + 1500);
    const lastGt = after.lastIndexOf('>');
    if (lastGt !== -1) after = after.slice(0, lastGt + 1);
    // BEFORE window, cut forward past a leading partial tag (attribute-looking text with no '<').
    let before = html.slice(Math.max(0, tagStart - 1500), tagStart);
    const firstLt = before.indexOf('<'), firstGt = before.indexOf('>');
    if (firstGt !== -1 && (firstLt === -1 || firstGt < firstLt)) before = before.slice(firstGt + 1);

    const sufM = after.match(/suffix[^>]*>\s*([^<]{0,8})</i);
    const preM = after.match(/prefix[^>]*>\s*([^<]{0,8})</i);
    const suffix = sufM ? sufM[1].trim() : '';
    const prefix = preM ? preM[1].trim() : '';

    // Prefer the widget's own caption element; otherwise the nearest text node with
    // enough letters to be a sentence - after the number first, then before it.
    let label = '';
    const titleM = after.match(/(?:counter-title|stat-title|number-title|counter__label|stat-label|counter-label)[^>]*>\s*([^<]{4,160})</i);
    if (titleM) label = decode(titleM[1]);
    if (!label) {
      const cand = textNodes(after).find((t) => letters(t) >= 25 && !ATTR_LEAK_RE.test(t))
        || textNodes(before).reverse().find((t) => letters(t) >= 25 && !ATTR_LEAK_RE.test(t));
      label = cand || '';
    }
    label = label.trim().replace(/\s+/g, ' ');
    // A caption that fails the sanity checks is dropped; the counter itself is NOT — every
    // counter attribute in the HTML is one counter, captioned or not, so the count agrees
    // with what a person sees in the source.
    if (label.length < 8 || /^data-|^\d+$/.test(label) || !/\s/.test(label) || !/[aeiou]/i.test(label)
        || /(.)\1{5,}/.test(label) || ATTR_LEAK_RE.test(label)) label = '';
    const display = (prefix + raw + suffix).trim();
    if (out.some((o) => o.display === display && o.label === label && o.elementText === elementText)) continue;
    out.push({
      value: raw, display, prefix, suffix,
      label: label.slice(0, 160),
      hasCaption: !!label,
      elementText, fromValue, toValue,
      // True when the served element text already IS the figure (from == to, or the text
      // equals the value). Such a counter has no zero state at any point.
      textIsValue: elementText !== '' && parseFloat(elementText.replace(/,/g, '')) === num
    });
  }
  return out;
}

// ---- Entrance-animation gating ---------------------------------------------------------
// Frameworks that ship content HIDDEN and reveal it with JavaScript. When the reveal never
// fires, the content stays invisible to humans while sitting readable in the HTML. The
// marker is a literal class or attribute in the served markup, so the CANDIDATES are
// detectable server-side; whether a candidate is actually hidden right now needs a real
// browser (api/render.js), which the scan runs when it can.
const ANIM_RE = new RegExp(
  '<([a-z][a-z0-9]*)[^>]*(?:class\\s*=\\s*["\'][^"\']*\\b(elementor-invisible|wpb_animate_when_almost_visible|wow|animate__animated)\\b[^"\']*["\']|data-aos\\s*=)[^>]*>',
  'gi');
const ANIM_LABEL = {
  'elementor-invisible': 'Elementor entrance animation',
  'wpb_animate_when_almost_visible': 'WPBakery animation',
  'wow': 'WOW.js animation',
  'animate__animated': 'Animate.css animation'
};
const VOID_TAGS = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'wbr', 'area', 'col', 'embed', 'track', 'param']);

// Index just past the closing tag of the element that opens at `start`, by counting
// same-name open/close tags. Falls back to a bounded window when the markup is unbalanced.
function elementEnd(html, start, tagName) {
  const open = html.indexOf('>', start);
  if (VOID_TAGS.has(tagName) || open === -1 || html[open - 1] === '/') return open + 1;
  const re = new RegExp('<(/?)' + tagName + '(?=[\\s>/])[^>]*>', 'gi');
  re.lastIndex = open + 1;
  let depth = 1, m;
  while ((m = re.exec(html))) {
    if (m[1] === '/') { depth--; if (depth === 0) return m.index + m[0].length; }
    else if (!/\/>$/.test(m[0])) depth++;
    if (m.index - start > 60000) break;
  }
  return Math.min(html.length, open + 4000);
}

function animationGated(html) {
  const blocks = [];
  let rawCount = 0, activeEnd = -1;
  ANIM_RE.lastIndex = 0;
  let m;
  while ((m = ANIM_RE.exec(html))) {
    rawCount++;
    if (m.index < activeEnd) continue; // nested inside the current outermost block
    const tagName = (m[1] || 'div').toLowerCase();
    const end = elementEnd(html, m.index, tagName);
    activeEnd = end;
    const framework = ANIM_LABEL[(m[2] || '').toLowerCase()] || 'AOS animation';
    const win = html.slice(m.index, end);
    const text = norm(stripNoise(win));
    if (!text) continue;
    const hasHeading = /<h[1-6][\s>]/i.test(win);
    const hasCta = /<(a|button)[\s>][^>]*>[\s\S]*?[A-Za-z]{3,}[\s\S]*?<\/\1>/i.test(win);
    const carries = STAT_RE.test(text) ? 'statistic' : hasHeading ? 'heading' : hasCta ? 'call to action' : 'text';
    const sample = text.slice(0, 130).trim();
    if (blocks.length < 40) blocks.push({ framework, carries, sample, words: wordsOf(text).length });
  }
  return { blocks, rawCount };
}

// Everything the site itself names - navigation, footer, link paths, alt text - so a term
// the category uses can be told apart by whether THIS site already sells or resells it.
function siteLinkText(html, host) {
  const parts = new Set();
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) && parts.size < 900) {
    const href = m[1];
    let h = '';
    if (/^https?:/i.test(href)) { try { h = new URL(href).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { h = 'x'; } }
    if (h && h !== host) continue;
    const t = norm(m[2]); if (t) parts.add(t.slice(0, 80));
    let path = href.replace(/^https?:\/\/[^/]+/i, '').split(/[?#]/)[0];
    path.split(/[\/\-_.]+/).filter((s) => s.length > 2).forEach((s) => parts.add(s));
  }
  const alts = html.match(/\balt=["']([^"']{3,80})["']/gi) || [];
  alts.slice(0, 200).forEach((a) => parts.add(decode(a.replace(/^alt=["']|["']$/gi, ''))));
  return [...parts].join(' | ').slice(0, 20000);
}

function parse(html, url, keyword, opts) {
  opts = opts || {};
  const clean = stripNoise(html);
  const kw = fold(keyword);
  const kwWords = kw ? kw.split(' ').length : 1;

  const titleM = clean.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleM ? norm(titleM[1]) : '';

  const metaOf = (name) => {
    const a = clean.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i'));
    if (a) return decode(a[1]).trim();
    const b = clean.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["']`, 'i'));
    return b ? decode(b[1]).trim() : '';
  };
  const metaDescription = metaOf('description');
  const canonM = clean.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);

  const H = headings(clean);
  // Declared-hidden containers, listed so a reader can see what the served HTML hides and
  // what sits inside (headings, words). The word count below excludes them; the heading
  // census above labels them.
  const allSpans = hiddenSpans(clean);
  // Clone match log: which selector caught how many slides, and the words they carried.
  const cloneLog = {};
  allSpans.forEach((s) => {
    if (s[2].reason !== 'carousel clone slide') return;
    const k = s[2].rule;
    const rec = cloneLog[k] || (cloneLog[k] = { selector: k, kind: s[2].ruleKind, count: 0, words: 0 });
    rec.count++; rec.words += wordsOf(norm(clean.slice(s[0], s[1]))).length;
  });
  const carouselClones = Object.values(cloneLog);
  const hiddenContainers = allSpans.filter((s) => s[2].reason !== 'carousel clone slide').slice(0, 40).map((s) => {
    const win = clean.slice(s[0], s[1]);
    const heads = [];
    const hre = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi; let hm;
    while ((hm = hre.exec(win)) && heads.length < 12) { const t = norm(hm[2]); if (t) heads.push('H' + hm[1] + ' ' + t.slice(0, 80)); }
    return { tag: s[2].tag, cls: s[2].cls, reason: s[2].reason, words: wordsOf(norm(win)).length, headings: heads.length, headingTexts: heads.slice(0, 6) };
  }).filter((c) => c.words > 0 || c.headings > 0);
  const visible = stripHidden(clean);
  const reg = mainRegion(visible);
  const region = reg.html;
  const bodyText = norm(region);
  const words = wordsOf(bodyText);
  const wordCount = words.length;
  const bodyM = visible.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const pageText = norm(bodyM ? bodyM[1] : visible);        // whole served page, nav and all
  const pageWordCount = wordsOf(pageText).length;

  const folded = fold(bodyText);
  let exact = 0;
  if (kw) { let i = folded.indexOf(kw); while (i !== -1) { exact++; i = folded.indexOf(kw, i + kw.length); } }

  const imgs = region.match(/<img[^>]*>/gi) || [];
  const missingAlt = imgs.filter((t) => !/alt\s*=\s*["'][^"']+["']/i.test(t)).length;

  let host = ''; try { host = new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) {}
  let internal = 0, external = 0;
  const linkRe = /<a[^>]+href=["']([^"']+)["']/gi;
  let lm;
  while ((lm = linkRe.exec(region))) {
    const href = lm[1];
    if (/^(#|mailto:|tel:|javascript:)/i.test(href)) continue;
    if (/^https?:/i.test(href)) {
      let h = ''; try { h = new URL(href).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) {}
      if (h && h !== host) external++; else internal++;
    } else internal++;
  }

  // Block boundaries must survive norm(). A newline does not: norm collapses all
  // whitespace, so the whole page became ONE segment and any block longer than the
  // length cap was dropped wholesale - taking its statistics with it. U+0001 is not
  // whitespace, so it survives and gives real block splits.
  const BLOCK = '\u0001';
  const marked = region
    .replace(/<br\s*\/?>/gi, BLOCK)
    .replace(/<\/?(p|li|h[1-6]|div|td|th|dd|dt|blockquote|figcaption|section|article|ul|ol|table|tr|nav|aside|main|header|footer)(?=[\s>\/])[^>]*>/gi, BLOCK);
  const stats = [];
  for (const raw of norm(marked).split(new RegExp(BLOCK + '+|(?<=[.!?])\\s+'))) {
    const s = raw.trim();
    if (!s || s.length > 240) continue;
    if (!STAT_RE.test(s) || !CLAIM_RE.test(s)) continue;
    const claim = s.slice(0, 180);
    if (!stats.includes(claim)) stats.push(claim);
  }

  // Counter widgets, each checked against the served text. A counter is JS-DEPENDENT only
  // when its value is genuinely absent from everything the server sent - not "shows 0",
  // not "probably animated", but absent. Checked against the whole page, not just the
  // main region, because the question is what a non-JS reader can see anywhere.
  const servedAll = ' ' + pageText + ' ';
  const counters = counterStats(html).map((c) => {
    const num = c.value.replace(/[.]/g, '\\.');
    const inServed = c.textIsValue || new RegExp('(^|[^\\d.,])' + num + '($|[^\\d])').test(servedAll);
    return Object.assign({}, c, { inServedText: inServed });
  });
  const hiddenStats = counters.filter((c) => !c.inServedText)
    .map((c) => (c.display + ' ' + c.label).trim().slice(0, 180))
    .filter((h) => stats.indexOf(h) === -1);
  hiddenStats.forEach((h) => stats.push(h));

  // A counter/stat caption ("Reduction In Accidents", "31%") is sometimes marked up as a
  // real H2/H3 by the page builder, which inflates the subheading census with labels that
  // carry no outline idea of their own - cross-referenced by text so the fragmentation math
  // (and any "merge your headings" task) can tell a stat label from a genuine subheading.
  // The fix for one of these is a widget setting (demote the tag), never a merge candidate.
  const counterLabels = new Set(counters.filter((c) => c.hasCaption).map((c) => fold(c.label)));
  const counterCaptionHeadings = [];
  if (counterLabels.size) {
    H.outline.forEach((h) => {
      if ((h.level !== 2 && h.level !== 3) || h.kind === 'template') return;
      if (counterLabels.has(fold(h.text))) {
        h.counterCaption = true;
        counterCaptionHeadings.push({ level: h.level, text: h.text });
      }
    });
  }
  const h2CounterCaptions = counterCaptionHeadings.filter((h) => h.level === 2).length;
  const h3CounterCaptions = counterCaptionHeadings.filter((h) => h.level === 3).length;

  const gated = animationGated(html);
  const schema = schemaInfo(html, pageText);
  const qHeadings = [...H.h2, ...H.h3, ...H.h4].filter((h) => h.trim().endsWith('?'));
  // Per-level breakdown so a heading-count task can protect question-shaped H3s specifically
  // (they answer for the Answer-score table; merging them away undoes a scored gain).
  const questionHeadingsH3 = H.h3.filter((h) => h.trim().endsWith('?')).length;

  const out = {
    url,
    fetchedUrl: opts.fetchedUrl || url,
    finalUrl: opts.finalUrl || url,
    httpTitle: title,
    titleLen: title.length,
    metaDescription,
    metaDescLen: metaDescription.length,
    metaRobots: metaOf('robots'),
    canonical: canonM ? canonM[1] : '',
    h1: H.h1, h2: H.h2, h3: H.h3,
    h1Count: H.h1.length, h2Count: H.h2.length, h3Count: H.h3.length,
    h2Editorial: H.byLevel[2].editorial, h2Template: H.byLevel[2].template, h2Unique: H.byLevel[2].unique, h2Hidden: H.byLevel[2].hidden,
    h3Editorial: H.byLevel[3].editorial, h3Template: H.byLevel[3].template, h3Unique: H.byLevel[3].unique, h3Hidden: H.byLevel[3].hidden,
    h2CounterCaptions, h3CounterCaptions, counterCaptionHeadings,
    headingDuplicates: H.duplicates,
    headingDuplicateCount: H.duplicates.reduce((s, d) => s + d.count - 1, 0),
    headingRule: 'Every <h1>–<h6> in the served HTML is counted, including one inside a container the HTML itself hides (hidden attribute, inline display:none / visibility:hidden, carousel clone) — such a heading is labelled HIDDEN, never dropped, so the count matches the page source. A heading inside a post-feed, loop, carousel or <article> wrapper is TEMPLATE (generated by a widget; cannot be merged by an editor). An editorial H2/H3 whose text exactly matches a counter widget\'s own caption is labelled COUNTER CAPTION (a stat label, not a subheading idea — the fix is demoting its tag, not merging it into other content). Everything else is EDITORIAL. Duplicates: same level, identical after folding case and punctuation, or >90% character similarity.',
    hiddenContainers: hiddenContainers,
    hiddenContainerCount: hiddenContainers.length,
    carouselClones: carouselClones,
    carouselCloneCount: carouselClones.reduce((n, c) => n + c.count, 0),
    carouselCloneWords: carouselClones.reduce((n, c) => n + c.words, 0),
    cloneRule: 'A served slide is dropped as a carousel clone when its class matches a specific selector (' + CLONE_RULES.filter((r) => r[2] === 'specific').map((r) => r[0]).join(', ') + ') or, failing that, a generic fallback (' + CLONE_RULES.filter((r) => r[2] === 'fallback').map((r) => r[0]).join(', ') + '); every drop is attributed to the selector that caught it.',
    outline: H.outline,
    wordCount,
    wordRegion: reg.regionName,
    wordRule: WORD_RULE,
    pageWordCount,
    textSha256: sha256(bodyText),
    kwExactCount: exact,
    kwDensityPct: wordCount ? +((exact * kwWords / wordCount) * 100).toFixed(3) : 0,
    kwInTitle: kw ? fold(title).includes(kw) : false,
    kwInH1: kw ? H.h1.some((h) => fold(h).includes(kw)) : false,
    kwInH2: kw ? H.h2.some((h) => fold(h).includes(kw)) : false,
    kwInMeta: kw ? fold(metaDescription).includes(kw) : false,
    kwInUrl: kw ? (url.toLowerCase().includes(kw.replace(/ /g, '-')) || url.toLowerCase().includes(kw.replace(/ /g, ''))) : false,
    kwInFirst100: kw ? fold(words.slice(0, 100).join(' ')).includes(kw) : false,
    listCount: (region.match(/<(ul|ol)[\s>]/gi) || []).length,
    tableCount: (region.match(/<table[\s>]/gi) || []).length,
    imageCount: imgs.length,
    imagesMissingAlt: missingAlt,
    internalLinks: internal,
    externalLinks: external,
    schemaTypes: schema.schemaTypes,
    schemaTopLevel: schema.schemaTopLevel,
    schemaNested: schema.schemaNested,
    schemaTopLevelCount: schema.schemaTopLevelCount,
    schemaClaims: schema.schemaClaims,
    schemaClaimsAbsent: schema.schemaClaimsAbsent,
    hasFaqSchema: schema.schemaTypes.some((t) => /^(faqpage|qapage)$/i.test(t)),
    hasProductSchema: schema.schemaTypes.some((t) => /^(product|service|offer)$/i.test(t)),
    questionHeadings: qHeadings,
    questionHeadingCount: qHeadings.length,
    questionHeadingCountH3: questionHeadingsH3,
    stats: stats.slice(0, 25),
    statCount: stats.length,
    counters: counters.slice(0, 20),
    counterCount: counters.length,
    countersWithoutCaption: counters.filter((c) => !c.hasCaption).length,
    jsHiddenStats: hiddenStats.slice(0, 12),
    jsHiddenStatCount: hiddenStats.length,
    animationGated: gated.blocks.slice(0, 25),
    animationGatedCount: gated.blocks.length,
    animationGatedElements: gated.rawCount,
    blockRule: BLOCK_RULE,
    // Headings, list items and paragraphs are separate sentences for entity purposes, so a
    // heading never fuses with the first words of the paragraph under it.
    entities: entities(norm(marked).replace(/\u0001+/g, '\n')).slice(0, 900)
  };
  if (opts.full) {
    out.bodyText = bodyText;
    out.siteLinkText = siteLinkText(html, host);
    // Block-level text segments of the WHOLE served body (nav and footer included), for the
    // rendered-vs-served diff: a segment that never appears in the rendered innerText is
    // text a crawler gets and a visitor does not.
    const allMarked = (bodyM ? bodyM[1] : visible)
      .replace(/<br\s*\/?>/gi, BLOCK)
      .replace(/<\/?(p|li|h[1-6]|div|td|th|dd|dt|blockquote|figcaption|section|article|ul|ol|table|tr|nav|aside|main|header|footer|a|button|span|label)(?=[\s>\/])[^>]*>/gi, BLOCK);
    const segs = [];
    for (const raw of norm(allMarked).split(new RegExp(BLOCK + '+'))) {
      const t = raw.trim();
      if (t.length < 12 || !/[A-Za-z]{3,}/.test(t)) continue;
      if (segs.indexOf(t) === -1) segs.push(t.slice(0, 200));
      if (segs.length >= 700) break;
    }
    out.servedBlocks = segs;
  }
  return out;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const { url, keyword = '', full = '', raw = '' } = req.query || {};
  if (!url) return res.status(400).json({ error: 'Missing url.' });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    // The URL is fetched EXACTLY as given. No cache-busting query parameter is ever added -
    // some SEO plugins emit no structured data at all when they see an unknown parameter,
    // so a cache-busted fetch would report "no schema" on pages that have it. Freshness is
    // requested through headers instead.
    const r = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    const status = r.status;
    if (status >= 400) return res.status(200).json({ error: `HTTP ${status}`, status, url });
    const html = await r.text();
    if (!html || html.length < 200) {
      return res.status(200).json({
        error: 'Blocked by a bot-protection challenge (HTTP ' + status + ') - the site returned no '
             + 'content to the server. Try the exact page URL, or use the desktop scanner for this one.',
        status: status, blocked: true, url: url
      });
    }
    const out = parse(html, url, keyword, { full: full === '1', fetchedUrl: url, finalUrl: r.url || url });
    out.status = status;
    // raw=1: the served HTML itself, capped, so a page can be frozen as a regression fixture.
    if (raw === '1') out.rawHtml = html.slice(0, 1500000);
    return res.status(200).json(out);
  } catch (err) {
    const msg = err.name === 'AbortError' ? 'Timed out' : String(err.message || err);
    return res.status(200).json({ error: msg, url });
  } finally {
    clearTimeout(timer);
  }
};

module.exports.parse = parse;
module.exports.wordsOf = wordsOf;
module.exports.WORD_RULE = WORD_RULE;
module.exports.BLOCK_RULE = BLOCK_RULE;
module.exports.CLONE_RULES = CLONE_RULES;
