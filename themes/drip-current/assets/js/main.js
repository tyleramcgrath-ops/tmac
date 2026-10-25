/* DRIP Current — header, menus, search, reveal-on-scroll. */
( function () {
	'use strict';

	var header = document.getElementById( 'site-header' );
	if ( ! header ) {
		return;
	}

	// Transparent header over the hero turns solid once the page scrolls.
	var onScroll = function () {
		header.classList.toggle( 'is-scrolled', window.scrollY > 24 );
	};
	onScroll();
	window.addEventListener( 'scroll', onScroll, { passive: true } );

	// Mobile menu.
	var menuToggle = header.querySelector( '.menu-toggle' );
	if ( menuToggle ) {
		menuToggle.addEventListener( 'click', function () {
			var open = header.classList.toggle( 'is-open' );
			menuToggle.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
			document.body.style.overflow = open ? 'hidden' : '';
		} );
	}

	// Submenu toggles (click / tap; hover handles desktop pointers).
	header.querySelectorAll( '.submenu-toggle' ).forEach( function ( button ) {
		button.addEventListener( 'click', function ( event ) {
			event.preventDefault();
			var item = button.closest( 'li' );
			var open = item.classList.toggle( 'is-open' );
			button.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
		} );
	} );

	// Search panel.
	var searchToggle = header.querySelector( '.search-toggle' );
	var searchPanel = document.getElementById( 'search-panel' );
	if ( searchToggle && searchPanel ) {
		searchToggle.addEventListener( 'click', function () {
			var open = searchPanel.hasAttribute( 'hidden' );
			if ( open ) {
				searchPanel.removeAttribute( 'hidden' );
				header.classList.add( 'is-scrolled' );
				var input = searchPanel.querySelector( 'input[type="search"]' );
				if ( input ) {
					input.focus();
				}
			} else {
				searchPanel.setAttribute( 'hidden', '' );
				onScroll();
			}
			searchToggle.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
		} );
	}

	document.addEventListener( 'keydown', function ( event ) {
		if ( 'Escape' !== event.key ) {
			return;
		}
		if ( searchPanel && ! searchPanel.hasAttribute( 'hidden' ) ) {
			searchPanel.setAttribute( 'hidden', '' );
			searchToggle.setAttribute( 'aria-expanded', 'false' );
			searchToggle.focus();
			onScroll();
		}
		header.querySelectorAll( '.menu-item-has-children.is-open' ).forEach( function ( item ) {
			item.classList.remove( 'is-open' );
		} );
		if ( header.classList.contains( 'is-open' ) && menuToggle ) {
			menuToggle.click();
		}
	} );

	// Gentle fade-up for homepage sections and product cards.
	if ( 'IntersectionObserver' in window && ! window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ) {
		var targets = document.querySelectorAll( '.tee-edit .section-title, .tee-card, .story-band__copy, .line-band > *' );
		var observer = new IntersectionObserver( function ( entries ) {
			entries.forEach( function ( entry ) {
				if ( entry.isIntersecting ) {
					entry.target.classList.add( 'is-visible' );
					observer.unobserve( entry.target );
				}
			} );
		}, { rootMargin: '0px 0px -8% 0px' } );
		targets.forEach( function ( el, i ) {
			el.classList.add( 'reveal' );
			el.style.transitionDelay = ( i % 3 ) * 90 + 'ms';
			observer.observe( el );
		} );
	}
}() );
