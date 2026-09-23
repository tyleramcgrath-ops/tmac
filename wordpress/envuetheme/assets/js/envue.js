/* ═══════════════════════════════════════════════════════════════
   EnVue Telematics — site behaviour
   Shared by index.html, inner pages and the WordPress theme.
   Every block is defensive: a page that lacks a component simply
   skips it.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ── Mobile menu ─────────────────────────────────────────── */
  (function mobileMenu() {
    const toggle = $('#mobileToggle');
    const menu   = $('#mobileMenu');
    if (!toggle || !menu) return;

    const setOpen = open => {
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
      const hdr = menu.closest('.site-header');
      if (hdr) hdr.classList.toggle('menu-open', open);
      if (!open) $$('details[open]', menu).forEach(d => { d.open = false; });
    };
    // one section open at a time
    $$('details.m-group', menu).forEach(d => d.addEventListener('toggle', () => {
      if (d.open) $$('details.m-group', menu).forEach(o => { if (o !== d) o.open = false; });
    }));

    toggle.addEventListener('click', e => {
      e.stopPropagation();
      setOpen(menu.hidden);
    });
    $$('a', menu).forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('click', e => {
      if (!menu.hidden && !menu.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !menu.hidden) { setOpen(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 1081px)').addEventListener('change', e => { if (e.matches) setOpen(false); });
  })();

  /* ── Desktop nav dropdowns ───────────────────────────────── */
  (function desktopNav() {
    const items = $$('.has-menu');
    if (!items.length) return;
    let closeTimer;

    function closeAll(except) {
      items.forEach(li => { if (li !== except) li.classList.remove('is-open'); });
    }

    items.forEach(li => {
      const drop = li.querySelector('.dropdown, .dropdown--mega');

      li.addEventListener('mouseenter', () => {
        clearTimeout(closeTimer);
        closeAll(li);
        li.classList.add('is-open');
        // Clamp mega dropdown to viewport
        const mega = li.querySelector('.dropdown--mega');
        if (mega) {
          mega.style.left = '0';
          mega.style.right = '0';
          mega.style.marginLeft = 'auto';
          mega.style.marginRight = 'auto';
          requestAnimationFrame(() => {
            const r = mega.getBoundingClientRect();
            const vw = window.innerWidth;
            if (r.right > vw - 8) {
              mega.style.marginRight = Math.ceil(r.right - vw + 8) + 'px';
              mega.style.marginLeft = '0';
            }
            if (r.left < 8) {
              mega.style.marginLeft = Math.ceil(8 - r.left) + 'px';
              mega.style.marginRight = '0';
            }
          });
        }
      });
      li.addEventListener('mouseleave', () => {
        closeTimer = setTimeout(() => li.classList.remove('is-open'), 200);
      });

      if (drop) {
        drop.addEventListener('mouseenter', () => clearTimeout(closeTimer));
        drop.addEventListener('mouseleave', () => {
          closeTimer = setTimeout(() => li.classList.remove('is-open'), 200);
        });
      }
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.has-menu')) closeAll(null);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeAll(null);
    });
  })();

  /* ── Hero slider ─────────────────────────────────────────── */
  (function heroSlider() {
    const hero = $('#heroSlider');
    if (!hero) return;

    const slides = $$('.hero-slide', hero);
    const backs  = $$('.hero-bg', hero);
    const dots   = $$('.hero-dot', hero);
    const current = $('#heroCurrent');
    if (slides.length < 2) return;

    let index = 0;
    let timer = null;
    const pad = n => String(n + 1).padStart(2, '0');

    function go(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach((s, i) => {
        s.classList.toggle('active', i === index);
        s.setAttribute('aria-hidden', i === index ? 'false' : 'true');
      });
      backs.forEach((b, i) => b.classList.toggle('active', i === index));
      dots.forEach((d, i) => {
        d.classList.toggle('active', i === index);
        d.setAttribute('aria-pressed', i === index ? 'true' : 'false');
      });
      if (current) current.textContent = pad(index);
    }

    function start() {
      stop();
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      timer = setInterval(() => go(index + 1), 7000);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    dots.forEach(dot => dot.addEventListener('click', () => { go(+dot.dataset.heroGo); start(); }));
    const prev = $('#heroPrevious'), next = $('#heroNext');
    if (prev) prev.addEventListener('click', () => { go(index - 1); start(); });
    if (next) next.addEventListener('click', () => { go(index + 1); start(); });
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

    go(0);
    start();
  })();

  /* ── Rollout steps ───────────────────────────────────────── */
  (function rollout() {
    const steps = $$('.rollout-steps button');
    if (!steps.length) return;

    const stages = {
      audit: {
        label: 'Week 01 / Assessment',
        title: 'We learn your operation before anything gets installed.',
        text: 'A review of vehicles, assets, routes, risk exposure and reporting gaps, so the rollout is designed around how your fleet actually runs.',
        deliverable: 'Fleet needs map',
        focus: 'Visibility'
      },
      install: {
        label: 'Week 02 / Installation',
        title: 'Hardware in, with the least possible downtime.',
        text: 'GO devices, cameras and asset trackers fitted on your schedule — staggered by yard or shift so vehicles keep earning while the fleet comes online.',
        deliverable: 'Connected fleet',
        focus: 'Continuity'
      },
      train: {
        label: 'Week 03 / Adoption',
        title: 'The people who use it every day are trained first.',
        text: 'Dispatch, safety and maintenance each get the views and alerts they need, plus driver-facing coaching that explains the why, not just the score.',
        deliverable: 'Role-based dashboards',
        focus: 'Adoption'
      },
      improve: {
        label: 'Ongoing / Optimization',
        title: 'Quarterly reviews that keep paying for the system.',
        text: 'We benchmark cost per mile, idle, safety events and utilization against your baseline, then tune alerts and reports as the operation changes.',
        deliverable: 'Quarterly ROI review',
        focus: 'Savings'
      }
    };

    const el = {
      label: $('#rolloutLabel'), title: $('#rolloutTitle'), text: $('#rolloutText'),
      deliverable: $('#rolloutDeliverable'), focus: $('#rolloutFocus')
    };

    steps.forEach(btn => btn.addEventListener('click', () => {
      const stage = stages[btn.dataset.rollout];
      if (!stage) return;
      steps.forEach(b => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if (el.label) el.label.textContent = stage.label;
      if (el.title) el.title.textContent = stage.title;
      if (el.text) el.text.textContent = stage.text;
      if (el.deliverable) el.deliverable.textContent = stage.deliverable;
      if (el.focus) el.focus.textContent = stage.focus;
    }));
  })();

  /* ── ROI calculator ──────────────────────────────────────── */
  (function roi() {
    const range    = $('#fleetRange');
    const fuel     = $('#fuelInput');
    const out      = $('#fleetOutput');
    const total    = $('#savingTotal');
    const roiFuel  = $('#roiFuel');
    const roiMaint = $('#roiMaint');
    const roiProd  = $('#roiProd');
    if (!range || !fuel || !total) return;

    const money = new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0
    });

    function update() {
      const vehicles = Number(range.value) || 0;
      const monthly  = Number(fuel.value) || 0;
      const annual   = vehicles * monthly * 12;
      if (out) out.textContent = vehicles;
      total.textContent = money.format(annual * 0.12);
      if (roiFuel)  roiFuel.textContent  = money.format(annual * 0.05);
      if (roiMaint) roiMaint.textContent = money.format(annual * 0.04);
      if (roiProd)  roiProd.textContent  = money.format(annual * 0.03);
    }

    range.addEventListener('input', update);
    fuel.addEventListener('input', update);
    update();
  })();

  /* ── Safety demo ─────────────────────────────────────────── */
  (function safety() {
    const buttons = $$('.event-actions button');
    const label   = $('#safetyEvent');
    const message = $('#coachingMessage');
    if (!buttons.length || !label || !message) return;

    const events = {
      safe: {
        tag: 'Normal driving',
        copy: 'No events. Following distance, speed and lane position are all inside policy — nothing reaches a reviewer.'
      },
      brake: {
        tag: 'Hard brake detected',
        copy: 'The camera clips 8 seconds either side of the event and tags it automatically. A reviewer sees the cause — a cut-in, not a distracted driver — in about a minute.'
      },
      distracted: {
        tag: 'Distracted driving',
        copy: 'An in-cab alert fires in real time, before it becomes an incident. The clip lands in the driver’s coaching queue with the context attached.'
      }
    };

    buttons.forEach(btn => btn.addEventListener('click', () => {
      const event = events[btn.dataset.event];
      if (!event) return;
      buttons.forEach(b => b.classList.toggle('active', b === btn));
      label.textContent = event.tag;
      message.textContent = event.copy;
    }));
  })();

  /* ── Connected Ops diagram ──────────────────────────────── */
  (function opDiagram() {
    const diagram = document.getElementById('opDiagram');
    if (!diagram) return;
    const nodes      = diagram.querySelectorAll('.op-node');
    const connectors = diagram.querySelectorAll('.op-connector');
    if (!nodes.length) return;

    const activate = () => {
      nodes.forEach((node, i) => {
        setTimeout(() => node.classList.add('active'), i * 180);
      });
      connectors.forEach((conn, i) => {
        setTimeout(() => conn.classList.add('lit'), i * 180 + 90);
      });
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach(n => n.classList.add('active'));
      connectors.forEach(c => c.classList.add('lit'));
      return;
    }
    if (!('IntersectionObserver' in window)) { activate(); return; }

    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { activate(); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(diagram);
  })();

  /* ── Count-up ────────────────────────────────────────────── */
  (function countUp() {
    const nums = $$('[data-count]');
    if (!nums.length || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nums.forEach(n => { n.textContent = n.dataset.count; });
      return;
    }

    const run = el => {
      const target = Number(el.dataset.count);
      const start = performance.now();
      const step = now => {
        const p = Math.min((now - start) / 1100, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    nums.forEach(n => io.observe(n));
  })();

  /* ── Scroll reveal ───────────────────────────────────────── */
  (function reveal() {
    const items = $$('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(i => i.classList.add('visible'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px' });
    items.forEach(i => io.observe(i));
  })();
})();

/* ── FAQ Accordion ─────────────────────────────────────────── */
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    // Close all
    document.querySelectorAll('.faq-item.open').forEach(el => {
      el.classList.remove('open');
      const b = el.querySelector('.faq-q'); if (b) b.setAttribute('aria-expanded', 'false');
    });
    // Toggle current
    if (!isOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
  });
});

/* ── Testimonials slider (scroll-snap + arrows/dots) ─────────────── */
document.querySelectorAll('[data-slider]').forEach(function (slider) {
  var track = slider.querySelector('.t-track');
  var prev = slider.querySelector('.t-prev');
  var next = slider.querySelector('.t-next');
  var dotsWrap = slider.querySelector('.t-dots');
  if (!track) return;
  var cards = track.children;
  function step() {
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return cards.length ? cards[0].getBoundingClientRect().width + gap : track.clientWidth;
  }
  function perView() { return Math.max(1, Math.round(track.clientWidth / step())); }
  function pages() { return Math.max(1, cards.length - perView() + 1); }
  function current() { return Math.round(track.scrollLeft / step()); }
  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    for (var i = 0; i < pages(); i++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
      (function (n) { b.addEventListener('click', function () { track.scrollTo({ left: n * step() }); }); })(i);
      dotsWrap.appendChild(b);
    }
    update();
  }
  function update() {
    var c = current(), max = pages() - 1;
    if (prev) prev.disabled = c <= 0;
    if (next) next.disabled = c >= max;
    if (dotsWrap) Array.prototype.forEach.call(dotsWrap.children, function (d, i) { d.classList.toggle('is-active', i === c); });
  }
  if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step() }); });
  if (next) next.addEventListener('click', function () { track.scrollBy({ left: step() }); });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: step() }); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); track.scrollBy({ left: -step() }); }
  });
  var t; track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(update, 60); }, { passive: true });
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(buildDots, 120); });
  buildDots();
});

/* ── Article: reading progress, contents, copy link ────────────── */
(function () {
  const body = document.getElementById('post-body');
  if (!body) return;

  const bar = document.querySelector('.read-progress span');
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = body.getBoundingClientRect();
    const total = r.height - window.innerHeight * 0.6;
    const p = Math.min(1, Math.max(0, (-r.top + window.innerHeight * 0.2) / (total > 0 ? total : 1)));
    if (bar) bar.style.transform = 'scaleX(' + p + ')';
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();

  const toc = document.querySelector('.side-toc');
  const heads = Array.from(body.querySelectorAll('h2')).filter(h => h.textContent.trim());
  if (toc && heads.length >= 3) {
    const list = toc.querySelector('ol');
    const used = {};
    heads.forEach((h, i) => {
      if (!h.id) {
        let id = h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'section-' + i;
        while (used[id] || document.getElementById(id)) id += '-' + i;
        h.id = id;
      }
      used[h.id] = true;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent.trim();
      li.appendChild(a);
      list.appendChild(li);
    });
    toc.hidden = false;
    const links = Array.from(list.querySelectorAll('a'));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id));
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    heads.forEach(h => io.observe(h));
  }

  document.querySelectorAll('.share-btn--copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-copy');
      const msg = btn.querySelector('.share-copied');
      const done = () => { if (msg) { msg.textContent = 'Link copied'; setTimeout(() => { msg.textContent = ''; }, 1800); } };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(done, () => window.prompt('Copy this link:', url));
      } else {
        window.prompt('Copy this link:', url);
      }
    });
  });
})();

/* ── Stat bands: shrink a value only if a long word overflows its cell ── */
(function () {
  const vals = Array.from(document.querySelectorAll('.stat-band strong'));
  if (!vals.length) return;
  const fit = () => vals.forEach(el => {
    el.style.fontSize = '';
    let size = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > el.clientWidth + 1 && size > 16) {
      size -= 1;
      el.style.fontSize = size + 'px';
    }
  });
  fit();
  let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();
