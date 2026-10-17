/* Media picker for We Have Rehabs gallery / image fields. */
( function ( $ ) {
	$( document ).on( 'click', '.whr-media-pick', function ( e ) {
		e.preventDefault();
		var $field = $( this ).closest( '.whr-field' );
		var $input = $field.find( '.whr-media-ids' );
		var multiple = $( this ).data( 'multiple' ) === 1;
		var frame = wp.media( { title: 'Choose photos', multiple: multiple ? 'add' : false, library: { type: 'image' } } );

		frame.on( 'open', function () {
			var selection = frame.state().get( 'selection' );
			( $input.val() || '' ).split( ',' ).filter( Boolean ).forEach( function ( id ) {
				var att = wp.media.attachment( id );
				att.fetch();
				selection.add( att );
			} );
		} );

		frame.on( 'select', function () {
			var ids = [];
			var $preview = $field.find( '.whr-media-preview' ).empty();
			frame.state().get( 'selection' ).each( function ( att ) {
				ids.push( att.id );
				var sizes = att.get( 'sizes' ) || {};
				var url = ( sizes.thumbnail || sizes.full || {} ).url || att.get( 'url' );
				$preview.append( $( '<img>' ).attr( { src: url, alt: '' } ) );
			} );
			$input.val( ids.join( ',' ) );
		} );

		frame.open();
	} );

	$( document ).on( 'click', '.whr-media-clear', function ( e ) {
		e.preventDefault();
		var $field = $( this ).closest( '.whr-field' );
		$field.find( '.whr-media-ids' ).val( '' );
		$field.find( '.whr-media-preview' ).empty();
	} );
} )( jQuery );
