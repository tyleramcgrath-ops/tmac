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

/* Facility photo from Google Maps, fetched live (see inc/google-photos.php). */
( function () {
	var img = document.querySelector( '[data-whr-gphoto]' );
	if ( ! img || ! window.whrPhotoApi || ! window.fetch ) {
		return;
	}
	fetch( window.whrPhotoApi + img.getAttribute( 'data-whr-gphoto' ) )
		.then( function ( r ) {
			return 200 === r.status ? r.json() : null;
		} )
		.then( function ( data ) {
			if ( ! data || ! data.uri ) {
				return;
			}
			var hero = img.closest( '.hero' );
			img.onload = function () {
				img.hidden = false;
				if ( hero ) {
					hero.classList.add( 'has-photo' );
				}
			};
			img.referrerPolicy = 'no-referrer';
			img.src = data.uri;
			var credit = hero ? hero.querySelector( '.whr-gphoto-credit' ) : null;
			if ( credit ) {
				credit.textContent = 'Photo: ';
				( data.credits || [] ).forEach( function ( c, i ) {
					var el = c.uri ? document.createElement( 'a' ) : document.createElement( 'span' );
					el.textContent = c.name;
					if ( c.uri ) {
						el.href = c.uri;
						el.target = '_blank';
						el.rel = 'noopener nofollow';
					}
					if ( i ) {
						credit.appendChild( document.createTextNode( ', ' ) );
					}
					credit.appendChild( el );
				} );
				credit.appendChild( document.createTextNode( ( data.credits && data.credits.length ? ' · ' : '' ) + 'Google Maps' ) );
				credit.hidden = false;
			}
		} )
		.catch( function () {} );
} )();
