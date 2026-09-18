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
