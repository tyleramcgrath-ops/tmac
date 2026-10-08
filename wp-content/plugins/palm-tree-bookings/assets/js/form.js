/**
 * Booking form behaviour.
 *
 * Progressive enhancement only: with JavaScript off the form still posts and
 * the server still validates. This adds per-field validation on blur and a
 * loading state on submit.
 */
( function () {
	'use strict';

	var form = document.querySelector( '.ptb__form' );
	if ( ! form ) {
		return;
	}

	function messageFor( field ) {
		if ( field.validity.valueMissing ) {
			return 'This one is required.';
		}
		if ( field.validity.typeMismatch && 'email' === field.type ) {
			return 'That email address does not look right.';
		}
		if ( field.validity.typeMismatch ) {
			return 'Please check this value.';
		}
		if ( field.validity.rangeUnderflow || field.validity.rangeOverflow ) {
			return 'Please enter a number in range.';
		}
		return 'Please check this value.';
	}

	function clearError( field ) {
		field.removeAttribute( 'aria-invalid' );
		var existing = field.parentNode.querySelector( '.ptb-error' );
		if ( existing ) {
			existing.remove();
		}
	}

	function showError( field ) {
		clearError( field );
		field.setAttribute( 'aria-invalid', 'true' );

		var msg = document.createElement( 'p' );
		msg.className = 'ptb-error';
		msg.textContent = messageFor( field );
		msg.id = ( field.id || 'ptb' ) + '-error';
		field.parentNode.appendChild( msg );

		var describedBy = field.getAttribute( 'aria-describedby' );
		field.setAttribute( 'aria-describedby', describedBy ? describedBy + ' ' + msg.id : msg.id );
	}

	function validate( field ) {
		if ( ! field.willValidate ) {
			return true;
		}
		if ( field.checkValidity() ) {
			clearError( field );
			return true;
		}
		showError( field );
		return false;
	}

	form.querySelectorAll( 'input, select, textarea' ).forEach( function ( field ) {
		field.addEventListener( 'blur', function () {
			// Do not scold someone for a field they have not filled in yet.
			if ( '' === field.value && ! field.required ) {
				clearError( field );
				return;
			}
			validate( field );
		} );

		field.addEventListener( 'input', function () {
			if ( 'true' === field.getAttribute( 'aria-invalid' ) ) {
				validate( field );
			}
		} );
	} );

	/**
	 * Availability: repopulate the time picker whenever the experience or the
	 * date changes, so a customer is only ever offered a slot that is open.
	 *
	 * Progressive enhancement. Without this the select stays empty, the server
	 * still accepts the booking, and staff confirm the time by reply.
	 */
	( function () {
		var cfg = window.ptbAvailability;
		var slotField = form.querySelector( '[data-ptb-slots]' );
		var experienceField = form.querySelector( '#ptb-experience' );
		var dateField = form.querySelector( '#ptb-date_primary' );

		if ( ! cfg || ! slotField || ! experienceField || ! dateField ) {
			return;
		}

		var requestId = 0;

		function setOptions( options, disabled ) {
			slotField.innerHTML = '';
			options.forEach( function ( option ) {
				var el = document.createElement( 'option' );
				el.value = option.value;
				el.textContent = option.label;
				if ( option.disabled ) {
					el.disabled = true;
				}
				slotField.appendChild( el );
			} );
			slotField.disabled = !! disabled;
		}

		function refresh() {
			var experience = experienceField.value;
			var date = dateField.value;

			if ( ! experience || ! date || isNaN( parseInt( experience, 10 ) ) ) {
				setOptions( [ { value: '', label: cfg.prompt } ], true );
				return;
			}

			var thisRequest = ++requestId;
			setOptions( [ { value: '', label: cfg.loading } ], true );

			var url = cfg.endpoint +
				'?experience=' + encodeURIComponent( experience ) +
				'&date=' + encodeURIComponent( date );

			fetch( url, { credentials: 'same-origin' } )
				.then( function ( response ) {
					return response.ok ? response.json() : Promise.reject( response.status );
				} )
				.then( function ( data ) {
					// A slower earlier request must not overwrite a newer one.
					if ( thisRequest !== requestId ) {
						return;
					}

					var open = ( data.slots || [] ).filter( function ( slot ) {
						return ! slot.full;
					} );

					if ( ! open.length ) {
						setOptions( [ { value: '', label: cfg.none } ], true );
						return;
					}

					var options = [ { value: '', label: cfg.choose } ];

					open.forEach( function ( slot ) {
						var label = slot.label;
						// Nudge on genuine scarcity only.
						if ( slot.remaining > 0 && slot.remaining <= 3 ) {
							label = cfg.left
								.replace( '%1$s', slot.label )
								.replace( '%2$d', slot.remaining );
						}
						options.push( { value: slot.time, label: label } );
					} );

					setOptions( options, false );
				} )
				.catch( function () {
					if ( thisRequest !== requestId ) {
						return;
					}
					// Never block a booking because availability could not load.
					setOptions( [ { value: '', label: cfg.choose } ], false );
				} );
		}

		experienceField.addEventListener( 'change', refresh );
		dateField.addEventListener( 'change', refresh );
		dateField.addEventListener( 'input', refresh );

		/*
		 * On a tour's own page the experience is a hidden input, which never
		 * fires change. Refresh once on load so a date typed straight in finds
		 * the slots already scoped to the right tour.
		 */
		refresh();

		// Restore the picker after a validation error bounced the form back.
		if ( experienceField.value && dateField.value ) {
			refresh();
		}
	}() );

	form.addEventListener( 'submit', function ( event ) {
		var firstInvalid = null;

		form.querySelectorAll( 'input, select, textarea' ).forEach( function ( field ) {
			if ( ! validate( field ) && ! firstInvalid ) {
				firstInvalid = field;
			}
		} );

		if ( firstInvalid ) {
			event.preventDefault();
			firstInvalid.focus();
			firstInvalid.scrollIntoView( { block: 'center', behavior: 'smooth' } );
			return;
		}

		var button = form.querySelector( '.ptb-btn' );
		if ( button ) {
			button.classList.add( 'is-loading' );
			button.disabled = true;
		}
	} );
}() );
