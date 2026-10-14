/* Mobile menu toggle. */
( function () {
	var button = document.querySelector( '.nav-toggle' );
	if ( ! button ) {
		return;
	}
	var header = button.closest( '.site-header' );
	button.addEventListener( 'click', function () {
		var open = header.classList.toggle( 'is-open' );
		button.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
	} );
} )();
