(function () {
	var header = document.querySelector('.site-header');
	var toggle = document.querySelector('.menu-toggle');
	var nav = document.getElementById('site-nav');
	if (header) {
		var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 40); };
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
	}
	if (!toggle || !nav) { return; }
	var setOpen = function (open) {
		toggle.setAttribute('aria-expanded', String(open));
		document.body.classList.toggle('nav-open', open);
	};
	toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
	});
	nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
})();
