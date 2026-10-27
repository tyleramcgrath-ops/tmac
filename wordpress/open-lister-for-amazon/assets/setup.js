/* Setup wizard: keeps Seller Central links on the chosen marketplace and
 * fills the credential fields from whatever is pasted. Mirrors OLA_Setup::parse(). */
( function () {
	'use strict';

	var marketplace = document.getElementById( 'ola-setup-marketplace' );
	var paste = document.getElementById( 'ola-setup-paste' );
	if ( ! marketplace || ! paste ) {
		return;
	}

	var marketplaceIds = Array.prototype.map.call( marketplace.options, function ( o ) {
		return o.value;
	} );

	function updateLinks() {
		var domain = marketplace.options[ marketplace.selectedIndex ].getAttribute( 'data-domain' );
		document.querySelectorAll( '.ola-sc-link' ).forEach( function ( link ) {
			link.href = 'https://' + domain + link.getAttribute( 'data-path' );
		} );
	}

	function parse( text ) {
		var found = {};
		var patterns = {
			client_id: /amzn1\.application-oa2-client\.[a-z0-9]+/i,
			client_secret: /amzn1\.oa2-cs\.v1\.[a-z0-9]+/i,
			refresh_token: /Atzr\|[^\s"',;]+/
		};
		Object.keys( patterns ).forEach( function ( key ) {
			var m = text.match( patterns[ key ] );
			if ( m ) {
				found[ key ] = m[ 0 ];
				text = text.replace( m[ 0 ], ' ' );
			}
		} );
		var candidates = text.match( /\bA[0-9A-Z]{9,16}\b/g ) || [];
		for ( var i = 0; i < candidates.length; i++ ) {
			if ( marketplaceIds.indexOf( candidates[ i ] ) === -1 && /\d/.test( candidates[ i ] ) ) {
				found.seller_id = candidates[ i ];
				break;
			}
		}
		return found;
	}

	function fill() {
		var found = parse( paste.value );
		Object.keys( found ).forEach( function ( key ) {
			var input = document.getElementById( 'ola-f-' + key );
			if ( input ) {
				input.value = found[ key ];
			}
		} );
		refreshTicks();
	}

	function refreshTicks() {
		document.querySelectorAll( '.ola-tick' ).forEach( function ( tick ) {
			var input = document.getElementById( 'ola-f-' + tick.getAttribute( 'data-for' ) );
			var ok = input && ( input.value || input.getAttribute( 'data-saved' ) );
			tick.textContent = ok ? '✓' : '';
			tick.className = 'ola-tick' + ( ok ? ' is-ok' : '' );
		} );
	}

	marketplace.addEventListener( 'change', updateLinks );
	paste.addEventListener( 'input', fill );
	document.querySelectorAll( '.ola-detected input' ).forEach( function ( input ) {
		input.addEventListener( 'input', refreshTicks );
	} );
	updateLinks();
	refreshTicks();
}() );
