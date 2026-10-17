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

/* Facility photos from Google Maps, fetched live as they scroll into view (see inc/google-photos.php). */
( function () {
	var imgs = document.querySelectorAll( '[data-whr-gphoto]' );
	if ( ! imgs.length || ! window.whrPhotoApi || ! window.fetch ) {
		return;
	}
	function load( img ) {
		fetch( window.whrPhotoApi + img.getAttribute( 'data-whr-gphoto' ) )
			.then( function ( r ) {
				return 200 === r.status ? r.json() : null;
			} )
			.then( function ( data ) {
				if ( ! data || ! data.uri ) {
					return;
				}
				var box = img.closest( '.hero, .card__media' );
				var inLink = !! img.closest( 'a' ); // Cards are links: credit as plain text there.
				img.onload = function () {
					img.hidden = false;
					if ( box ) {
						box.classList.add( 'has-photo' );
					}
				};
				img.referrerPolicy = 'no-referrer';
				img.src = data.uri;
				var credit = box ? box.querySelector( '.whr-gphoto-credit' ) : null;
				if ( ! credit ) {
					return;
				}
				credit.textContent = 'Photo: ';
				( data.credits || [] ).forEach( function ( c, i ) {
					var el = c.uri && ! inLink ? document.createElement( 'a' ) : document.createElement( 'span' );
					el.textContent = c.name;
					if ( 'A' === el.tagName ) {
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
			} )
			.catch( function () {} );
	}
	if ( ! ( 'IntersectionObserver' in window ) ) {
		imgs.forEach( load );
		return;
	}
	// The images are hidden until loaded, so watch the frame each one sits in.
	var byFrame = new Map();
	var watcher = new IntersectionObserver( function ( entries ) {
		entries.forEach( function ( e ) {
			if ( e.isIntersecting ) {
				watcher.unobserve( e.target );
				load( byFrame.get( e.target ) );
			}
		} );
	}, { rootMargin: '300px' } );
	imgs.forEach( function ( img ) {
		var frame = img.closest( '.hero, .card__media' ) || img.parentNode;
		byFrame.set( frame, img );
		watcher.observe( frame );
	} );
} )();
