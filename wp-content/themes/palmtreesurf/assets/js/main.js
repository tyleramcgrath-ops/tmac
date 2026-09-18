/**
 * Palm Tree Surf — front-end behaviour.
 *
 * Two jobs only: the mobile menu toggle and the submenu disclosures. Both are
 * progressive enhancements; every link still works with JavaScript disabled.
 */
( function () {
	'use strict';

	var strings = window.ptsL10n || { openMenu: 'Open menu', closeMenu: 'Close menu' };

	function setupMenuToggle() {
		var toggle = document.querySelector( '.menu-toggle' );
		var nav = document.querySelector( '.site-nav' );

		if ( ! toggle || ! nav ) {
			return;
		}

		toggle.addEventListener( 'click', function () {
			var isOpen = nav.classList.toggle( 'is-open' );
			var label = toggle.querySelector( '.screen-reader-text' );

			toggle.setAttribute( 'aria-expanded', isOpen ? 'true' : 'false' );

			if ( label ) {
				label.textContent = isOpen ? strings.closeMenu : strings.openMenu;
			}
		} );

		// Close the menu when focus leaves it, so keyboard users are not trapped.
		document.addEventListener( 'keydown', function ( event ) {
			if ( 'Escape' === event.key && nav.classList.contains( 'is-open' ) ) {
				nav.classList.remove( 'is-open' );
				toggle.setAttribute( 'aria-expanded', 'false' );
				toggle.focus();
			}
		} );
	}

	function setupSubmenus() {
		var toggles = document.querySelectorAll( '.nav__toggle' );

		Array.prototype.forEach.call( toggles, function ( toggle ) {
			toggle.addEventListener( 'click', function () {
				var item = toggle.closest( '.nav__item' );

				if ( ! item ) {
					return;
				}

				var isOpen = item.classList.toggle( 'is-open' );
				toggle.setAttribute( 'aria-expanded', isOpen ? 'true' : 'false' );
			} );
		} );
	}

	if ( 'loading' === document.readyState ) {
		document.addEventListener( 'DOMContentLoaded', function () {
			setupMenuToggle();
			setupSubmenus();
		} );
	} else {
		setupMenuToggle();
		setupSubmenus();
	}
}() );
