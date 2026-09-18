// Render one page in a real browser and report what a human can actually see.
//
// The served-HTML scan (api/page.js) cannot evaluate CSS. This one can: it loads the page in
// headless Chromium, waits for the network to settle, scrolls to the bottom so every
// intersection observer gets its chance to fire, waits again, and then asks the DOM three
// questions for every element that carries text: is it displayed, is it visible, does it
// occupy any space. The result feeds the RENDERED-VS-SERVED DIFF in the work order.
//
// A hidden call-to-action, price, statistic or form is a revenue defect that outranks any
// content task, and it is precisely the thing a served-HTML scan is blind to.

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
         + '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

// ---- Paint library --------------------------------------------------------------------------
// Installed INSIDE the page as window.__cgPaint at first paint and used by every later pass, so
// the scored word count, its composition (body / carousel / feed / other), the carousel
// accounting and the REACHABLE bucket all come from ONE tree walk at ONE moment (P10). Every
// figure it returns carries the same measuredAt. Self-contained: no closure over Node scope.
const PAINT_INSTALL = function () {
  var PAINT_SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEMPLATE: 1, SVG: 1, CANVAS: 1, IFRAME: 1, HEAD: 1 };
  var words = function (t) { return String(t || '').split(/\s+/).filter(function (x) { return /[A-Za-z0-9]/.test(x); }).length; };
  var norm = function (s) { return String(s || '').replace(/\s+/g, ' ').trim(); };
  var cache = new Map();
  var clipsOverflow = function (c) { return /^(hidden|clip|scroll|auto)$/.test(c.overflowX) || /^(hidden|clip|scroll|auto)$/.test(c.overflowY); };
  // The paint test for ONE element (its own style and box; ancestors are tested by the caller).
  var isRendered = function (el) {
    if (cache.has(el)) return cache.get(el);
    var ok = true, why = '';
    if (PAINT_SKIP[el.tagName]) { ok = false; why = 'skipped tag'; }
    else if (el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true' || el.inert) { ok = false; why = el.hasAttribute('hidden') ? 'hidden attribute' : el.inert ? 'inert' : 'aria-hidden'; }
    else {
      var c = getComputedStyle(el);
      if (c.display === 'none') { ok = false; why = 'display:none'; }
      else if (c.visibility === 'hidden' || c.visibility === 'collapse') { ok = false; why = 'visibility:' + c.visibility; }
      else if (parseFloat(c.opacity) === 0) { ok = false; why = 'opacity:0'; }
      else {
        var rects = el.getClientRects();
        if (!rects.length) { ok = false; why = 'no client rects'; }
        else {
          var r = el.getBoundingClientRect();
          var dw = document.documentElement.scrollWidth, dh = document.documentElement.scrollHeight;
          if (r.width > 0 && r.height > 0 && (r.right <= 0 || r.bottom + window.scrollY <= 0 || r.left >= dw || r.top + window.scrollY >= dh)) { ok = false; why = 'positioned off-page'; }
          if (ok && r.width > 0 && r.height > 0) {
            for (var a = el.parentElement, n = 0; a && a !== document.documentElement && n < 60; a = a.parentElement, n++) {
              var ac = getComputedStyle(a);
              if (!clipsOverflow(ac)) continue;
              var ar = a.getBoundingClientRect();
              if (ar.width === 0 && ar.height === 0) continue;
              var outX = /^(hidden|clip)$/.test(ac.overflowX) && (r.right <= ar.left + 0.5 || r.left >= ar.right - 0.5);
              var outY = /^(hidden|clip)$/.test(ac.overflowY) && (r.bottom <= ar.top + 0.5 || r.top >= ar.bottom - 0.5);
              if (outX || outY) { ok = false; why = 'outside clipping ancestor'; break; }
            }
          }
        }
      }
    }
    cache.set(el, ok);
    el.__cgWhy = why;
    return ok;
  };
  // A text node paints when every ancestor up to (and including) root passes the paint test.
  var nodePainted = function (node, root) {
    for (var e = node.parentElement; e && e !== document.documentElement.parentElement; e = e.parentElement) {
      if (!isRendered(e)) return false;
      if (e === root) break;
    }
    return true;
  };
  var visibleText = function (root) {
    if (!root) return '';
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), parts = [], n;
    while ((n = walker.nextNode())) { if (!n.nodeValue || !n.nodeValue.trim()) continue; if (!nodePainted(n, root)) continue; parts.push(n.nodeValue); }
    return parts.join(' ');
  };
  var visibleWords = function (root) { return words(visibleText(root)); };
  // Words in a subtree ignoring paint state but skipping script/style/noscript/template text
  // (noscript textContent is raw markup and would count "<img alt=...>" as words).
  var domWords = function (root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n = 0, t;
    while ((t = walker.nextNode())) {
      if (!t.nodeValue || !t.nodeValue.trim()) continue;
      var skip = false;
      for (var e = t.parentElement; e && e !== root.parentElement; e = e.parentElement) { if (PAINT_SKIP[e.tagName]) { skip = true; break; } }
      if (!skip) n += words(t.nodeValue);
    }
    return n;
  };
  // ---- Composition: which bucket a painted text node belongs to -----------------------------
  var CAR_CONTAINER = '.owl-carousel,.swiper,.swiper-container,.slick-slider,.slick-list,.splide,.glide,.elementor-swiper,.uc_carousel,[class*="carousel"]:not([class*="carousel-item"]):not([class*="carousel_placeholder"])';
  var CAR_ITEM = '.owl-item,.swiper-slide,.slick-slide,.splide__slide,.glide__slide,.ue-carousel-item,[class*="carousel-item"],[class*="carousel_item"]';
  var CLONE_ITEM = '.owl-item.cloned,.swiper-slide-duplicate,.slick-cloned,.splide__slide--clone,[class*="--clone"],[class*="__clone"],[class$="-cloned"]';
  var FEED_SEL = '.elementor-loop-container,.elementor-posts-container,.elementor-loop-item,.elementor-post,.wp-block-post-template,.wp-block-post,[class*="post-feed"],[class*="loop-grid"],[class*="posts-grid"]';
  var CHROME_SEL = 'nav,header,footer,aside,form';
  var PANEL_SEL = '[role=tabpanel],.elementor-tab-content,.tab-pane,.accordion-content';
  var matchesSafe = function (el, sel) { try { return !!(el.matches && el.matches(sel)); } catch (e) { return false; } };
  // The OUTERMOST carousel item an element sits in (a UE card lives inside an Owl item; the Owl
  // item is the unit the carousel moves, so it is the item).
  var itemOf = function (el) {
    var hit = null;
    for (var e = el, n = 0; e && e !== document.documentElement && n < 60; e = e.parentElement, n++) { if (matchesSafe(e, CAR_ITEM)) hit = e; }
    return hit;
  };
  var containerOf = function (item) {
    for (var e = item.parentElement, n = 0; e && e !== document.documentElement && n < 40; e = e.parentElement, n++) { if (matchesSafe(e, CAR_CONTAINER)) return e; }
    return item.parentElement;
  };
  var classify = function (node, root) {
    var el = node.parentElement;
    if (itemOf(el)) return 'carousel';
    for (var e = el, n = 0; e && e !== root && e !== document.documentElement && n < 60; e = e.parentElement, n++) {
      if (matchesSafe(e, FEED_SEL)) return 'feed';
      if (matchesSafe(e, CHROME_SEL)) return 'other';
    }
    return 'body';
  };
  // ONE walk: every painted text node under root, bucketed, with a single timestamp.
  var measure = function (root, stage) {
    var t = performance.now();
    var buckets = { body: 0, carousel: 0, feed: 0, other: 0 }, total = 0, nodes = 0;
    if (root) {
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n;
      while ((n = walker.nextNode())) {
        if (!n.nodeValue || !n.nodeValue.trim()) continue;
        if (!nodePainted(n, root)) continue;
        var w = words(n.nodeValue); if (!w) continue;
        buckets[classify(n, root)] += w; total += w; nodes++;
      }
    }
    var sum = buckets.body + buckets.carousel + buckets.feed + buckets.other;
    if (sum !== total) throw new Error('Composition does not sum to the scored total: ' + total + ' vs ' + sum + '. Diagnostics and count were taken from different page states.');
    return { total: total, buckets: buckets, nodes: nodes, stage: stage || '', measuredAt: Math.round(t) };
  };
  // Carousel accounting: every item in every carousel container lands in exactly one bucket —
  // clone / painted / reachable / excluded — and the buckets sum to the container's item count.
  // REACHABLE (P11): not painted, not a clone, not display:none/aria-hidden, and at least one
  // sibling item in the same container IS painted — one arrow click away, and in the DOM a
  // crawler parses. Nested items (a card inside an Owl slide) belong to the outer item.
  var carousels = function (root, stage) {
    var t = performance.now();
    var all = root.querySelectorAll(CAR_ITEM), byC = new Map();
    for (var i = 0; i < all.length; i++) {
      var it = all[i];
      if (itemOf(it) !== it) continue;
      var c = containerOf(it);
      if (!byC.has(c)) byC.set(c, []);
      byC.get(c).push(it);
    }
    var out = [], totals = { items: 0, clones: 0, painted: 0, reachable: 0, excluded: 0, paintedWords: 0, reachableWords: 0, cloneWords: 0 };
    byC.forEach(function (items, c) {
      var rec = { container: (c.id ? '#' + c.id : '') + (c.className && typeof c.className === 'string' ? '.' + c.className.split(/\s+/).filter(Boolean).slice(0, 3).join('.') : ''), label: '', items: items.length, clones: 0, painted: 0, reachable: 0, excluded: 0, paintedWords: 0, reachableWords: 0, cloneWords: 0, excludedWhy: {} };
      var st = [];
      items.forEach(function (it) {
        var clone = matchesSafe(it, CLONE_ITEM);
        var pw = visibleWords(it);
        var paintedEl = !clone && nodePainted({ parentElement: it }, root);
        if (clone) { rec.clones++; rec.cloneWords += domWords(it); st.push('clone'); return; }
        if (paintedEl) { rec.painted++; rec.paintedWords += pw; st.push('painted'); return; }
        st.push('?');
      });
      var anyPainted = rec.painted > 0;
      items.forEach(function (it, k) {
        if (st[k] !== '?') return;
        var cs = getComputedStyle(it), noPath = cs.display === 'none' || it.getAttribute('aria-hidden') === 'true' || it.hasAttribute('hidden');
        if (anyPainted && !noPath) { rec.reachable++; rec.reachableWords += domWords(it); st[k] = 'reachable'; }
        else { rec.excluded++; var why = noPath ? (cs.display === 'none' ? 'display:none' : 'aria-hidden') : (it.__cgWhy || 'not painted, no painted sibling'); rec.excludedWhy[why] = (rec.excludedWhy[why] || 0) + 1; st[k] = 'excluded'; }
      });
      var accounted = rec.clones + rec.painted + rec.reachable + rec.excluded;
      if (accounted !== rec.items) throw new Error('Carousel accounting: ' + accounted + ' of ' + rec.items + ' items classified in ' + rec.container);
      var h = c.closest('.elementor-widget,.wp-block,.et_pb_module,section'), head = h ? h.querySelector('h1,h2,h3,h4,h5,h6') : null;
      rec.label = /testimon|quote|review/i.test(rec.container + ' ' + (c.className || '')) ? 'testimonials' : /card|logo|partner|client|brand/i.test(rec.container + ' ' + ((h && h.className) || '')) ? 'cards / logos' : head ? norm(head.textContent).slice(0, 40) : 'carousel';
      Object.keys(totals).forEach(function (k) { totals[k] += rec[k] || 0; });
      out.push(rec);
    });
    return { containers: out, totals: totals, stage: stage || '', measuredAt: Math.round(t), rule: 'every item of every carousel container is exactly one of clone / painted / reachable / excluded; reachable = not painted, not a clone, not display:none or aria-hidden, with at least one painted sibling in the same container' };
  };
  // Tab / accordion panels: the same reachable logic, grouped by parent.
  var panels = function (root) {
    var ps = root.querySelectorAll(PANEL_SEL), byP = new Map();
    for (var i = 0; i < ps.length; i++) { var p = ps[i].parentElement; if (!byP.has(p)) byP.set(p, []); byP.get(p).push(ps[i]); }
    var out = { groups: 0, painted: 0, reachable: 0, excluded: 0, reachableWords: 0 };
    byP.forEach(function (list) {
      out.groups++;
      var painted = list.filter(function (p) { return visibleWords(p) > 0; });
      out.painted += painted.length;
      list.forEach(function (p) { if (painted.indexOf(p) !== -1) return; if (painted.length) { out.reachable++; out.reachableWords += domWords(p); } else out.excluded++; });
    });
    return out;
  };
  var mainOf = function () {
    var mains = document.querySelectorAll('main, article');
    for (var mi = 0; mi < mains.length; mi++) { if (norm(visibleText(mains[mi])).length > 500 || norm(mains[mi].innerText).length > 500) return mains[mi]; }
    return null;
  };
  // A complete snapshot at one moment: main + page painted counts with buckets, innerText and
  // textContent beside them, carousel accounting and the reachable bucket — one measuredAt.
  var snapshot = function (stage) {
    cache = new Map();
    var t0 = performance.now();
    var mainEl = mainOf(), region = mainEl ? '<' + mainEl.tagName.toLowerCase() + '>' : '<body> minus nav/header/footer/aside/form';
    var mainM, pageM, saved = [];
    if (mainEl) mainM = measure(mainEl, stage);
    else {
      var strip = document.querySelectorAll(CHROME_SEL);
      for (var si = 0; si < strip.length; si++) { saved.push([strip[si], strip[si].style.display]); strip[si].style.display = 'none'; }
      cache = new Map();
      mainM = measure(document.body, stage);
      for (var ri = 0; ri < saved.length; ri++) saved[ri][0].style.display = saved[ri][1];
      cache = new Map();
    }
    pageM = measure(document.body, stage);
    var car = carousels(mainEl || document.body, stage), carPage = mainEl ? carousels(document.body, stage) : car;
    var pan = panels(mainEl || document.body);
    var reachMain = car.totals.reachableWords + pan.reachableWords;
    var innerMain = mainEl ? mainEl.innerText : document.body.innerText;
    return {
      stage: stage || '', measuredAt: Math.round(t0), wallClock: new Date().toISOString(), scrollY: Math.round(window.scrollY),
      main: mainM.total, page: pageM.total, mainRegion: region, buckets: mainM.buckets, pageBuckets: pageM.buckets, nodes: mainM.nodes,
      innerTextMain: words(innerMain), innerTextPage: words(document.body.innerText), textContentMain: mainEl ? words(mainEl.textContent) : words(document.body.textContent), textContentPage: words(document.body.textContent),
      reachable: { main: reachMain, page: carPage.totals.reachableWords + pan.reachableWords, carouselItems: car.totals.reachable, panels: pan.reachable },
      scored: mainM.total + reachMain,
      carouselAccounting: car, carouselAccountingPage: carPage, panels: pan
    };
  };
  window.__cgPaint = { isRendered: isRendered, nodePainted: nodePainted, visibleText: visibleText, visibleWords: visibleWords, domWords: domWords, measure: measure, carousels: carousels, snapshot: snapshot, mainOf: mainOf, reset: function () { cache = new Map(); }, words: words };
  return true;
};

// ---- Third-party injection hook (P16) --------------------------------------------------------
// Installed BEFORE any page script runs. Every DOM insertion is attributed to the script that
// performed it (from the call stack); an insertion made by a script served from a host other
// than the page's own is tagged data-cg-inj="<host>". A chat widget, cookie banner, promo bar
// or A/B test lands in the DOM this way, and its text is VOLATILE — it can change between two
// scans of a byte-identical page — so the report tracks it apart from page findings.
const INJECT_HOOK = function () {
  try {
    var pageHost = location.hostname.replace(/^www\./, '');
    var hostOf = function (u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
    var callerHost = function () {
      var st = String(new Error().stack || ''), m, re = /(https?:\/\/[^\s):]+)/g, seen = 0;
      while ((m = re.exec(st))) { var h = hostOf(m[1]); if (!h) continue; if (h === pageHost || h.endsWith('.' + pageHost)) return ''; if (++seen > 8) break; return h; }
      return '';
    };
    var tag = function (node, host) { try { if (node && node.nodeType === 1 && host && !node.hasAttribute('data-cg-inj')) node.setAttribute('data-cg-inj', host); if (node && node.nodeType === 11) { for (var c = node.firstChild; c; c = c.nextSibling) tag(c, host); } } catch (e) { /* ignore */ } };
    var wrap = function (proto, name, pick) {
      var orig = proto[name]; if (typeof orig !== 'function') return;
      proto[name] = function () { var host = callerHost(); var r = orig.apply(this, arguments); if (host) pick(this, arguments, host); return r; };
    };
    wrap(Node.prototype, 'appendChild', function (self, a, h) { tag(a[0], h); });
    wrap(Node.prototype, 'insertBefore', function (self, a, h) { tag(a[0], h); });
    wrap(Node.prototype, 'replaceChild', function (self, a, h) { tag(a[0], h); });
    wrap(Element.prototype, 'append', function (self, a, h) { for (var i = 0; i < a.length; i++) tag(a[i], h); });
    wrap(Element.prototype, 'prepend', function (self, a, h) { for (var i = 0; i < a.length; i++) tag(a[i], h); });
    wrap(Element.prototype, 'insertAdjacentElement', function (self, a, h) { tag(a[1], h); });
    wrap(Element.prototype, 'insertAdjacentHTML', function (self, a, h) { tag(self, h); });
    var d = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if (d && d.set) Object.defineProperty(Element.prototype, 'innerHTML', { configurable: true, enumerable: d.enumerable, get: d.get, set: function (v) { var host = callerHost(); d.set.call(this, v); if (host) tag(this, host); } });
    window.__cgInjectHook = true;
  } catch (e) { /* a page that freezes prototypes just loses this attribution */ }
};

// Runs INSIDE the page. Self-contained on purpose: no closure over Node scope, and written
// so it can be exercised locally under Playwright's Chromium in the test suite.
const INPAGE = function () {
  var STAT_RE = /(?:\$\s?\d[\d,]*(?:\.\d+)?\s?(?:[KMB]\b|million|billion|k\b)?)|(?:\d[\d,]*(?:\.\d+)?\s?%)|(?:\b\d+(?:\.\d+)?\s?[xX]\b)|(?:\b\d[\d,]*\+)/;
  var PRICE_RE = /(?:[$€£]\s?\d)|(?:\d\s?(?:USD|EUR|GBP)\b)|(?:\/\s?(?:mo|month|yr|year|vehicle|unit)\b)/i;
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEMPLATE: 1, SVG: 1, PATH: 1, HEAD: 1, META: 1, LINK: 1, TITLE: 1 };
  var CTA_WORDS = /\b(demo|quote|contact|call|buy|start|trial|sign ?up|get started|book|schedule|request|pricing|subscribe|download|learn more|talk to|speak to)\b/i;
  var norm = function (s) { return String(s || '').replace(/\s+/g, ' ').trim(); };
  var words = function (t) { return String(t || '').split(/\s+/).filter(function (x) { return /[A-Za-z0-9]/.test(x); }).length; };

  var ownText = function (el) {
    var out = [];
    for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3) out.push(n.nodeValue);
    return norm(out.join(' '));
  };
  var inside = function (el, sel, depth) {
    var e = el;
    for (var i = 0; e && i <= depth; i++, e = e.parentElement) { if (e.matches && e.matches(sel)) return true; }
    return false;
  };
  var effOpacity = function (el) {
    var o = 1, e = el;
    for (var i = 0; e && e !== document.documentElement && i < 40; i++, e = e.parentElement) {
      var v = parseFloat(getComputedStyle(e).opacity); if (!isNaN(v)) o *= v;
      if (o <= 0.02) return 0;
    }
    return o;
  };
  var reasonFor = function (el, cs, rect) {
    var e = el;
    for (var i = 0; e && e !== document.documentElement && i < 40; i++, e = e.parentElement) {
      var c = e === el ? cs : getComputedStyle(e);
      if (c.display === 'none') return e === el ? 'display:none' : 'ancestor display:none';
      if (c.visibility === 'hidden' || c.visibility === 'collapse') return e === el ? 'visibility:hidden' : 'ancestor visibility:hidden';
      if (c.contentVisibility === 'hidden') return 'content-visibility:hidden';
    }
    if (effOpacity(el) <= 0.02) return 'opacity:0';
    if (rect.width < 1 || rect.height < 1) {
      if (/rect\(0/.test(cs.clip) || /inset\(50%\)|inset\(100%\)/.test(cs.clipPath)) return 'clipped (screen-reader-only pattern)';
      return 'zero-size box';
    }
    var top = rect.top + window.scrollY, left = rect.left + window.scrollX;
    if (rect.bottom + window.scrollY < 0 || rect.right + window.scrollX < 0) return 'positioned off-screen';
    if (left > document.documentElement.scrollWidth + 10 || top > document.documentElement.scrollHeight + 10) return 'positioned off-screen';
    if (/rect\(0/.test(cs.clip) || /inset\(50%\)|inset\(100%\)/.test(cs.clipPath)) return 'clipped (screen-reader-only pattern)';
    return '';
  };

  // Why a hidden element is hidden matters more than that it is hidden. A dropdown menu item,
  // an off-screen carousel slide, a closed modal and a screen-reader label are all hidden on
  // purpose; only 'content' (and anything inside an entrance-animation wrapper) is a finding.
  var NAV_SEL = 'nav,header,footer,[role=navigation],[role=menu],[role=menubar],.menu,.sub-menu,.elementor-nav-menu,.mega-menu,[class*="menu"],[class*="nav-"],[class*="-nav"],[id*="menu"]';
  var SLIDER_SEL = '.swiper,.swiper-slide,.slick-slide,.slick-slider,.owl-carousel,.splide,.glide,.carousel,[class*="carousel"],[class*="slider"],[class*="slide-"],.elementor-swiper,[class*="ue-carousel"]';
  var DIALOG_SEL = '[role=dialog],[aria-modal],.modal,.popup,.lightbox,[class*="popup"],[class*="modal"],[class*="lightbox"],.elementor-popup-modal,[class*="cookie"],[class*="offcanvas"],[class*="off-canvas"]';
  var TAB_SEL = '[role=tabpanel],.tab-content,.tab-pane,.elementor-tab-content,.accordion-content,.elementor-accordion-item,[class*="accordion"],[class*="tab-"],details:not([open])';
  var SR_RE = /screen-reader|sr-only|screen-only|visually-hidden|skip-link|skip-to/i;
  var contextOf = function (el, reason) {
    if (SR_RE.test(String(el.className || '')) || SR_RE.test(String(el.parentElement && el.parentElement.className || '')) || /screen-reader-only/.test(reason)) return 'screen-reader';
    if (inside(el, DIALOG_SEL, 15)) return 'dialog';
    if (inside(el, NAV_SEL, 15)) return 'navigation';
    if (inside(el, SLIDER_SEL, 12) && /off-screen|opacity|visibility/.test(reason)) return 'carousel';
    if (inside(el, TAB_SEL, 10)) return 'tab';
    return 'content';
  };
  var CONTEXT_CAP = { 'screen-reader': 10, dialog: 15, navigation: 20, carousel: 20, tab: 15, content: 150 };
  var hidden = [], hiddenCount = 0, visibleCount = 0, kindCounts = {}, contextCounts = {}, contextStored = {};
  var all = document.body ? document.body.getElementsByTagName('*') : [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    if (SKIP[el.tagName]) continue;
    var t = ownText(el);
    if (t.length < 2) continue;
    var cs = getComputedStyle(el);
    var rect = el.getBoundingClientRect();
    var reason = reasonFor(el, cs, rect);
    if (!reason && el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) reason = 'not rendered';
    if (!reason) { visibleCount++; continue; }
    var kind = 'text';
    var isCta = inside(el, 'a,button,[role=button],input[type=submit]', 3) || (words(t) <= 6 && CTA_WORDS.test(t));
    if (inside(el, 'h1,h2,h3,h4,h5,h6', 2)) kind = 'heading';
    if (inside(el, 'form,label,input,select,textarea', 3)) kind = 'form';
    if (STAT_RE.test(t)) kind = 'statistic';
    if (PRICE_RE.test(t)) kind = 'price';
    if (isCta) kind = 'call to action';
    if (/screen-reader-only/.test(reason)) kind = 'screen-reader-only';
    // A bare number with no letters is the counter digit whose caption is reported on its
    // own line; listing both would double-count one hidden widget.
    if (!/[A-Za-z]/.test(t) && kind !== 'price' && kind !== 'statistic') continue;
    // Inside an entrance-animation wrapper: the stuck-reveal pattern, not a modal or tab.
    var gated = inside(el, '.elementor-invisible,.wpb_animate_when_almost_visible,.wow,.animate__animated,[data-aos]', 12);
    var late = inside(el, '[data-cg-late]', 12);
    var context = gated ? 'content' : contextOf(el, reason);
    if (context === 'screen-reader') kind = 'screen-reader-only';
    hiddenCount++;
    kindCounts[kind] = (kindCounts[kind] || 0) + 1;
    contextCounts[context] = (contextCounts[context] || 0) + 1;
    contextStored[context] = (contextStored[context] || 0) + 1;
    if (contextStored[context] <= CONTEXT_CAP[context] && hidden.length < 250) {
      hidden.push({
        text: t.slice(0, 160), tag: el.tagName.toLowerCase(), reason: reason, kind: kind, context: context, gated: gated, late: late,
        cls: String(el.className || '').split(/\s+/).filter(Boolean).slice(0, 3).join(' ')
      });
    }
  }

  var markers = ['.elementor-invisible', '.wpb_animate_when_almost_visible', '.wow', '.animate__animated', '[data-aos]'];
  var gating = { inDom: 0, stillHidden: 0, bySelector: {} };
  markers.forEach(function (sel) {
    var els = document.querySelectorAll(sel);
    if (!els.length) return;
    var hid = 0;
    for (var j = 0; j < els.length; j++) {
      var c = getComputedStyle(els[j]);
      if (c.visibility === 'hidden' || c.display === 'none' || parseFloat(c.opacity) <= 0.02) hid++;
    }
    gating.bySelector[sel] = { inDom: els.length, stillHidden: hid };
    gating.inDom += els.length; gating.stillHidden += hid;
  });

  var counters = [];
  var cEls = document.querySelectorAll('[data-to-value],[data-to],[data-target],[data-count],[data-counter],[data-number],[data-end-value]');
  for (var k = 0; k < cEls.length && counters.length < 30; k++) {
    var ce = cEls[k];
    var tv = ce.getAttribute('data-to-value') || ce.getAttribute('data-to') || ce.getAttribute('data-target')
          || ce.getAttribute('data-count') || ce.getAttribute('data-counter') || ce.getAttribute('data-number') || ce.getAttribute('data-end-value');
    if (!/^\s*[\d][\d.,]*\s*$/.test(tv || '')) continue;
    var ccs = getComputedStyle(ce);
    // Label by the caption or heading beside the number, never by the number itself.
    var label = '';
    var okLabel = function (s) { s = norm(s); return s.length >= 4 && /[A-Za-z]{3,}/.test(s) && words(s) <= 14 && s !== norm(ce.textContent) ? s.slice(0, 120) : ''; };
    var box = (ce.parentElement && ce.parentElement.closest('.elementor-counter,.elementor-widget-counter,[class*="counter"],[class*="stat"],[class*="number"]')) || ce.parentElement;
    var CAP_SELS = ['.elementor-counter-title,[class*="counter-title"],[class*="stat-title"],[class*="counter__label"],[class*="stat-label"],[class*="counter-label"]', 'h1,h2,h3,h4,h5,h6', 'p'];
    for (var up = 0; up < 4 && box && !label; up++, box = box.parentElement) {
      for (var ci = 0; ci < CAP_SELS.length && !label; ci++) {
        var cap = box.querySelector(CAP_SELS[ci]);
        if (cap && cap !== ce && !cap.contains(ce)) label = okLabel(cap.textContent);
      }
    }
    // Page builders often put the caption in a separate heading widget beside the counter.
    if (!label) {
      var widget = ce.closest('.elementor-widget,.wp-block,.et_pb_module,.vc_column-inner,.w-dyn-item') || ce.parentElement;
      var sib = widget, dir = ['nextElementSibling', 'previousElementSibling'];
      for (var d = 0; d < 2 && !label; d++) {
        sib = widget;
        for (var hop = 0; hop < 2 && !label && sib; hop++) { sib = sib[dir[d]]; if (sib && !sib.querySelector('[data-to-value],[data-to],[data-count]')) label = okLabel(sib.textContent); }
      }
    }
    counters.push({ toValue: tv.trim(), renderedText: norm(ce.textContent).slice(0, 40), label: label,
      visible: ccs.visibility === 'visible' && ccs.display !== 'none' && effOpacity(ce) > 0.02 });
  }

  var innerText = document.body ? document.body.innerText : '';
  var domText = norm(document.body ? document.body.textContent : '');
  // ---- Painted text -------------------------------------------------------------------
  // innerText is not a visibility assertion: it keeps a carousel item parked outside its
  // overflow:hidden stage, an aria-hidden node and a widget that never mounted. The rendered
  // word count comes from the paint library (window.__cgPaint, installed at first paint):
  // ONE tree walk over text nodes, each rejected when any ancestor fails the paint test, each
  // survivor bucketed as body / carousel / feed / other, with a single measuredAt. The same
  // pass produces the carousel accounting and the REACHABLE bucket, so every figure printed
  // beside the count describes the same page state (P10).
  if (!window.__cgPaint) throw new Error('paint library not installed');
  var P = window.__cgPaint;
  P.reset();
  var snap = P.snapshot('settled');
  var isRendered = P.isRendered, nodePainted = P.nodePainted, visibleWords = P.visibleWords;
  var mainEl = P.mainOf();
  var mainPainted = snap.main, mainRegion = snap.mainRegion, mainWords = snap.innerTextMain, pagePainted = snap.page;
  // Per-selector carousel diagnostics, from the SAME settled state (the paint cache is shared
  // with the snapshot above). Reported, not subtracted — the paint test already decides.
  var CAROUSEL_SELS = [['.owl-item.cloned', 'Owl clone'], ['.owl-item:not(.cloned)', 'Owl item'], ['.swiper-slide-duplicate', 'Swiper clone'], ['.swiper-slide:not(.swiper-slide-duplicate)', 'Swiper slide'],
    ['.slick-cloned', 'Slick clone'], ['.slick-slide:not(.slick-cloned)', 'Slick slide'], ['.ue-carousel-item', 'Unlimited Elements card (inside an Owl item)'], ['.splide__slide--clone', 'Splide clone']];
  var carousels = [];
  CAROUSEL_SELS.forEach(function (cs) {
    var els; try { els = document.querySelectorAll(cs[0]); } catch (e) { return; }
    if (!els.length) return;
    var tc = 0, it = 0, pw = 0, painted = 0, paintedEl = 0;
    for (var ci2 = 0; ci2 < els.length; ci2++) { tc += P.domWords(els[ci2]); it += words(els[ci2].innerText || ''); var vw = visibleWords(els[ci2]); pw += vw; if (vw > 0) painted++; if (nodePainted({ parentElement: els[ci2] }, null)) paintedEl++; }
    carousels.push({ selector: cs[0], label: cs[1], count: els.length, painted: painted, paintedElements: paintedEl, textContentWords: tc, innerTextWords: it, paintedWords: pw, measuredAt: snap.measuredAt });
  });
  // Every heading, with whether it is painted and where it sits — so a heading the served HTML
  // had inside a hidden container can be found again by text and judged as it renders.
  var headingList = [];
  var hEls = document.querySelectorAll('h1,h2,h3,h4,h5,h6');
  for (var hj = 0; hj < hEls.length && headingList.length < 200; hj++) {
    var he = hEls[hj], ht = norm(he.textContent); if (!ht) continue;
    var painted = nodePainted({ parentElement: he }, null) && isRendered(he) && visibleWords(he) > 0;
    headingList.push({ level: +he.tagName.slice(1), text: ht.slice(0, 160), painted: painted, why: painted ? '' : (he.__cgWhy || 'ancestor not painted'), late: inside(he, '[data-cg-late]', 12), top: Math.round(he.getBoundingClientRect().top + window.scrollY) });
  }
  // Containers the served HTML declared hidden (inline display:none / hidden attribute): what
  // they hold NOW. A widget that empties its template wrapper at mount leaves 0 headings here.
  var hiddenNow = [];
  var declared = document.querySelectorAll('[hidden], [style*="display:none"], [style*="display: none"]');
  for (var dj = 0; dj < declared.length && hiddenNow.length < 60; dj++) {
    var de = declared[dj]; if (SKIP[de.tagName]) continue;
    var hh = de.querySelectorAll('h1,h2,h3,h4,h5,h6').length, hw = words(de.textContent);
    if (!hh && !hw) { hiddenNow.push({ tag: de.tagName.toLowerCase(), cls: String(de.className || '').split(/\s+/).filter(Boolean).slice(0, 4).join(' '), headings: 0, words: 0, display: getComputedStyle(de).display }); continue; }
    hiddenNow.push({ tag: de.tagName.toLowerCase(), cls: String(de.className || '').split(/\s+/).filter(Boolean).slice(0, 4).join(' '), headings: hh, words: hw, display: getComputedStyle(de).display });
  }
  // Third-party / widget injections (P16): the outermost elements the injection hook tagged with a
  // foreign script host, plus body-level containers whose id/class names a known widget family.
  // Their painted lines are reported so the diff can label them VOLATILE instead of page facts.
  var WIDGET_RE = /crisp|intercom|drift|tawk|hubspot|hs-chat|hs-messages|livechat|zendesk|zopim|tidio|freshchat|olark|gorgias|chat-widget|chatbot|cookie|consent|gdpr|onetrust|cky-|cmp-|promo-bar|announcement|optimizely|vwo|hotjar|usercentrics|quantcast|didomi|termly|iubenda|klaviyo|privy|sumo|convertflow|wisepops|optinmonster/i;
  var injected = [];
  var injRoots = document.querySelectorAll('[data-cg-inj]');
  var seenRoot = new Set();
  var pushRoot = function (el, host, how) {
    if (seenRoot.has(el) || injected.length >= 40) return; seenRoot.add(el);
    var lines = String(el.innerText || '').split(/\n+/).map(norm).filter(function (l) { return l.length >= 3; }).slice(0, 40).map(function (l) { return l.slice(0, 160); });
    var top = el; while (top.parentElement && top.parentElement !== document.body && top.parentElement !== document.documentElement) top = top.parentElement;
    injected.push({ host: host, how: how, tag: el.tagName.toLowerCase(), id: el.id || '', cls: String(el.className || '').split(/\s+/).filter(Boolean).slice(0, 4).join(' '),
      topId: top.id || '', topCls: String(top.className || '').split(/\s+/).filter(Boolean).slice(0, 4).join(' '), inMain: !!(el.closest && el.closest('main, article')), painted: P.visibleWords(el), lines: lines });
  };
  for (var ij = 0; ij < injRoots.length; ij++) {
    var ie = injRoots[ij]; if (ie.parentElement && ie.parentElement.closest('[data-cg-inj]')) continue;
    pushRoot(ie, ie.getAttribute('data-cg-inj'), 'inserted by a script served from ' + ie.getAttribute('data-cg-inj'));
  }
  var bodyKids = document.body ? document.body.children : [];
  for (var bk = 0; bk < bodyKids.length; bk++) {
    var be = bodyKids[bk]; if (SKIP[be.tagName]) continue;
    var key = (be.id || '') + ' ' + String(be.className || '');
    if (WIDGET_RE.test(key) && !seenRoot.has(be) && norm(be.innerText || '').length) pushRoot(be, '', 'body-level container named like a widget (' + key.trim().slice(0, 60) + ')');
  }
  var visHeads = function (sel) { var n = 0, hs = document.querySelectorAll(sel); for (var hi = 0; hi < hs.length; hi++) { var hc = getComputedStyle(hs[hi]); if (hc.display !== 'none' && hc.visibility !== 'hidden' && norm(hs[hi].innerText)) n++; } return n; };
  var h = function (sel) { return Array.prototype.map.call(document.querySelectorAll(sel), function (e) { return norm(e.textContent); }).filter(Boolean); };
  return {
    title: document.title,
    h1: h('h1').slice(0, 5),
    h2Count: h('h2').length, h3Count: h('h3').length,
    innerText: innerText.slice(0, 90000),
    innerTextTruncated: innerText.length > 90000,
    domText: domText.slice(0, 90000),
    innerTextWordCount: words(innerText),
    // Painted word counts (text nodes whose whole ancestor chain passes the paint test), the
    // innerText figures for comparison, and the carousel diagnostics behind any gap.
    renderedWords: { page: pagePainted, main: mainPainted, mainRegion: mainRegion,
      innerTextMain: mainWords, innerTextPage: snap.innerTextPage, textContentMain: snap.textContentMain, textContentPage: snap.textContentPage,
      buckets: snap.buckets, pageBuckets: snap.pageBuckets, reachable: snap.reachable, scored: snap.scored,
      measuredAt: { stage: 'settled', msSinceNavigation: snap.measuredAt, wallClock: snap.wallClock, scrollY: snap.scrollY },
      carousels: carousels, carouselAccounting: snap.carouselAccounting, carouselAccountingPage: snap.carouselAccountingPage, panels: snap.panels,
      rule: 'painted text of the attached, rendered DOM after scroll + settle: one tree walk, every text node whose ancestors are all displayed, visible, opaque, not hidden/aria-hidden/inert, laid out (client rects) and not parked outside an overflow-clipping ancestor; each surviving node is bucketed body / carousel / feed / other and the buckets must sum to the total; main = ' + mainRegion + '; tokens with a letter or digit count as words. REACHABLE = words inside a carousel slide or tab panel that is not painted at settle, not a clone, not display:none/aria-hidden, and whose sibling is painted (one click away, parsed by a crawler). innerText and textContent are printed beside these for comparison, never scored.' },
    renderedHeadings: { h1: visHeads('h1'), h2: visHeads('h2'), h3: visHeads('h3'), h1Total: document.querySelectorAll('h1').length, h2Total: document.querySelectorAll('h2').length, h3Total: document.querySelectorAll('h3').length },
    headingList: headingList,
    hiddenNow: hiddenNow,
    injected: injected, injectHook: !!window.__cgInjectHook,
    hidden: hidden, hiddenCount: hiddenCount, visibleTextElements: visibleCount, hiddenByKind: kindCounts,
    hiddenByContext: contextCounts,
    hiddenContentCount: contextCounts.content || 0,
    gating: gating,
    counters: counters,
    // Why an entrance animation might not have fired: scripts held back until "user
    // interaction" by an optimizer, or the page-builder runtime never initialising.
    scripts: {
      delayedByOptimizer: document.querySelectorAll('script[type="rocketlazyloadscript"],script[data-rocket-type],script[data-perfmatters-type],script[type="text/flying-scripts"],script[data-type="lazy"]').length,
      totalScripts: document.scripts.length,
      elementorFrontend: typeof window.elementorFrontend !== 'undefined',
      jQuery: typeof window.jQuery !== 'undefined'
    },
    scrollHeight: document.documentElement.scrollHeight
  };
};

// The gate self-check, in two halves that run INSIDE the page.
//
// GATE_TAG runs at first paint: every element carrying an entrance-animation marker is given
// an id (data-cg-gate) so the SAME elements can be re-examined later, by identity, wherever
// the scroll position ends up. GATE_CHECK runs after the scroll passes: it reads the computed
// style of every originally-tagged element — not whatever happens to carry the marker class
// now, and not only what is in the viewport — and returns the exact residual. An element
// whose observer fired late, or never fired because it left the viewport first, is counted;
// it is never rounded away into "0 hidden".
const GATE_TAG = function () {
  var markers = ['.elementor-invisible', '.wpb_animate_when_almost_visible', '.wow', '.animate__animated', '[data-aos]'];
  var out = { markers: 0, hidden: 0, bySelector: {} };
  var seen = new Set(), n = 0;
  var norm = function (s) { return String(s || '').replace(/\s+/g, ' ').trim(); };
  markers.forEach(function (sel) {
    var els = document.querySelectorAll(sel);
    if (!els.length) return;
    var hid = 0, cnt = 0;
    for (var j = 0; j < els.length; j++) {
      var el = els[j];
      if (seen.has(el)) continue;
      seen.add(el); cnt++;
      el.setAttribute('data-cg-gate', String(n++));
      var c = getComputedStyle(el);
      if (c.visibility === 'hidden' || c.display === 'none' || parseFloat(c.opacity) <= 0.02) hid++;
    }
    out.bySelector[sel] = { markers: cnt, hidden: hid };
    out.markers += cnt; out.hidden += hid;
  });
  return out;
};
const GATE_CHECK = function () {
  var MARK = /\b(elementor-invisible|wpb_animate_when_almost_visible|wow|animate__animated)\b/;
  var norm = function (s) { return String(s || '').replace(/\s+/g, ' ').trim(); };
  var els = document.querySelectorAll('[data-cg-gate]');
  var residual = [], hidden = 0, stillMarked = 0;
  for (var j = 0; j < els.length; j++) {
    var el = els[j];
    var c = getComputedStyle(el);
    var reason = c.display === 'none' ? 'display:none' : (c.visibility === 'hidden' || c.visibility === 'collapse') ? 'visibility:hidden' : parseFloat(c.opacity) <= 0.02 ? 'opacity:0' : '';
    var marked = MARK.test(String(el.className || '')) || el.hasAttribute('data-aos');
    if (marked) stillMarked++;
    if (!reason) continue;
    hidden++;
    if (residual.length < 40) {
      var parts = [], walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while (walker.nextNode() && parts.length < 60) { var v = norm(walker.currentNode.nodeValue); if (v) parts.push(v); }
      var t = parts.join(' ').slice(0, 120);
      var a = el.querySelector('a,button');
      residual.push({ id: el.getAttribute('data-cg-gate'), text: t, tag: el.tagName.toLowerCase(), reason: reason, stillMarked: marked,
        cls: String(el.className || '').split(/\s+/).filter(Boolean).slice(0, 4).join(' '),
        cta: !!a, ctaText: a ? norm(a.textContent).slice(0, 60) : '',
        top: Math.round(el.getBoundingClientRect().top + window.scrollY) });
    }
  }
  return { tracked: els.length, hidden: hidden, stillMarked: stillMarked, residual: residual };
};

// Runs INSIDE the page: for each selector, how many elements match, how many are painted,
// and the textContent / innerText / painted word counts. Lets an operator check a widget's
// state on the settled page without a redeploy.
const PROBE = function (sels) {
  var words = function (t) { return String(t || '').split(/\s+/).filter(function (x) { return /[A-Za-z0-9]/.test(x); }).length; };
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEMPLATE: 1, SVG: 1, CANVAS: 1, IFRAME: 1, HEAD: 1 };
  var clip = function (v) { return /^(hidden|clip)$/.test(v); };
  var isRendered = function (el) {
    if (SKIP[el.tagName]) return false;
    if (el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true' || el.inert) return false;
    var c = getComputedStyle(el);
    if (c.display === 'none' || c.visibility === 'hidden' || c.visibility === 'collapse' || parseFloat(c.opacity) === 0) return false;
    if (!el.getClientRects().length) return false;
    var r = el.getBoundingClientRect();
    var dw = document.documentElement.scrollWidth, dh = document.documentElement.scrollHeight;
    if (r.width > 0 && r.height > 0 && (r.right <= 0 || r.bottom + window.scrollY <= 0 || r.left >= dw || r.top + window.scrollY >= dh)) return false;
    if (r.width > 0 && r.height > 0) {
      for (var a = el.parentElement, n = 0; a && a !== document.documentElement && n < 60; a = a.parentElement, n++) {
        var ac = getComputedStyle(a); if (!clip(ac.overflowX) && !clip(ac.overflowY)) continue;
        var ar = a.getBoundingClientRect(); if (!ar.width && !ar.height) continue;
        if ((clip(ac.overflowX) && (r.right <= ar.left + 0.5 || r.left >= ar.right - 0.5)) || (clip(ac.overflowY) && (r.bottom <= ar.top + 0.5 || r.top >= ar.bottom - 0.5))) return false;
      }
    }
    return true;
  };
  var vis = function (root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), parts = [], n;
    while ((n = w.nextNode())) {
      if (!n.nodeValue || !n.nodeValue.trim()) continue;
      var ok = true;
      for (var e = n.parentElement; e && e !== root.parentElement; e = e.parentElement) { if (!isRendered(e)) { ok = false; break; } }
      if (ok) parts.push(n.nodeValue);
    }
    return words(parts.join(' '));
  };
  var out = {};
  sels.forEach(function (sel) {
    try {
      var els = document.querySelectorAll(sel), tc = 0, it = 0, pw = 0, painted = 0, heads = 0, tops = [];
      for (var i = 0; i < els.length; i++) {
        tc += words(els[i].textContent); it += words(els[i].innerText || ''); var v = vis(els[i]); pw += v; if (v > 0) painted++;
        heads += els[i].querySelectorAll('h1,h2,h3,h4,h5,h6').length;
        if (tops.length < 8) tops.push(Math.round(els[i].getBoundingClientRect().top + window.scrollY));
      }
      out[sel] = { count: els.length, painted: painted, textContentWords: tc, innerTextWords: it, paintedWords: pw, headingsInside: heads, tops: tops };
    } catch (e) { out[sel] = { error: String(e && e.message || e) }; }
  });
  return out;
};

// Markers that were NOT in the DOM at first paint — a widget that mounts its template after
// load (Unlimited Elements moves a display:none wrapper's children into the page) inserts
// them later, so the identity check above never saw them. They get their own tag, a scroll
// to their position, and a separate verdict: still hidden here is reported as LATE /
// UNVERIFIED, never as hidden content a visitor cannot see.
const LATE_TAG = function () {
  var sel = '.elementor-invisible, .wpb_animate_when_almost_visible, .wow, .animate__animated, [data-aos]';
  var els = document.querySelectorAll(sel), n = 0, hidden = 0, tops = [];
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    if (el.hasAttribute('data-cg-gate') || el.hasAttribute('data-cg-late')) continue;
    el.setAttribute('data-cg-late', String(n++));
    var c = getComputedStyle(el);
    if (c.visibility === 'hidden' || c.display === 'none' || parseFloat(c.opacity) <= 0.02) { hidden++; if (tops.length < 12) tops.push(Math.round(el.getBoundingClientRect().top + window.scrollY)); }
  }
  return { count: n, hidden: hidden, tops: tops };
};
const LATE_CHECK = function () {
  var norm = function (s) { return String(s || '').replace(/\s+/g, ' ').trim(); };
  var els = document.querySelectorAll('[data-cg-late]'), residual = [], hidden = 0;
  for (var j = 0; j < els.length; j++) {
    var el = els[j], c = getComputedStyle(el);
    var reason = c.display === 'none' ? 'display:none' : (c.visibility === 'hidden' || c.visibility === 'collapse') ? 'visibility:hidden' : parseFloat(c.opacity) <= 0.02 ? 'opacity:0' : '';
    if (!reason) continue;
    hidden++;
    if (residual.length < 20) {
      var parts = [], walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while (walker.nextNode() && parts.length < 40) { var v = norm(walker.currentNode.nodeValue); if (v) parts.push(v); }
      residual.push({ id: el.getAttribute('data-cg-late'), text: parts.join(' ').slice(0, 120), tag: el.tagName.toLowerCase(), reason: reason,
        cls: String(el.className || '').split(/\s+/).filter(Boolean).slice(0, 4).join(' '), top: Math.round(el.getBoundingClientRect().top + window.scrollY) });
    }
  }
  return { count: els.length, hidden: hidden, residual: residual };
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function renderWith(browser, url, waitMs, log, opts) {
  const page = await browser.newPage();
  const pageErrors = [];
  let consoleErrors = 0;
  page.on('pageerror', (e) => { if (pageErrors.length < 10) pageErrors.push(String(e && e.message || e).slice(0, 200)); });
  page.on('console', (m) => { if (m.type && m.type() === 'error') consoleErrors++; });
  await page.setUserAgent(UA);
  // A real desktop viewport, and explicitly NOT reduced motion: entrance animations must be
  // allowed to run, otherwise the render proves nothing about what a visitor sees.
  await page.setViewport({ width: 1366, height: 900, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]).catch(() => {});
  // Before any page script: attribute DOM insertions to the script host that made them (P16).
  await page.evaluateOnNewDocument(INJECT_HOOK).catch((e) => log('inject hook: ' + String(e.message || e).slice(0, 80)));
  const t0 = Date.now();
  let waitUsed = 'networkidle2';
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 22000 });
  } catch (e) {
    // A page that never goes idle (long-polling, ads) is still renderable.
    waitUsed = 'load (network never idled)';
    log('goto fallback: ' + String(e.message || e).slice(0, 120));
    try { await page.goto(url, { waitUntil: 'load', timeout: 15000 }); }
    catch (e2) { if (!(await page.evaluate(() => document.body && document.body.children.length > 0).catch(() => false))) throw e2; }
  }
  // First paint: tag every animation marker so the same elements are re-checked by identity.
  const gateAtLoad = await page.evaluate(GATE_TAG).catch(() => ({ markers: 0, hidden: 0, bySelector: {} }));
  // The paint library goes in now, and the first snapshot is taken BEFORE any input: what the
  // page paints at load, with the same buckets and the same clock as the settled measurement.
  // A hand measurement taken at the top of a fresh page compares against this one, not the
  // settled one (entrance animations below the fold have not fired yet).
  await page.evaluate(PAINT_INSTALL).catch((e) => log('paint install (first paint): ' + String(e.message || e).slice(0, 80)));
  const firstPaint = await page.evaluate(() => window.__cgPaint.snapshot('first-paint')).catch((e) => ({ error: String(e && e.message || e).slice(0, 160) }));
  // Behave like a person: move the mouse and scroll with the wheel. Script optimizers that
  // delay JavaScript until "user interaction" (WP Rocket, Perfmatters, Flying Scripts) never
  // load the animation code for a render that only calls window.scrollTo.
  try { await page.mouse.move(400, 300); await page.mouse.move(700, 450, { steps: 8 }); } catch (e) { /* ignore */ }
  try { await page.keyboard.press('Shift'); } catch (e) { /* ignore */ }
  await sleep(waitMs);
  // Down in half-viewport steps (an observer with a high threshold needs the element well
  // inside the viewport, and a 700 px step could carry a short block straight past it), then
  // a reverse pass back to the top so anything that fired late gets a second chance.
  let steps = 0, wheel = true;
  try {
    for (let i = 0; i < 120; i++) {
      const more = await page.evaluate(() => window.scrollY + window.innerHeight < document.documentElement.scrollHeight - 2);
      if (!more) break;
      await page.mouse.wheel({ deltaY: 450 });
      await sleep(160);
      steps++;
    }
    await sleep(Math.max(600, Math.round(waitMs / 2)));
    for (let i = 0; i < 120; i++) {
      const atTop = await page.evaluate(() => window.scrollY <= 0);
      if (atTop) break;
      await page.mouse.wheel({ deltaY: -450 });
      await sleep(90);
    }
  } catch (e) {
    wheel = false;
    log('wheel scroll fallback: ' + String(e.message || e).slice(0, 100));
    steps = await page.evaluate(async () => {
      const h = () => document.documentElement.scrollHeight;
      let y = 0, n = 0;
      while (y < h() && n < 120) { y += 450; window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 140)); n++; }
      for (let k = y; k > 0; k -= 450) { window.scrollTo(0, k); await new Promise((r) => setTimeout(r, 80)); }
      return n;
    });
  }
  await sleep(Math.max(600, Math.round(waitMs / 2)));
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  await sleep(300);
  // Markers inserted after first paint get one more chance: scroll to each, nudge, settle.
  const lateTag = await page.evaluate(LATE_TAG).catch(() => ({ count: 0, hidden: 0, tops: [] }));
  if (lateTag.hidden) {
    try {
      for (const top of lateTag.tops.slice(0, 8)) {
        await page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 300)), top);
        await page.mouse.wheel({ deltaY: 40 }); await sleep(120); await page.mouse.wheel({ deltaY: -40 });
        await sleep(350);
      }
      await sleep(600);
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(300);
    } catch (e) { log('late-marker pass: ' + String(e.message || e).slice(0, 80)); }
  }
  const late = lateTag.count ? await page.evaluate(LATE_CHECK).catch(() => ({ count: lateTag.count, hidden: lateTag.hidden, residual: [] })) : { count: 0, hidden: 0, residual: [] };
  // Every originally-tagged element, wherever it is now, whatever class it carries now.
  const chk = await page.evaluate(GATE_CHECK).catch(() => ({ tracked: gateAtLoad.markers, hidden: gateAtLoad.hidden, stillMarked: gateAtLoad.markers, residual: [] }));
  const finalUrl = page.url();
  const status = await page.evaluate(() => document.readyState);
  // Re-install in case the page navigated or replaced the window object; INPAGE requires it.
  await page.evaluate(PAINT_INSTALL).catch(() => {});
  const data = await page.evaluate(INPAGE);
  if (data.renderedWords) {
    data.renderedWords.firstPaint = firstPaint && !firstPaint.error
      ? { main: firstPaint.main, page: firstPaint.page, buckets: firstPaint.buckets, innerTextMain: firstPaint.innerTextMain, textContentMain: firstPaint.textContentMain, reachable: firstPaint.reachable, scored: firstPaint.scored,
          carouselAccounting: firstPaint.carouselAccounting, measuredAt: { stage: 'first-paint', msSinceNavigation: firstPaint.measuredAt, wallClock: firstPaint.wallClock, scrollY: firstPaint.scrollY } }
      : { error: (firstPaint && firstPaint.error) || 'not measured' };
  }
  // Optionally the rendered DOM itself, serialised, so the served-HTML parser can be run over
  // what the browser built (script-injected content included) with the identical rules.
  let renderedHtml = '';
  if (opts && opts.wantHtml) renderedHtml = await page.evaluate(() => '<!doctype html>' + document.documentElement.outerHTML).catch(() => '');
  // probe: per-selector counts and word figures on the settled page, for operator diagnostics.
  if (opts && opts.probe && opts.probe.length) {
    data.probe = await page.evaluate(PROBE, opts.probe).catch((e) => ({ error: String(e && e.message || e) }));
  }
  await page.close().catch(() => {});
  if (renderedHtml) data.renderedHtml = renderedHtml;
  // The self-check, as exact counts. 'released' is used ONLY when the residual is literally
  // zero. Anything else is 'partial' (some released, N still hidden — those N are real and
  // listed) or 'stuck' (nothing released at all — likely a headless artifact, reported as
  // unverified). 'none' = no markers on the page.
  const tracked = chk.tracked || gateAtLoad.markers;
  const releasedN = Math.max(tracked - chk.hidden, 0);
  const gate = {
    atLoad: gateAtLoad,
    afterScroll: { markers: chk.stillMarked, hidden: chk.hidden, tracked: tracked },
    tracked: tracked, releasedCount: releasedN, residualCount: chk.hidden, residual: chk.residual,
    released: releasedN,
    state: tracked === 0 ? 'none' : (chk.hidden === 0 ? 'released' : (releasedN > 0 ? 'partial' : 'stuck')),
    summary: tracked === 0 ? 'no entrance-animation markers on the page'
      : tracked + ' marker' + (tracked === 1 ? '' : 's') + ' at first paint → ' + releasedN + '/' + tracked + ' released, ' + chk.hidden + ' still hidden'
        + (chk.hidden ? ' (' + chk.residual.slice(0, 3).map((r) => '“' + (r.ctaText || r.text).slice(0, 40) + '”').join(', ') + (chk.residual.length > 3 ? ', …' : '') + ')' : ''),
    late: late,
    lateSummary: late.count ? late.count + ' marker' + (late.count === 1 ? '' : 's') + ' inserted after first paint (a widget mounted them) → ' + (late.count - late.hidden) + '/' + late.count + ' released, ' + late.hidden + ' still hidden after a targeted scroll' + (late.hidden ? ' — reported as LATE / UNVERIFIED, not as hidden content' : '') : '',
    method: 'every marked element tagged at first paint and re-read by identity after a down pass, a reverse pass and a settle, regardless of scroll position; markers inserted after first paint are tagged and checked separately',
    interaction: 'mouse move + ' + (wheel ? 'wheel scroll' : 'window.scrollTo fallback') + ' (' + steps + ' steps down, then back up) + key press; prefers-reduced-motion: no-preference'
  };
  return Object.assign(data, {
    ok: true, url, finalUrl, readyState: status, waitStrategy: waitUsed, waitMs, scrolled: steps > 0, scrollSteps: steps,
    gate,
    renderMs: Date.now() - t0, pageErrors, consoleErrors
  });
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const { url, wait = '2500', parse = '', keyword = '', probe = '', html = '' } = req.query || {};
  if (!url) return res.status(400).json({ error: 'Missing url.' });
  const waitMs = Math.max(500, Math.min(6000, parseInt(wait, 10) || 2500));
  const wantParse = parse === '1';
  const wantHtml = html === '1';
  const probeSels = String(probe || '').split('|').map((s) => s.trim()).filter(Boolean).slice(0, 24);
  const notes = [];
  const log = (s) => notes.push(s);
  let browser = null;
  try {
    // @sparticuz/chromium ships as an ES module on Vercel's bundle; dynamic import works for
    // both the ESM and CommonJS builds, so the same code runs locally and in the function.
    const chromiumMod = await import('@sparticuz/chromium');
    const chromium = chromiumMod.default || chromiumMod;
    const puppeteerMod = await import('puppeteer-core');
    const puppeteer = puppeteerMod.default || puppeteerMod;
    try { chromium.setGraphicsMode = false; } catch (e) { /* older versions expose a setter */ }
    const executablePath = process.env.CHROME_PATH || await chromium.executablePath();
    browser = await puppeteer.launch({
      args: [...chromium.args, '--disable-gpu', '--no-zygote'],
      defaultViewport: { width: 1366, height: 900 },
      executablePath,
      headless: true,
      ignoreHTTPSErrors: true
    });
    const out = await Promise.race([
      renderWith(browser, url, waitMs, log, { wantHtml: wantParse || wantHtml, probe: probeSels }),
      sleep(48000).then(() => { throw new Error('Render exceeded the 48 s budget'); })
    ]);
    // parse=1: run the served-HTML parser over the rendered DOM, same rules, so a page whose
    // served HTML is script-gated can be measured the way its competitors are.
    if (wantParse && out.renderedHtml) {
      try {
        const parsed = require('./page.js').parse(out.renderedHtml, url, keyword, { full: true, fetchedUrl: url, finalUrl: out.finalUrl || url });
        parsed.source = 'rendered DOM (headless Chromium, after scroll + settle), parsed with the served-HTML rules';
        out.parsed = parsed;
      } catch (e) { out.parseError = String(e && e.message || e).slice(0, 200); }
      if (!wantHtml) delete out.renderedHtml;
    }
    // html=1: the serialised rendered DOM itself, capped, for a stored regression fixture.
    if (wantHtml && out.renderedHtml) out.renderedHtml = String(out.renderedHtml).slice(0, 1500000);
    out.notes = notes;
    return res.status(200).json(out);
  } catch (err) {
    return res.status(200).json({
      ok: false, url,
      error: String(err && err.message || err).slice(0, 300),
      notes
    });
  } finally {
    if (browser) { try { await browser.close(); } catch (e) { /* ignore */ } }
  }
};

module.exports.INPAGE = INPAGE;
module.exports.PAINT_INSTALL = PAINT_INSTALL;
module.exports.INJECT_HOOK = INJECT_HOOK;
module.exports.renderWith = renderWith;
