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
    };

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

  /* ── Solution tabs ───────────────────────────────────────── */
  (function solutionTabs() {
    const wrap = $('#solutionTabs');
    if (!wrap) return;

    const buttons = $$('.tab-buttons button', wrap);
    const panels  = $$('.tab-panel', wrap);

    buttons.forEach(btn => btn.addEventListener('click', () => {
      buttons.forEach(b => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panels.forEach(p => p.classList.toggle('active', p.id === 'tab-' + btn.dataset.tab));
    }));
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
    const range = $('#fleetRange');
    const fuel  = $('#fuelInput');
    const out   = $('#fleetOutput');
    const total = $('#savingTotal');
    if (!range || !fuel || !total) return;

    const money = new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0
    });

    /* 12% of annual fuel spend — the conservative end of what
       idle reduction, routing and maintenance alerts return. */
    const RATE = 0.12;

    function update() {
      const vehicles = Number(range.value) || 0;
      const monthly  = Number(fuel.value) || 0;
      if (out) out.textContent = vehicles;
      total.textContent = money.format(vehicles * monthly * 12 * RATE);
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
