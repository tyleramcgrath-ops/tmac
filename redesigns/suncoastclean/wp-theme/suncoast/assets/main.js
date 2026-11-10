// Mobile menu toggle. Everything else on the site is plain HTML and CSS.
(function () {
  var btn = document.querySelector('.menu-btn');
  var menu = document.getElementById('mmenu');
  if (!btn || !menu) return;
  btn.addEventListener('click', function () {
    var open = menu.hidden;
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
})();
