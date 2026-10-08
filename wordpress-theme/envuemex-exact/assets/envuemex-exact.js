(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initLang();
    initHeroLoad();
    initHeroSlider();
    initMarquee();
    initStickyNav();
    initMobileNav();
    initReveal();
    initLiveTicker();
    initContactForm();
  }

  /* ---------------- Hero orchestrated entrance ---------------- */
  function initHeroLoad() {
    document.querySelectorAll('.hero').forEach(function (hero) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { hero.classList.add('is-loaded'); });
      });
    });
  }

  /* ---------------- Hero slider ---------------- */
  function initHeroSlider() {
    document.querySelectorAll('.hero').forEach(function (hero) {
      var slides = Array.from(hero.querySelectorAll('.hero-slide'));
      var dots = Array.from(hero.querySelectorAll('.hero-dot'));
      if (!slides.length) return;
      var active = 0;
      var timer;
      function show(index) {
        slides[active] && slides[active].classList.remove('active');
        dots[active] && dots[active].classList.remove('active');
        active = (index + slides.length) % slides.length;
        slides[active] && slides[active].classList.add('active');
        dots[active] && dots[active].classList.add('active');
      }
      function start() {
        window.clearInterval(timer);
        timer = window.setInterval(function () { show(active + 1); }, 7000);
      }
      dots.forEach(function (dot) {
        dot.addEventListener('click', function () {
          show(Number(dot.dataset.slide));
          start();
        });
      });
      hero.addEventListener('mouseenter', function () { window.clearInterval(timer); });
      hero.addEventListener('mouseleave', start);
      start();
    });
  }

  /* ---------------- Marquee ---------------- */
  function initMarquee() {
    document.querySelectorAll('.route-inner').forEach(function (track) {
      if (track.dataset.cloned) return;
      var children = Array.from(track.children);
      children.forEach(function (child) {
        var clone = child.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });
      track.dataset.cloned = '1';
    });
  }

  /* ---------------- Sticky nav scroll state ---------------- */
  function initStickyNav() {
    var nav = document.querySelector('.topline');
    if (!nav) return;
    var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------- Mobile drawer ---------------- */
  function initMobileNav() {
    var toggle = document.querySelector('.nav-toggle');
    var drawer = document.querySelector('.mobile-drawer');
    if (!toggle || !drawer) return;
    var body = document.body;
    function close() { body.classList.remove('nav-open'); toggle.setAttribute('aria-expanded', 'false'); }
    function open()  { body.classList.add('nav-open');    toggle.setAttribute('aria-expanded', 'true');  }
    toggle.addEventListener('click', function () { body.classList.contains('nav-open') ? close() : open(); });
    drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    var mq = window.matchMedia('(min-width: 981px)');
    var onChange = function (e) { if (e.matches) close(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange); else mq.addListener(onChange);
  }

  /* ---------------- Reveal on scroll ---------------- */
  function initReveal() {
    var els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -80px 0px', threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Live ticker — fake-real-time updates ---------------- */
  function initLiveTicker() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.querySelectorAll('.telemetry-strip [data-live]').forEach(function (el) {
      var kind = el.dataset.live;
      var base = parseFloat(el.dataset.base || el.textContent.replace(/[^\d.-]/g, '')) || 0;
      function tick() {
        if (kind === 'nodes') {
          base += Math.floor(Math.random() * 3);
          el.textContent = base.toLocaleString();
        } else if (kind === 'lat') {
          var lat = 25.6 + (Math.random() - 0.5) * 0.4;
          var lon = -100.3 + (Math.random() - 0.5) * 0.6;
          el.textContent = lat.toFixed(2) + '°N · ' + Math.abs(lon).toFixed(2) + '°W';
        } else if (kind === 'time') {
          var d = new Date();
          var pad = function (n) { return n < 10 ? '0' + n : n; };
          el.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + ' UTC-6';
        } else if (kind === 'speed') {
          var s = 78 + Math.floor(Math.random() * 22);
          el.textContent = s + ' KM/H · AVG';
        }
      }
      tick();
      var interval = kind === 'time' ? 1000 : (kind === 'lat' ? 4000 : 2500);
      setInterval(tick, interval);
    });
  }

  /* ---------------- Contact form (AJAX) ---------------- */
  function initContactForm() {
    var form = document.querySelector('.emx-form[data-emx-form]');
    if (!form) return;
    var status = form.querySelector('.emx-form-status');
    var submit = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!status) return;
      status.className = 'emx-form-status';
      status.textContent = '';
      submit.disabled = true;
      var data = new FormData(form);
      if (data.get('emx_hp')) {
        showOk('Gracias, te contactaremos pronto.');
        form.reset();
        submit.disabled = false;
        return;
      }
      data.append('action', 'emx_contact_submit');
      var ajaxUrl = (window.emxConfig && window.emxConfig.ajaxUrl) || '/wp-admin/admin-ajax.php';
      fetch(ajaxUrl, { method: 'POST', body: data, credentials: 'same-origin' })
        .then(function (r) { return r.json().catch(function () { return { success: r.ok }; }); })
        .then(function (json) {
          if (json && json.success) {
            showOk((json.data && json.data.message) || 'Gracias, te contactaremos pronto.');
            form.reset();
          } else {
            showErr((json && json.data && json.data.message) || 'No pudimos enviar tu mensaje. Intenta de nuevo o escríbenos.');
          }
        })
        .catch(function () { showErr('No pudimos enviar tu mensaje. Intenta de nuevo o escríbenos.'); })
        .finally(function () { submit.disabled = false; });
    });

    function showOk(msg)  { status.className = 'emx-form-status is-ok';  status.textContent = msg; }
    function showErr(msg) { status.className = 'emx-form-status is-err'; status.textContent = msg; }
  }

  /* ---------------- Language toggle (ES default / EN) ---------------- */
  function initLang() {
    var saved;
    try { saved = localStorage.getItem('emx-lang'); } catch (e) {}
    var cookie = document.cookie.match(/(?:^|; )emx-lang=([^;]+)/);
    var initial = saved || (cookie && cookie[1]) || 'es';
    setLang(initial);

    document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () { setLang(btn.dataset.langBtn); });
    });
  }

  function setLang(lang) {
    if (lang !== 'es' && lang !== 'en') lang = 'es';
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.dataset.lang = lang;

    document.querySelectorAll('[data-en]').forEach(function (el) {
      if (!el.hasAttribute('data-emx-es-orig')) el.setAttribute('data-emx-es-orig', el.innerHTML);
      el.innerHTML = lang === 'en' ? el.getAttribute('data-en') : el.getAttribute('data-emx-es-orig');
    });

    document.querySelectorAll('[data-en-attr]').forEach(function (el) {
      var pairs = (el.getAttribute('data-en-attr') || '').split('|');
      pairs.forEach(function (pair) {
        var i = pair.indexOf('=');
        if (i < 0) return;
        var attr = pair.slice(0, i);
        var enVal = pair.slice(i + 1);
        var storeAttr = 'data-emx-orig-' + attr;
        if (!el.hasAttribute(storeAttr)) el.setAttribute(storeAttr, el.getAttribute(attr) || '');
        el.setAttribute(attr, lang === 'en' ? enVal : el.getAttribute(storeAttr));
      });
    });

    document.querySelectorAll('[data-lang-btn]').forEach(function (b) {
      var active = b.dataset.langBtn === lang;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    try { localStorage.setItem('emx-lang', lang); } catch (e) {}
    document.cookie = 'emx-lang=' + lang + ';path=/;max-age=' + (60 * 60 * 24 * 365) + ';SameSite=Lax';
  }
})();
