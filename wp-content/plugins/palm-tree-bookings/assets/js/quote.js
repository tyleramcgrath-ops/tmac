/**
 * Live price on the booking form.
 *
 * Watches the experience, party size and start time, asks the server what that
 * would cost, and shows the breakdown. The server is the only thing that ever
 * prices a booking — this never does arithmetic of its own, so what a customer
 * sees and what they are charged cannot drift apart.
 *
 * With JavaScript off the form works exactly as before and a person quotes the
 * booking by hand, which is what happens today.
 */
( function () {
	'use strict';

	var config = window.ptbQuote || null;

	if ( ! config || ! config.endpoint ) {
		return;
	}

	document.querySelectorAll( 'form.ptb__form' ).forEach( function ( form ) {
		setup( form );
	} );

	function setup( form ) {
		var experience = form.querySelector( '[name="ptb[experience]"]' );
		var adults = form.querySelector( '[name="ptb[party_adults]"]' );
		var children = form.querySelector( '[name="ptb[party_children]"]' );
		var slot = form.querySelector( '[name="ptb[slot_time]"]' );

		if ( ! experience || ! adults ) {
			return;
		}

		var panel = document.createElement( 'div' );
		panel.className = 'ptb-quote';
		panel.hidden = true;
		panel.setAttribute( 'aria-live', 'polite' );

		// Sit directly above the submit button, which is the last thing read
		// before committing.
		var actions = form.querySelector( '.ptb__actions' );

		if ( actions && actions.parentNode ) {
			actions.parentNode.insertBefore( panel, actions );
		} else {
			form.appendChild( panel );
		}

		var token = 0;

		function refresh() {
			var id = parseInt( experience.value, 10 );

			if ( ! id ) {
				panel.hidden = true;
				return;
			}

			var params = new URLSearchParams( {
				experience: String( id ),
				adults: String( parseInt( adults.value, 10 ) || 1 ),
				children: String( ( children && parseInt( children.value, 10 ) ) || 0 ),
				time: ( slot && slot.value ) || ''
			} );

			// Only the newest request may paint, so a slow reply cannot
			// overwrite a fresher price.
			var mine = ++token;

			fetch( config.endpoint + '?' + params.toString(), {
				headers: { Accept: 'application/json' }
			} )
				.then( function ( response ) {
					return response.ok ? response.json() : null;
				} )
				.then( function ( data ) {
					if ( mine !== token ) {
						return;
					}

					if ( ! data || ! data.priced ) {
						panel.hidden = true;
						return;
					}

					render( panel, data );
					panel.hidden = false;
				} )
				.catch( function () {
					if ( mine === token ) {
						panel.hidden = true;
					}
				} );
		}

		[ experience, adults, children, slot ].forEach( function ( field ) {
			if ( ! field ) {
				return;
			}

			field.addEventListener( 'change', refresh );
			field.addEventListener( 'input', refresh );
		} );

		refresh();
	}

	function render( panel, data ) {
		var rows = '';

		( data.lines || [] ).forEach( function ( line ) {
			rows +=
				'<div class="ptb-quote__row"><span>' +
				escapeHtml( line.label ) +
				'</span><span>' +
				escapeHtml( line.amount ) +
				'</span></div>';
		} );

		var html =
			'<p class="ptb-quote__heading">' + escapeHtml( config.heading ) + '</p>' +
			rows +
			'<div class="ptb-quote__row ptb-quote__total"><span>' +
			escapeHtml( config.total ) +
			'</span><span>' +
			escapeHtml( data.total ) +
			'</span></div>';

		if ( data.deposit ) {
			html += '<p class="ptb-quote__note">' + escapeHtml( data.deposit ) + '</p>';
		}

		if ( data.estimate ) {
			html += '<p class="ptb-quote__note">' + escapeHtml( data.estimate ) + '</p>';
		}

		panel.innerHTML = html;
	}

	function escapeHtml( value ) {
		var node = document.createElement( 'span' );
		node.textContent = value === undefined || value === null ? '' : String( value );
		return node.innerHTML;
	}
}() );
