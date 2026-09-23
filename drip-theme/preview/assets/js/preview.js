/* Preview only (not part of the theme): there is no WordPress behind the
   static preview, so bag and form actions show what would happen instead. */
(function () {
	var bag = 0;
	var toast = document.createElement('div');
	toast.setAttribute('role', 'status');
	toast.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translate(-50%,20px);z-index:99;max-width:min(92vw,440px);padding:14px 18px;border-radius:3px;background:#08090b;color:#f3f4f1;border:1px solid rgba(255,255,255,.15);box-shadow:0 20px 50px -10px rgba(0,0,0,.5);font:500 14px/1.45 Inter,system-ui,sans-serif;opacity:0;transition:.35s cubic-bezier(.2,.7,.1,1);pointer-events:none';
	document.body.appendChild(toast);
	var timer;
	function say(msg) {
		toast.innerHTML = msg;
		toast.style.opacity = '1';
		toast.style.transform = 'translate(-50%,0)';
		clearTimeout(timer);
		timer = setTimeout(function () { toast.style.opacity = '0'; toast.style.transform = 'translate(-50%,20px)'; }, 3200);
	}
	function added(name) {
		bag++;
		var c = document.querySelector('.bag-count');
		if (c) {
			c.textContent = bag;
			c.classList.remove('is-empty', 'bump');
			void c.offsetWidth;
			c.classList.add('bump');
		}
		say('<b>' + name + '</b> added to bag.<br><span style="opacity:.6">Preview: once the theme is live this is your real WooCommerce cart.</span>');
	}
	document.addEventListener('click', function (e) {
		var a = e.target.closest('.add_to_cart_button');
		if (!a) { return; }
		e.preventDefault();
		var t = a.closest('.card').querySelector('.card-title');
		a.classList.add('added');
		added(t ? t.textContent.trim() : 'Item');
	});
	document.addEventListener('submit', function (e) {
		var f = e.target;
		e.preventDefault();
		if (f.classList.contains('cart')) {
			var t = document.querySelector('.pdp-title');
			added(t ? t.textContent.trim() : 'Item');
		} else if (f.classList.contains('join-form') || f.classList.contains('contact-form')) {
			say('Preview only: once the theme is installed, this form emails the store admin.');
		}
	});
}());
