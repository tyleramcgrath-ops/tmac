/* Comfy Humans Cloud: drifting clouds, gentle parallax and the mood filter. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- floating clouds ----
  var presets = {
    back:  { count: 6, min: 120, max: 220, speed: [110, 160], opacity: .55, top: [2, 70] },
    mid:   { count: 5, min: 160, max: 300, speed: [80, 120],  opacity: .75, top: [0, 85] },
    front: { count: 3, min: 280, max: 460, speed: [55, 80],   opacity: .95, top: [78, 96] }
  };
  var seed = 11;
  function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  function between(a, b) { return a + (b - a) * rnd(); }
  function makeCloud(w) {
    var c = document.createElement('div'); c.className = 'cloud';
    var p = document.createElement('div'); p.className = 'puffs';
    var h = w * 0.5; p.style.width = w + 'px'; p.style.height = h + 'px';
    var n = 4 + Math.floor(rnd() * 3);
    for (var i = 0; i < n; i++) {
      var s = w * between(.32, .56), x = (i / (n - 1)) * (w - s), y = h - s * between(.7, 1.05);
      var b = document.createElement('i');
      b.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + x + 'px;top:' + y + 'px';
      p.appendChild(b);
    }
    c.appendChild(p); return c;
  }
  document.querySelectorAll('[data-clouds]').forEach(function (layer) {
    var cfg = presets[layer.dataset.clouds];
    if (!cfg) return;
    for (var i = 0; i < cfg.count; i++) {
      var w = between(cfg.min, cfg.max), c = makeCloud(w), dur = between(cfg.speed[0], cfg.speed[1]);
      c.style.top = between(cfg.top[0], cfg.top[1]) + '%';
      c.style.opacity = cfg.opacity;
      c.style.setProperty('--from', (-w - 40) + 'px');
      c.style.setProperty('--to', 'calc(100vw + 40px)');
      c.style.animationDuration = dur + 's';
      // Negative delay so clouds are already spread across the sky at first paint.
      c.style.animationDelay = (-dur * ((i + rnd()) / cfg.count)) + 's';
      if (reduce) { c.style.transform = 'translateX(' + between(-5, 90) + 'vw)'; }
      layer.appendChild(c);
    }
  });

  // ---- gentle parallax with the pointer ----
  if (!reduce) {
    var layers = document.querySelectorAll('[data-depth]');
    window.addEventListener('pointermove', function (e) {
      var dx = (e.clientX / window.innerWidth - .5), dy = (e.clientY / window.innerHeight - .5);
      layers.forEach(function (l) { var d = +l.dataset.depth; l.style.transform = 'translate(' + (-dx * 28 * d) + 'px,' + (-dy * 14 * d) + 'px)'; });
    }, { passive: true });
  }

  // ---- mood filter on the home page ----
  var tabs = document.querySelectorAll('[data-mood]');
  var cards = document.querySelectorAll('#products .product');
  tabs.forEach(function (b) {
    b.addEventListener('click', function () {
      var mood = b.dataset.mood;
      tabs.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      cards.forEach(function (card) {
        var moods = (card.dataset.moods || '').split(' ');
        card.hidden = !!mood && moods.indexOf(mood) === -1;
      });
    });
  });
})();
