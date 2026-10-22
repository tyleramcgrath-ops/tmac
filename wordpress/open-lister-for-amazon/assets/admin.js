/* global jQuery, OLA */
( function ( $ ) {
	'use strict';

	var $panel = $( '#ola_amazon_panel' );
	if ( ! $panel.length ) {
		return;
	}
	var productId = $panel.data( 'product-id' );

	function post( action, data ) {
		return $.post( OLA.ajax, $.extend( { action: action, nonce: OLA.nonce, product_id: productId }, data ) );
	}

	function esc( text ) {
		return $( '<div>' ).text( text == null ? '' : String( text ) ).html();
	}

	function showError( $target, response ) {
		var message = response && response.data && response.data.message ? response.data.message : 'Request failed.';
		$target.html( '<p class="ola-error-text">' + esc( message ) + '</p>' );
	}

	// Show product-type fields only when creating a new Amazon product.
	function toggleMode() {
		var mode = $panel.find( 'input[name="ola_mode"]:checked' ).val();
		$panel.find( '.ola-create-only' ).toggle( mode === 'create' );
	}
	$panel.on( 'change', 'input[name="ola_mode"]', toggleMode );
	toggleMode();

	$panel.on( 'click', '.ola-action', function () {
		var action = $( this ).data( 'action' );
		if ( action === 'end' && ! window.confirm( 'Remove this listing from Amazon?' ) ) {
			return;
		}
		var $result = $panel.find( '.ola-result' ).text( 'Working…' );
		post( 'ola_action', { ola_action: action } ).done( function ( response ) {
			if ( response.success ) {
				$result.html( '<p>' + esc( response.data.message ) + '</p>' );
			} else {
				showError( $result, response );
			}
		} ).fail( function () {
			showError( $result );
		} );
	} );

	$panel.on( 'click', '.ola-validate', function () {
		var $result = $panel.find( '.ola-result' ).text( 'Asking Amazon…' );
		post( 'ola_validate' ).done( function ( response ) {
			if ( ! response.success ) {
				showError( $result, response );
				return;
			}
			var html = '';
			response.data.results.forEach( function ( r ) {
				html += '<p><strong>' + esc( r.sku ) + '</strong>: ' + ( r.issues.length ? esc( r.status ) : 'Looks good — ready to list.' ) + '</p>';
				if ( r.issues.length ) {
					html += '<ul class="ola-issues">';
					r.issues.forEach( function ( issue ) {
						var attrs = issue.attributeNames ? ' [' + issue.attributeNames.join( ', ' ) + ']' : '';
						html += '<li class="ola-sev-' + esc( ( issue.severity || '' ).toLowerCase() ) + '">' + esc( issue.severity + ': ' + issue.message + attrs ) + '</li>';
					} );
					html += '</ul>';
				}
			} );
			$result.html( html );
		} ).fail( function () {
			showError( $result );
		} );
	} );

	$panel.on( 'click', '.ola-find-asin', function () {
		var $out = $panel.find( '.ola-asin-results' ).text( 'Searching Amazon…' );
		post( 'ola_find_asin', { term: $panel.find( '#ola_asin' ).val().match( /^B0/i ) ? '' : $panel.find( '#ola_asin' ).val() } ).done( function ( response ) {
			if ( ! response.success ) {
				showError( $out, response );
				return;
			}
			if ( ! response.data.items.length ) {
				$out.html( '<p>No matches. Type a UPC/EAN or keywords in the ASIN box and try again.</p>' );
				return;
			}
			var html = '<ul class="ola-pick-list">';
			response.data.items.forEach( function ( item ) {
				html += '<li><button type="button" class="button button-small ola-pick-asin" data-asin="' + esc( item.asin ) + '">Use</button> ' +
					( item.image ? '<img src="' + esc( item.image ) + '" alt="" class="ola-thumb">' : '' ) +
					'<a href="' + esc( item.url ) + '" target="_blank" rel="noopener">' + esc( item.title ) + '</a> <span class="ola-muted">' + esc( item.asin ) + '</span></li>';
			} );
			$out.html( html + '</ul>' );
		} ).fail( function () {
			showError( $out );
		} );
	} );

	$panel.on( 'click', '.ola-pick-asin', function () {
		$panel.find( '#ola_asin' ).val( $( this ).data( 'asin' ) );
		$panel.find( '.ola-asin-results' ).empty();
	} );

	$panel.on( 'click', '.ola-search-types', function () {
		var $out = $panel.find( '.ola-type-results' ).text( 'Searching…' );
		var keywords = $panel.find( '#ola_product_type' ).val() || $( '#title' ).val();
		post( 'ola_product_types', { keywords: keywords } ).done( function ( response ) {
			if ( ! response.success ) {
				showError( $out, response );
				return;
			}
			var html = '<p>';
			response.data.types.forEach( function ( type ) {
				html += '<button type="button" class="button button-small ola-pick-type" data-type="' + esc( type.name ) + '">' + esc( type.label ) + ' (' + esc( type.name ) + ')</button> ';
			} );
			$out.html( html + '</p>' );
		} ).fail( function () {
			showError( $out );
		} );
	} );

	$panel.on( 'click', '.ola-pick-type', function () {
		$panel.find( '#ola_product_type' ).val( $( this ).data( 'type' ) );
		$panel.find( '.ola-type-results' ).empty();
	} );
}( jQuery ) );
