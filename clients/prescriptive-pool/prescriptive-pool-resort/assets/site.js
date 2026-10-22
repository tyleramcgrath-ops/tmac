(function () {
	var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

	/* Header: compact bar once the page scrolls */
	var header = document.querySelector('.site-header');
	if (header) {
		var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 40); };
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
	}

	/* Mobile menu */
	var toggle = document.querySelector('.menu-toggle');
	var nav = document.getElementById('site-nav');
	if (toggle && nav) {
		var setOpen = function (open) {
			toggle.setAttribute('aria-expanded', String(open));
			document.body.classList.toggle('nav-open', open);
		};
		toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
		});
		nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
	}

	if (reduceMotion || !('IntersectionObserver' in window)) { return; }

	/* Reveal sections as they scroll into view, staggered within each group */
	document.documentElement.classList.add('js');
	var groups = [
		'.owner-copy > *', '.section-head', '.services-intro', '.service-card', '.offer-panel > *',
		'.inclusion-grid article', '.steps li', '.area-grid article', '.split-copy', '.split-media',
		'.quote-info', '.quote-form', '.faq details', '.nearby-grid > *', '.cta-band h2', '.footer-main > *'
	];
	groups.forEach(function (selector) {
		document.querySelectorAll(selector).forEach(function (el, i) {
			el.setAttribute('data-reveal', '');
			el.style.setProperty('--delay', Math.min(i, 6) * 0.09 + 's');
		});
	});
	var revealer = new IntersectionObserver(function (entries) {
		entries.forEach(function (entry) {
			if (!entry.isIntersecting) { return; }
			entry.target.classList.add('is-in');
			revealer.unobserve(entry.target);
			var counter = entry.target.querySelector('[data-count]');
			if (counter) { countUp(counter); }
		});
	}, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
	document.querySelectorAll('[data-reveal]').forEach(function (el) { revealer.observe(el); });

	/* Price counts up when it appears */
	function countUp(el) {
		var target = parseFloat(el.getAttribute('data-count'));
		if (!isFinite(target)) { return; }
		var start = performance.now();
		var duration = 1400;
		(function frame(now) {
			var t = Math.min(1, (now - start) / duration);
			el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
			if (t < 1) { requestAnimationFrame(frame); }
		})(start);
	}

	/* Service cards tilt toward the cursor, with light following it */
	if (finePointer) {
		document.querySelectorAll('.service-card').forEach(function (card) {
			card.addEventListener('pointermove', function (e) {
				var r = card.getBoundingClientRect();
				var x = (e.clientX - r.left) / r.width;
				var y = (e.clientY - r.top) / r.height;
				card.classList.add('is-tilting');
				card.style.setProperty('--ry', (x - 0.5) * 14 + 'deg');
				card.style.setProperty('--rx', (0.5 - y) * 10 + 'deg');
				card.style.setProperty('--gx', x * 100 + '%');
				card.style.setProperty('--gy', y * 100 + '%');
			});
			card.addEventListener('pointerleave', function () {
				card.classList.remove('is-tilting');
				card.style.setProperty('--rx', '0deg');
				card.style.setProperty('--ry', '0deg');
			});
		});
	}

	/* Tap the water: ripples spread from the point you touched */
	document.querySelectorAll('[data-ripple]').forEach(function (area) {
		area.addEventListener('pointerdown', function (e) {
			if (e.target.closest('a, button')) { return; }
			var r = area.getBoundingClientRect();
			for (var i = 0; i < 2; i++) {
				var ring = document.createElement('span');
				ring.className = 'ripple';
				ring.style.left = e.clientX - r.left + 'px';
				ring.style.top = e.clientY - r.top + 'px';
				area.appendChild(ring);
				ring.addEventListener('animationend', function () { this.remove(); });
			}
		});
	});
})();
