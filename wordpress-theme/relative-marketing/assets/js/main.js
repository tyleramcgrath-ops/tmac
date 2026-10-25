/* RMA theme — interactions */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    // Mobile nav toggle
    var toggle = document.querySelector('.nav-toggle');
    var panel = document.querySelector('.mobile-nav');
    if (toggle && panel) {
      toggle.addEventListener('click', function () {
        panel.classList.toggle('open');
      });
      panel.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { panel.classList.remove('open'); });
      });
    }

    // FAQ accordion
    document.querySelectorAll('.faq-q').forEach(function (q) {
      q.addEventListener('click', function () {
        var item = q.closest('.faq-item');
        if (item) { item.classList.toggle('open'); }
      });
    });

    // Filter pills (visual toggle only)
    document.querySelectorAll('.filters').forEach(function (group) {
      group.querySelectorAll('.filter-pill').forEach(function (pill) {
        pill.addEventListener('click', function () {
          group.querySelectorAll('.filter-pill').forEach(function (p) { p.classList.remove('active'); });
          pill.classList.add('active');
        });
      });
    });
  });
})();
