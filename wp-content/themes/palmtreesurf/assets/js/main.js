/**
 * Palm Tree Surf — front-end behaviour.
 *
 * Five independent modules, each a progressive enhancement. Everything works
 * without JavaScript: the header renders solid, the menu is a plain list, all
 * content is visible, gallery images open nothing, and the map shows its
 * facade. See VISUAL-SPEC.md section 7.
 */
( function () {
	'use strict';

	var strings = window.ptL10n || {};
	var reduceMotion = window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;

	/* ---------------------------------------------- Header stick on scroll */

	function initHeader() {
		var header = document.getElementById( 'masthead' );
		var sentinel = document.querySelector( '.header-sentinel' );

		// Interior pages ship .is-stuck from PHP; nothing to observe.
		if ( ! header || ! sentinel || header.classList.contains( 'is-static' ) ) {
			return;
		}

		if ( ! ( 'IntersectionObserver' in window ) ) {
			header.classList.add( 'is-stuck' );
			return;
		}

		// A sentinel observer rather than a scroll listener, so there is no
		// per-frame work and no re-trigger loop around the threshold.
		new IntersectionObserver( function ( entries ) {
			header.classList.toggle( 'is-stuck', ! entries[ 0 ].isIntersecting );
		}, { rootMargin: '-80px 0px 0px 0px' } ).observe( sentinel );
	}

	/* ------------------------------------------------------- Mobile menu */

	function initMenu() {
		var toggle = document.querySelector( '.menu-toggle' );
		var nav = document.querySelector( '.site-nav' );

		if ( ! toggle || ! nav ) {
			return;
		}

		var scrollY = 0;

		function focusable() {
			return Array.prototype.filter.call(
				nav.querySelectorAll( 'a[href], button:not([disabled])' ),
				function ( el ) {
					return el.offsetParent !== null;
				}
			);
		}

		function open() {
			scrollY = window.scrollY;
			nav.classList.add( 'is-open' );
			document.body.classList.add( 'menu-open' );
			// Preserve scroll position rather than letting the page jump to top.
			document.body.style.top = '-' + scrollY + 'px';
			toggle.setAttribute( 'aria-expanded', 'true' );

			var first = focusable()[ 0 ];
			if ( first ) {
				first.focus();
			}
		}

		function close() {
			nav.classList.remove( 'is-open' );
			document.body.classList.remove( 'menu-open' );
			document.body.style.top = '';
			window.scrollTo( 0, scrollY );
			toggle.setAttribute( 'aria-expanded', 'false' );
			toggle.focus();
		}

		toggle.addEventListener( 'click', function () {
			if ( nav.classList.contains( 'is-open' ) ) {
				close();
			} else {
				open();
			}
		} );

		document.addEventListener( 'keydown', function ( event ) {
			if ( ! nav.classList.contains( 'is-open' ) ) {
				return;
			}

			if ( 'Escape' === event.key ) {
				close();
				return;
			}

			if ( 'Tab' !== event.key ) {
				return;
			}

			// Trap focus inside the overlay while it is open.
			var items = focusable();
			if ( ! items.length ) {
				return;
			}

			var first = items[ 0 ];
			var last = items[ items.length - 1 ];

			if ( event.shiftKey && document.activeElement === first ) {
				event.preventDefault();
				last.focus();
			} else if ( ! event.shiftKey && document.activeElement === last ) {
				event.preventDefault();
				first.focus();
			}
		} );

		// Submenu disclosures on touch/small screens.
		Array.prototype.forEach.call( nav.querySelectorAll( '.nav__toggle' ), function ( button ) {
			button.addEventListener( 'click', function () {
				var item = button.closest( '.nav__item' );
				if ( ! item ) {
					return;
				}
				var isOpen = item.classList.toggle( 'is-open' );
				button.setAttribute( 'aria-expanded', isOpen ? 'true' : 'false' );
			} );
		} );
	}

	/* ------------------------------------------------------ Scroll reveal */

	function initReveal() {
		var targets = document.querySelectorAll( '[data-reveal]' );

		if ( ! targets.length || reduceMotion || ! ( 'IntersectionObserver' in window ) ) {
			return;
		}

		// Opt in only once we know we can animate, so no-JS keeps content visible.
		document.documentElement.classList.add( 'reveal-ready' );

		var observer = new IntersectionObserver( function ( entries ) {
			entries.forEach( function ( entry ) {
				if ( ! entry.isIntersecting ) {
					return;
				}

				var el = entry.target;
				var group = el.closest( '[data-reveal-group]' );
				var delay = 0;

				if ( group ) {
					var siblings = Array.prototype.slice.call( group.querySelectorAll( '[data-reveal]' ) );
					delay = Math.max( 0, siblings.indexOf( el ) ) * 60;
				}

				setTimeout( function () {
					el.classList.add( 'is-visible' );
				}, delay );

				// Reveal once, never again on the way back up.
				observer.unobserve( el );
			} );
		}, { threshold: 0.15, rootMargin: '0px 0px -80px 0px' } );

		Array.prototype.forEach.call( targets, function ( el ) {
			observer.observe( el );
		} );
	}

	/* ---------------------------------------------------------- Lightbox */

	function initLightbox() {
		var gallery = document.querySelector( '[data-pt-gallery]' );

		if ( ! gallery || typeof HTMLDialogElement === 'undefined' ) {
			return;
		}

		var triggers = Array.prototype.slice.call( gallery.querySelectorAll( '[data-pt-lightbox]' ) );
		var sources = triggers.map( function ( trigger ) {
			var img = trigger.querySelector( 'img' );
			return img ? { src: img.currentSrc || img.src, alt: img.alt } : null;
		} );

		// Placeholder-only galleries have nothing to enlarge.
		if ( ! sources.filter( Boolean ).length ) {
			return;
		}

		var index = 0;
		var opener = null;

		var dialog = document.createElement( 'dialog' );
		dialog.className = 'lightbox';
		dialog.innerHTML =
			'<figure class="lightbox__figure"><img alt="" /></figure>' +
			'<button class="lightbox__close" type="button" aria-label="' + ( strings.close || 'Close' ) + '">&times;</button>' +
			'<button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="' + ( strings.prev || 'Previous' ) + '">&#8249;</button>' +
			'<button class="lightbox__nav lightbox__nav--next" type="button" aria-label="' + ( strings.next || 'Next' ) + '">&#8250;</button>' +
			'<p class="lightbox__count" aria-live="polite"></p>';
		document.body.appendChild( dialog );

		var image = dialog.querySelector( 'img' );
		var count = dialog.querySelector( '.lightbox__count' );

		function show( next ) {
			var total = sources.length;
			index = ( next + total ) % total;

			var item = sources[ index ];
			if ( ! item ) {
				return;
			}

			image.src = item.src;
			image.alt = item.alt || '';
			count.textContent = ( index + 1 ) + ' / ' + total;

			// Preload only the neighbours.
			[ index - 1, index + 1 ].forEach( function ( neighbour ) {
				var near = sources[ ( neighbour + total ) % total ];
				if ( near ) {
					var pre = new Image();
					pre.src = near.src;
				}
			} );
		}

		triggers.forEach( function ( trigger, i ) {
			trigger.addEventListener( 'click', function () {
				opener = trigger;
				show( i );
				dialog.showModal();
			} );
		} );

		dialog.querySelector( '.lightbox__close' ).addEventListener( 'click', function () {
			dialog.close();
		} );

		dialog.querySelector( '.lightbox__nav--prev' ).addEventListener( 'click', function () {
			show( index - 1 );
		} );

		dialog.querySelector( '.lightbox__nav--next' ).addEventListener( 'click', function () {
			show( index + 1 );
		} );

		dialog.addEventListener( 'keydown', function ( event ) {
			if ( 'ArrowLeft' === event.key ) {
				show( index - 1 );
			} else if ( 'ArrowRight' === event.key ) {
				show( index + 1 );
			}
		} );

		// Return focus to whatever opened it.
		dialog.addEventListener( 'close', function () {
			if ( opener ) {
				opener.focus();
				opener = null;
			}
		} );
	}

	/* -------------------------------------------------------- Map facade */

	function initMap() {
		var facade = document.querySelector( '.map-facade[data-pt-map-src]' );

		if ( ! facade ) {
			return;
		}

		var button = facade.querySelector( '[data-pt-map-load]' );

		if ( ! button ) {
			return;
		}

		button.addEventListener( 'click', function () {
			var iframe = document.createElement( 'iframe' );
			iframe.src = facade.getAttribute( 'data-pt-map-src' );
			iframe.loading = 'lazy';
			iframe.title = strings.map || 'Map';
			iframe.setAttribute( 'referrerpolicy', 'no-referrer-when-downgrade' );
			iframe.allowFullscreen = true;

			facade.innerHTML = '';
			facade.appendChild( iframe );
		} );
	}

	function boot() {
		initHeader();
		initMenu();
		initReveal();
		initLightbox();
		initMap();
	}

	if ( 'loading' === document.readyState ) {
		document.addEventListener( 'DOMContentLoaded', boot );
	} else {
		boot();
	}
}() );
