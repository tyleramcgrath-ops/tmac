/* =====================================================================
   THE STUDIO: entrance doors, the compass (awaken, dock, section moods),
   sky and starfield, constellation portfolio, and the small touches.
   No dependencies; the 3D compass is loaded on demand as a module.
   ===================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var body = document.body;
  var cfg = window.TM || {};
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var store = {
    get: function (k, s) { try { return (s ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } },
    set: function (k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (e) {} }
  };

  /* ---------------- the compass ---------------- */
  var compass = null;
  var room = $('.tm-room');
  var awake = !room;               // inner pages start awake
  var busy = false;                // the form owns the compass while sending
  var pendingState = room ? 'asleep' : 'idle';
  var paused = false;

  function setCompass(state) {
    pendingState = state;
    doc.setAttribute('data-compass-state', state);
    if (compass) compass.setState(state);
  }

  function hasWebGL() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
  }

  var canvas = $('[data-compass-canvas]');
  if (canvas && cfg.compass && hasWebGL()) {
    import(cfg.compass).then(function (mod) {
      compass = mod.initCompass(canvas, { state: pendingState });
      compass.setState(pendingState);
      compass.setTime(doc.getAttribute('data-time') || 'night');
      if (!room) compass.dolly('in');
      doc.classList.add('tm-compass-ready');
      if (reduced || paused) setTimeout(function () { compass.pause(); }, 700);
    }).catch(function () { doc.classList.add('tm-no-webgl'); });
  } else {
    doc.classList.add('tm-no-webgl');
  }

  document.addEventListener('visibilitychange', function () {
    if (!compass || paused) return;
    if (document.hidden) compass.pause(); else compass.resume();
  });

  /* ---------------- entrance doors ---------------- */
  var entrance = $('.tm-entrance');
  if (entrance && !doc.classList.contains('tm-entered')) {
    body.classList.add('tm-locked');
    var enterBtn = $('[data-enter]', entrance);
    setTimeout(function () { enterBtn && enterBtn.focus({ preventScroll: true }); }, 400);
    var enter = function () {
      if (entrance.classList.contains('is-opening')) return;
      entrance.classList.add('is-opening');
      store.set('tm-entered', '1', true);
      setTimeout(function () {
        doc.classList.add('tm-entered');
        body.classList.remove('tm-locked');
        doc.classList.add('tm-arrived');
      }, reduced ? 50 : 1500);
      setTimeout(function () { entrance.remove(); }, reduced ? 100 : 2300);
    };
    enterBtn && enterBtn.addEventListener('click', enter);
    entrance.addEventListener('keydown', function (e) { if (e.key === 'Escape') enter(); });
  } else {
    if (entrance) entrance.remove();
    doc.classList.add('tm-arrived');
  }

  /* ---------------- awakening ---------------- */
  function awaken(then) {
    if (awake) { if (then) then(); return; }
    awake = true;
    doc.classList.add('tm-awake');
    setCompass('awakening');
    if (compass) { compass.dolly('in'); compass.flare(); }
    setTimeout(function () {
      if (!busy) setCompass(currentSectionState());
      if (then) then();
    }, reduced ? 100 : 1900);
  }

  var awakenBtn = $('[data-awaken]');
  if (awakenBtn) {
    awakenBtn.addEventListener('click', function () {
      awaken(function () { scrollToId('portfolio'); });
    });
  }

  function scrollToId(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------------- section moods ---------------- */
  var sections = $$('[data-compass]');
  var activeSection = sections[0] || null;
  function currentSectionState() {
    if (!activeSection) return 'idle';
    var s = activeSection.getAttribute('data-compass');
    if (s === 'asleep') return awake ? 'idle' : 'asleep';
    return s;
  }
  if ('IntersectionObserver' in window && sections.length) {
    var moodIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          activeSection = en.target;
          doc.setAttribute('data-section', en.target.getAttribute('data-section') || '');
          if (!busy && (awake || en.target === room)) setCompass(currentSectionState());
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    sections.forEach(function (s) { moodIO.observe(s); });
  }

  /* ---------------- compass stage: hero ↔ dock ---------------- */
  var stage = $('[data-compass-stage]');
  var dock = $('[data-compass-dock]');
  var header = $('[data-header]');
  var docked = false;

  function layoutStage() {
    if (!stage) return;
    var vw = window.innerWidth, vh = window.innerHeight;
    var mobile = vw < 820;
    var size = mobile ? Math.min(vw * 0.86, vh * 0.46) : Math.min(vh * 0.62, vw * 0.42);
    var dockSize = mobile ? 64 : 88;
    var heroCx = mobile ? vw / 2 : vw * 0.5;
    var heroCy = mobile ? vh * 0.6 : vh * 0.46;
    var p = 1;
    if (room) {
      var h = room.offsetHeight || vh;
      p = clamp(window.scrollY / (h * 0.7), 0, 1);
    }
    var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; // ease in-out
    var dockCx = vw - (mobile ? 16 : 28) - dockSize / 2;
    var dockCy = vh - (mobile ? 16 : 28) - dockSize / 2;
    var cx = heroCx + (dockCx - heroCx) * e;
    var cy = heroCy + (dockCy - heroCy) * e;
    var scale = 1 + (dockSize * 1.5 / size - 1) * e;
    if (stage.__size !== size) {
      stage.style.width = stage.style.height = size + 'px';
      stage.__size = size;
      if (compass && compass.resize) compass.resize();
    }
    stage.style.transform = 'translate3d(' + (cx - size / 2) + 'px,' + (cy - size / 2) + 'px,0) scale(' + scale + ')';
    var isDocked = p > 0.98;
    if (isDocked !== docked) {
      docked = isDocked;
      doc.classList.toggle('tm-docked', docked);
      if (dock) dock.tabIndex = docked ? 0 : -1;
    }
    if (room && p > 0.25 && !awake) awaken();
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; layoutStage(); progressBearings(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  layoutStage();

  if (dock) {
    dock.addEventListener('click', function () {
      if (compass) compass.flare();
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
    dock.addEventListener('pointerenter', function () { compass && compass.hover(true); });
    dock.addEventListener('pointerleave', function () { compass && compass.hover(false); });
  }

  /* ---------------- pause ---------------- */
  var pauseBtn = $('[data-pause]');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', function () {
      paused = !paused;
      pauseBtn.setAttribute('aria-pressed', String(paused));
      pauseBtn.innerHTML = paused ? '▶ Play' : 'Ⅱ Pause';
      doc.classList.toggle('tm-paused', paused);
      if (compass) { if (paused) compass.pause(); else compass.resume(); }
    });
  }

  /* ---------------- time of day ---------------- */
  var TIMES = ['auto', 'dawn', 'day', 'dusk', 'night'];
  var NAMES = { auto: 'Auto', dawn: 'Dawn', day: 'Day', dusk: 'Dusk', night: 'Night' };
  function autoTime() {
    var h = new Date().getHours();
    return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'dusk' : 'night';
  }
  var timePref = store.get('tm-time') || 'auto';
  function applyTime() {
    var t = timePref === 'auto' ? autoTime() : timePref;
    doc.setAttribute('data-time', t);
    if (compass) compass.setTime(t);
    $$('[data-time-label]').forEach(function (el) { el.textContent = NAMES[timePref]; });
    $$('[data-sky-label]').forEach(function (el) { el.textContent = NAMES[t]; });
  }
  applyTime();
  $$('[data-time-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      timePref = TIMES[(TIMES.indexOf(timePref) + 1) % TIMES.length];
      store.set('tm-time', timePref);
      applyTime();
      if (compass) compass.flare();
    });
  });

  /* ---------------- pointer: parallax, heading, cursor ---------------- */
  var mx = 0, my = 0, tx = 0, ty = 0;
  var headingEl = $('[data-heading]'), headingDir = $('[data-heading-dir]');
  var DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  window.addEventListener('pointermove', function (e) {
    tx = e.clientX / window.innerWidth - 0.5;
    ty = e.clientY / window.innerHeight - 0.5;
    if (headingEl && stage) {
      var r = stage.getBoundingClientRect();
      var ang = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2)));
      var deg = (Math.round(ang * 180 / Math.PI) + 360) % 360;
      headingEl.textContent = ('00' + deg).slice(-3) + '°';
      headingDir.textContent = DIRS[Math.round(deg / 45) % 8];
    }
  }, { passive: true });

  var cursor = $('.tm-cursor');
  var useCursor = cursor && !coarse && !reduced;
  if (useCursor) doc.classList.add('tm-has-cursor');
  var cx = -100, cy = -100, rx = -100, ry = -100;
  if (useCursor) {
    window.addEventListener('pointermove', function (e) { cx = e.clientX; cy = e.clientY; }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var hot = e.target.closest('a, button, [data-star], input, textarea, label');
      cursor.classList.toggle('is-hot', !!hot);
    });
    document.addEventListener('pointerdown', function () { cursor.classList.add('is-down'); });
    document.addEventListener('pointerup', function () { cursor.classList.remove('is-down'); });
  }

  (function loop() {
    mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
    doc.style.setProperty('--mx', mx.toFixed(4));
    doc.style.setProperty('--my', my.toFixed(4));
    if (useCursor) {
      rx += (cx - rx) * 0.18; ry += (cy - ry) * 0.18;
      cursor.firstElementChild.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      cursor.lastElementChild.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
    }
    if (!reduced) requestAnimationFrame(loop);
  })();

  /* ---------------- clock ---------------- */
  var clockEl = $('[data-clock]');
  function tick() {
    if (!clockEl) return;
    clockEl.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  tick(); setInterval(tick, 15000);

  /* ---------------- starfield (window band + inner heroes) ---------------- */
  $$('[data-stars]').forEach(function (cv) {
    var ctx = cv.getContext('2d');
    var stars = [], shoot = null, visible = true, w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    function seed() {
      var r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round((w * h) / 9000);
      stars = [];
      for (var i = 0; i < n; i++) {
        stars.push({ x: Math.random() * w, y: Math.random() * h * 0.62, r: Math.random() * 1.1 + 0.2, p: Math.random() * 6.28, s: 0.6 + Math.random() * 1.8, d: Math.random() * 0.8 + 0.2 });
      }
    }
    seed();
    window.addEventListener('resize', seed);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(cv);
    }
    var t0 = performance.now();
    (function draw(now) {
      requestAnimationFrame(draw);
      if (!visible || paused) return;
      var t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var a = reduced ? 0.6 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.s + s.p));
        ctx.globalAlpha = a * s.d;
        ctx.fillStyle = '#fff1d2';
        ctx.beginPath();
        ctx.arc(s.x - mx * 14 * s.d, s.y - my * 8 * s.d, s.r, 0, 6.283);
        ctx.fill();
      }
      if (!reduced) {
        if (!shoot && Math.random() < 0.004) shoot = { x: Math.random() * w * 0.8, y: Math.random() * h * 0.3, life: 0 };
        if (shoot) {
          shoot.life += 0.016;
          var L = shoot.life, sx = shoot.x + L * 520, sy = shoot.y + L * 190;
          var g = ctx.createLinearGradient(sx - 120, sy - 44, sx, sy);
          g.addColorStop(0, 'rgba(255,230,180,0)'); g.addColorStop(1, 'rgba(255,240,210,' + (0.9 * (1 - L)) + ')');
          ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(sx - 120, sy - 44); ctx.lineTo(sx, sy); ctx.stroke();
          if (L > 1) shoot = null;
        }
      }
    })(t0);
  });

  /* ---------------- reveal on scroll ---------------- */
  var revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduced) {
    var revIO = new IntersectionObserver(function (entries) {
      var batch = 0;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.style.transitionDelay = (batch++ * 70) + 'ms';
        en.target.classList.add('is-in');
        revIO.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { revIO.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------------- counters ---------------- */
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window && !reduced) {
    var cIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        cIO.unobserve(en.target);
        var el = en.target, end = +el.getAttribute('data-count'), start = performance.now(), dur = 1600;
        (function step(now) {
          var k = clamp((now - start) / dur, 0, 1);
          el.textContent = Math.round(end * (1 - Math.pow(1 - k, 4)));
          if (k < 1) requestAnimationFrame(step);
        })(start);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { c.textContent = '0'; cIO.observe(c); });
  }

  /* ---------------- tilt + spotlight + magnetic ---------------- */
  if (!coarse && !reduced) {
    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateX(' + (-py * 6).toFixed(2) + 'deg) rotateY(' + (px * 8).toFixed(2) + 'deg) translateZ(0)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }
  $$('[data-spotlight]').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--sx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--sy', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------------- waypoint menu ---------------- */
  var wp = $('#tm-waypoints'), openBtn = $('[data-menu-open]'), needle = $('[data-needle]');
  function closeMenu() {
    if (!wp || wp.hidden) return;
    wp.classList.remove('is-open');
    openBtn.setAttribute('aria-expanded', 'false');
    body.classList.remove('tm-locked');
    setTimeout(function () { wp.hidden = true; }, 350);
    openBtn.focus();
  }
  if (wp && openBtn) {
    openBtn.addEventListener('click', function () {
      wp.hidden = false;
      requestAnimationFrame(function () { wp.classList.add('is-open'); });
      openBtn.setAttribute('aria-expanded', 'true');
      body.classList.add('tm-locked');
      var first = $('a', wp); first && first.focus();
    });
    $('[data-menu-close]', wp).addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    var links = $$('.tm-waypoints__nav a', wp);
    links.forEach(function (a, i) {
      var deg = (360 / links.length) * i;
      var point = function () { if (needle) needle.style.transform = 'rotate(' + deg + 'deg)'; };
      a.addEventListener('pointerenter', point);
      a.addEventListener('focus', point);
      a.addEventListener('click', closeMenu);
    });
  }

  /* ---------------- portfolio: filters + constellation ---------------- */
  var projects = $$('.tm-project[data-project]');
  var stars = $$('[data-star]');
  var lines = $$('.tm-constellation__lines line');
  function light(i, on) {
    var star = stars[i], card = projects[i];
    if (star) star.classList.toggle('is-lit', on);
    if (card) card.classList.toggle('is-lit', on);
    lines.forEach(function (l) {
      if (+l.getAttribute('data-a') === i || +l.getAttribute('data-b') === i) l.classList.toggle('is-lit', on);
    });
    doc.classList.toggle('tm-star-hover', on);
  }
  projects.forEach(function (card, i) {
    card.addEventListener('pointerenter', function () { light(i, true); });
    card.addEventListener('pointerleave', function () { light(i, false); });
    card.addEventListener('focusin', function () { light(i, true); });
    card.addEventListener('focusout', function () { light(i, false); });
  });
  stars.forEach(function (star, i) {
    star.addEventListener('pointerenter', function () { light(i, true); });
    star.addEventListener('pointerleave', function () { light(i, false); });
    star.addEventListener('click', function () {
      var card = projects[i];
      if (!card) return;
      if (compass) compass.flare();
      card.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      var link = $('.tm-project__card', card);
      setTimeout(function () { link && link.focus({ preventScroll: true }); }, reduced ? 0 : 600);
    });
  });

  var filterBtns = $$('[data-filter]');
  function applyFilter(f) {
    filterBtns.forEach(function (b) {
      var on = b.getAttribute('data-filter') === f;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    projects.forEach(function (p) {
      p.classList.toggle('is-hidden', f !== '*' && p.getAttribute('data-discipline') !== f);
    });
    stars.forEach(function (s) {
      s.classList.toggle('is-dim', f !== '*' && s.getAttribute('data-discipline') !== f);
    });
    lines.forEach(function (l) {
      var a = stars[+l.getAttribute('data-a')], b = stars[+l.getAttribute('data-b')];
      l.classList.toggle('is-dim', f !== '*' && (a.classList.contains('is-dim') || b.classList.contains('is-dim')));
    });
    if (compass) compass.flare();
  }
  filterBtns.forEach(function (b) {
    b.addEventListener('click', function () { applyFilter(b.getAttribute('data-filter')); });
  });
  $$('[data-filter-link]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var f = a.getAttribute('data-filter-link');
      if (filterBtns.some(function (b) { return b.getAttribute('data-filter') === f; })) applyFilter(f);
      scrollToId('portfolio');
    });
  });

  /* ---------------- bearings progress ---------------- */
  var bearings = $('[data-bearings]'), bearingsBar = $('[data-bearings-progress]');
  function progressBearings() {
    if (!bearings || !bearingsBar) return;
    var r = bearings.getBoundingClientRect(), vh = window.innerHeight;
    var p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.3), 0, 1);
    bearingsBar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
  }
  progressBearings();

  /* ---------------- contact form ---------------- */
  var form = $('[data-contact-form]');
  if (form && window.fetch && window.FormData && cfg.ajaxUrl) {
    var status = $('[data-form-status]', form), label = $('[data-submit-label]', form);
    var idleLabel = label ? label.textContent : '';
    form.addEventListener('focusin', function () { if (!busy && awake) setCompass('listening'); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      if (!form.checkValidity()) { form.reportValidity(); return; }
      busy = true;
      awaken();
      form.classList.add('is-sending');
      status.className = 'tm-form__status';
      status.textContent = '';
      if (label) label.textContent = (cfg.i18n && cfg.i18n.sending) || 'Sending…';
      setCompass('deploying');
      fetch(cfg.ajaxUrl, { method: 'POST', body: new FormData(form), credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && res.success) {
            setCompass('success');
            if (compass) compass.flare();
            status.className = 'tm-form__status is-ok';
            status.textContent = cfg.i18n.sent;
            form.reset();
            form.classList.add('is-sent');
          } else {
            setCompass('warning');
            status.className = 'tm-form__status is-error';
            status.textContent = (res && res.data && res.data.message) || cfg.i18n.error;
          }
        })
        .catch(function () {
          setCompass('error');
          status.className = 'tm-form__status is-error';
          status.textContent = cfg.i18n.error;
        })
        .then(function () {
          form.classList.remove('is-sending');
          if (label) label.textContent = idleLabel;
          setTimeout(function () { busy = false; setCompass(currentSectionState()); }, 4000);
        });
    });
  }

  /* ---------------- back to top ---------------- */
  $$('[data-to-top]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  });
})();
