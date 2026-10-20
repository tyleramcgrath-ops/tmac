/* DRIP Clothing Co. — small, dependency-free front-end behaviour. */
(function () {
	'use strict';

	var doc = document.documentElement;

	// Header: a hairline once the page scrolls.
	var header = document.querySelector('[data-header]');
	if (header) {
		var onScroll = function () {
			header.classList.toggle('is-scrolled', window.scrollY > 8);
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
	}

	// Mobile menu.
	var toggle = document.querySelector('[data-nav-toggle]');
	if (toggle) {
		var setOpen = function (open) {
			if (open && header) {
				doc.style.setProperty('--nav-top', header.getBoundingClientRect().bottom + 'px');
			}
			toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
			doc.classList.toggle('nav-open', open);
		};
		toggle.addEventListener('click', function () {
			setOpen(toggle.getAttribute('aria-expanded') !== 'true');
		});
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape') { setOpen(false); }
		});
		window.addEventListener('resize', function () {
			if (window.innerWidth > 900) { setOpen(false); }
		});
	}

	// Reveal on scroll. A position check backs up the observer so fast
	// scrolling (or a missed callback) can never leave content hidden.
	var pending = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
	pending.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + 'ms'; });
	var show = function (el) {
		el.classList.add('is-in');
		pending.splice(pending.indexOf(el), 1);
	};
	var sweep = function () {
		var limit = window.innerHeight * 0.95;
		pending.slice().forEach(function (el) {
			if (el.getBoundingClientRect().top < limit) { show(el); }
		});
	};
	if ('IntersectionObserver' in window) {
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting && pending.indexOf(entry.target) > -1) { show(entry.target); io.unobserve(entry.target); }
			});
		}, { rootMargin: '0px 0px -5% 0px' });
		pending.forEach(function (el) { io.observe(el); });
	}
	var ticking = false;
	window.addEventListener('scroll', function () {
		if (ticking || !pending.length) { return; }
		ticking = true;
		window.requestAnimationFrame(function () { ticking = false; sweep(); });
	}, { passive: true });
	window.addEventListener('load', sweep);
	sweep();

	// Color filter chips (homepage drop + shop). ?tone=black|white preselects.
	document.querySelectorAll('[data-tone-filter]').forEach(function (group) {
		var grid = document.getElementById(group.getAttribute('data-tone-filter'));
		if (!grid) { return; }
		var empty = grid.parentNode.querySelector('.tone-empty');
		var apply = function (tone) {
			var shown = 0;
			group.querySelectorAll('.chip').forEach(function (chip) {
				var on = chip.getAttribute('data-tone') === tone;
				chip.classList.toggle('is-on', on);
				chip.setAttribute('aria-pressed', on ? 'true' : 'false');
			});
			grid.querySelectorAll('.card').forEach(function (card) {
				var match = tone === 'all' || card.getAttribute('data-tone') === tone;
				card.hidden = !match;
				var li = card.closest('li');
				if (li) { li.hidden = !match; }
				if (match) { shown++; card.classList.add('is-in'); }
			});
			if (empty) { empty.hidden = shown > 0; }
		};
		group.addEventListener('click', function (e) {
			var chip = e.target.closest('.chip');
			if (chip) { apply(chip.getAttribute('data-tone')); }
		});
		var param = new URLSearchParams(window.location.search).get('tone');
		if (param === 'black' || param === 'white') { apply(param); }
	});

	// Product gallery.
	document.querySelectorAll('[data-gallery]').forEach(function (gallery) {
		var frames = gallery.querySelectorAll('[data-frame]');
		var thumbs = gallery.querySelectorAll('[data-show]');
		thumbs.forEach(function (thumb) {
			thumb.addEventListener('click', function () {
				var n = thumb.getAttribute('data-show');
				frames.forEach(function (f) { f.classList.toggle('is-on', f.getAttribute('data-frame') === n); });
				thumbs.forEach(function (t) { t.classList.toggle('is-on', t === thumb); });
			});
		});
	});

	// Quantity steppers around WooCommerce's number input.
	var addSteppers = function (root) {
		root.querySelectorAll('.pdp-buy .quantity').forEach(function (q) {
			if (q.dataset.stepper) { return; }
			var input = q.querySelector('input.qty');
			if (!input || input.type === 'hidden') { return; }
			q.dataset.stepper = '1';
			var make = function (label, delta, glyph) {
				var b = document.createElement('button');
				b.type = 'button';
				b.className = 'qty-btn';
				b.setAttribute('aria-label', label);
				b.innerHTML = glyph;
				b.addEventListener('click', function () {
					var min = parseFloat(input.min) || 1;
					var max = parseFloat(input.max) || Infinity;
					var v = (parseFloat(input.value) || min) + delta;
					input.value = Math.max(min, Math.min(max, v));
					input.dispatchEvent(new Event('change', { bubbles: true }));
				});
				return b;
			};
			q.insertBefore(make('Decrease quantity', -1, '&minus;'), input);
			q.appendChild(make('Increase quantity', 1, '+'));
		});
	};
	addSteppers(document);

	// Bump the bag count after an AJAX add-to-cart (WooCommerce fires this via jQuery).
	if (window.jQuery) {
		window.jQuery(document.body).on('added_to_cart', function () {
			var c = document.querySelector('.bag-count');
			if (!c) { return; }
			c.classList.remove('bump');
			void c.offsetWidth;
			c.classList.add('bump');
		});
	}
}());
