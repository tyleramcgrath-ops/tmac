/**
 * NetworkIP header: mobile menu toggle and solid header on scroll.
 */
( function () {
	'use strict';

	var header = document.getElementById( 'site-header' );
	if ( ! header ) {
		return;
	}
	var toggle = header.querySelector( '.nip-menu-toggle' );
	var nav = document.getElementById( 'site-navigation' );
	var mq = window.matchMedia( '(max-width: 1180px)' );

	function focusables() {
		return Array.prototype.slice.call( nav.querySelectorAll( 'a[href], button:not([disabled])' ) );
	}

	function setOpen( open, returnFocus ) {
		toggle.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
		nav.classList.toggle( 'is-open', open );
		header.classList.toggle( 'is-open', open );
		document.body.classList.toggle( 'nip-menu-open', open );
		if ( open ) {
			var items = focusables();
			if ( items.length ) {
				items[ 0 ].focus();
			}
		} else if ( returnFocus ) {
			toggle.focus();
		}
	}

	function isOpen() {
		return toggle.getAttribute( 'aria-expanded' ) === 'true';
	}

	if ( toggle && nav ) {
		toggle.addEventListener( 'click', function () {
			setOpen( ! isOpen(), false );
		} );

		document.addEventListener( 'keydown', function ( e ) {
			if ( ! isOpen() ) {
				return;
			}
			if ( e.key === 'Escape' ) {
				setOpen( false, true );
				return;
			}
			// Keep Tab focus inside the open menu and its toggle.
			if ( e.key === 'Tab' ) {
				var items = [ toggle ].concat( focusables() );
				var first = items[ 0 ];
				var last = items[ items.length - 1 ];
				if ( e.shiftKey && document.activeElement === first ) {
					e.preventDefault();
					last.focus();
				} else if ( ! e.shiftKey && document.activeElement === last ) {
					e.preventDefault();
					first.focus();
				}
			}
		} );

		nav.addEventListener( 'click', function ( e ) {
			if ( e.target.closest( 'a' ) && isOpen() ) {
				setOpen( false, false );
			}
		} );

		var onChange = function () {
			if ( ! mq.matches && isOpen() ) {
				setOpen( false, false );
			}
		};
		if ( mq.addEventListener ) {
			mq.addEventListener( 'change', onChange );
		} else if ( mq.addListener ) {
			mq.addListener( onChange );
		}
	}

	if ( document.body.classList.contains( 'has-hero-header' ) ) {
		var ticking = false;
		var update = function () {
			header.classList.toggle( 'is-scrolled', window.scrollY > 24 );
			ticking = false;
		};
		window.addEventListener( 'scroll', function () {
			if ( ! ticking ) {
				ticking = true;
				window.requestAnimationFrame( update );
			}
		}, { passive: true } );
		update();
	}
}() );
