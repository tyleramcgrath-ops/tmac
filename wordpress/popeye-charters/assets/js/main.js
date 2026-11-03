/* Popeye Charters — front-end behaviour (no dependencies). */
(function () {
	'use strict';

	var body = document.body;
	var header = document.getElementById('site-header');

	// Transparent header when the page starts with a full-bleed hero.
	var main = document.getElementById('main');
	if (main && main.firstElementChild && main.firstElementChild.classList.contains('hero')) {
		body.classList.add('has-hero-top');
	}

	// Scroll state: solid header, back-to-top, sticky booking bar.
	var toTop = document.querySelector('.to-top');
	var bar = document.querySelector('.sticky-bar');
	var ticking = false;
	function onScroll() {
		var y = window.scrollY || window.pageYOffset;
		if (header) header.classList.toggle('is-scrolled', y > 40);
		if (toTop) toTop.classList.toggle('is-visible', y > 600);
		if (bar) bar.classList.toggle('is-visible', y > 500);
		ticking = false;
	}
	window.addEventListener('scroll', function () {
		if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
	}, { passive: true });
	onScroll();
	if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

	// Mobile nav.
	var toggle = document.querySelector('.nav-toggle');
	if (toggle) {
		toggle.addEventListener('click', function () {
			var open = body.classList.toggle('nav-open');
			toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
		});
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && body.classList.contains('nav-open')) {
				body.classList.remove('nav-open');
				toggle.setAttribute('aria-expanded', 'false');
				toggle.focus();
			}
		});
	}

	// Submenu toggles.
	document.querySelectorAll('.submenu-toggle').forEach(function (btn) {
		btn.addEventListener('click', function (e) {
			e.preventDefault();
			var li = btn.closest('li');
			var open = li.classList.toggle('is-open');
			btn.setAttribute('aria-expanded', open ? 'true' : 'false');
		});
	});
	document.addEventListener('click', function (e) {
		if (!e.target.closest('.menu-item-has-children')) {
			document.querySelectorAll('.site-nav .menu-item-has-children.is-open').forEach(function (li) {
				if (window.innerWidth > 1080) {
					li.classList.remove('is-open');
					var b = li.querySelector('.submenu-toggle');
					if (b) b.setAttribute('aria-expanded', 'false');
				}
			});
		}
	});

	// Gallery filters.
	document.querySelectorAll('.filters').forEach(function (bar) {
		var grid = bar.nextElementSibling;
		bar.addEventListener('click', function (e) {
			var btn = e.target.closest('.filter');
			if (!btn || !grid) return;
			var f = btn.getAttribute('data-filter');
			bar.querySelectorAll('.filter').forEach(function (b) {
				b.classList.toggle('is-active', b === btn);
				b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
			});
			grid.querySelectorAll('.photo').forEach(function (p) {
				p.classList.toggle('is-hidden', f !== 'all' && p.getAttribute('data-cat') !== f);
			});
		});
	});

	// FAQ: only one open at a time.
	document.querySelectorAll('.faq').forEach(function (faq) {
		faq.addEventListener('toggle', function (e) {
			if (e.target.open) {
				faq.querySelectorAll('details[open]').forEach(function (d) { if (d !== e.target) d.open = false; });
			}
		}, true);
	});

	// Lightbox for [data-lightbox] containers.
	var links = [];
	var current = 0;
	var box, img, cap;
	function build() {
		box = document.createElement('div');
		box.className = 'lightbox';
		box.setAttribute('role', 'dialog');
		box.setAttribute('aria-modal', 'true');
		box.setAttribute('aria-label', 'Image viewer');
		box.innerHTML = '<button class="lightbox__close" aria-label="Close">&times;</button>' +
			'<button class="lightbox__prev" aria-label="Previous">&#8249;</button>' +
			'<figure><img alt=""><figcaption></figcaption></figure>' +
			'<button class="lightbox__next" aria-label="Next">&#8250;</button>';
		document.body.appendChild(box);
		img = box.querySelector('img');
		cap = box.querySelector('figcaption');
		box.addEventListener('click', function (e) {
			if (e.target === box || e.target.closest('.lightbox__close')) close();
			else if (e.target.closest('.lightbox__prev')) show(current - 1);
			else if (e.target.closest('.lightbox__next')) show(current + 1);
		});
		document.addEventListener('keydown', function (e) {
			if (!box.classList.contains('is-open')) return;
			if (e.key === 'Escape') close();
			if (e.key === 'ArrowLeft') show(current - 1);
			if (e.key === 'ArrowRight') show(current + 1);
		});
	}
	function visibleLinks(group) {
		return Array.prototype.filter.call(group.querySelectorAll('a[href]'), function (a) {
			return !a.closest('.is-hidden');
		});
	}
	function show(i) {
		if (!links.length) return;
		current = (i + links.length) % links.length;
		var a = links[current];
		img.src = a.getAttribute('href');
		img.alt = a.getAttribute('data-caption') || '';
		cap.textContent = a.getAttribute('data-caption') || '';
	}
	function close() {
		box.classList.remove('is-open');
		document.documentElement.style.overflow = '';
	}
	document.addEventListener('click', function (e) {
		var a = e.target.closest('[data-lightbox] a[href]');
		if (!a || e.metaKey || e.ctrlKey) return;
		e.preventDefault();
		if (!box) build();
		links = visibleLinks(a.closest('[data-lightbox]'));
		show(links.indexOf(a));
		box.classList.add('is-open');
		document.documentElement.style.overflow = 'hidden';
		box.querySelector('.lightbox__close').focus();
	});
})();
