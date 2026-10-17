/**
 * Booking assistant.
 *
 * Matches a question against a knowledge base built from this site's own
 * content — the FAQs, the category copy and the live experience data — and
 * hands off to WhatsApp when it has nothing good to say.
 *
 * It answers only with text that exists on this site. That is the point: it
 * cannot invent a price, a departure time or a policy, which a language model
 * pointed at a booking page very much can.
 *
 * @package PalmTreeSurf
 */
( function () {
	'use strict';

	var data = window.ptAssistant;

	if ( ! data ) {
		return;
	}

	var S = data.strings;
	var root = document.querySelector( '[data-assistant]' );

	if ( ! root ) {
		return;
	}

	var panel = root.querySelector( '[data-assistant-panel], #pt-assistant-panel' );
	var toggle = root.querySelector( '[data-assistant-toggle]' );
	var closeBtn = root.querySelector( '[data-assistant-close]' );
	var log = root.querySelector( '[data-assistant-log]' );
	var chipBox = root.querySelector( '[data-assistant-chips]' );
	var form = root.querySelector( '[data-assistant-form]' );
	var input = root.querySelector( '[data-assistant-input]' );

	/* ------------------------------------------------------------ Matching */

	// Words that carry no signal when scoring a question.
	var STOP = ( 'a an and are as at be but by can could do does for from how i if in is it me my ' +
		'of on or our should so than that the their there they this to us was we what when where ' +
		'which who why will with would you your' ).split( ' ' );

	function tokens( text ) {
		return String( text || '' )
			.toLowerCase()
			.replace( /[^a-z0-9áéíóúüñ\s]/g, ' ' )
			.split( /\s+/ )
			.filter( function ( w ) {
				return w.length > 2 && STOP.indexOf( w ) === -1;
			} );
	}

	function stem( word ) {
		// Crude, but enough to make "lessons" match "lesson" and "kids" match "kid".
		return word.replace( /(ing|ed|es|s)$/, '' );
	}

	function overlap( queryWords, text ) {
		var hay = tokens( text ).map( stem );
		var score = 0;

		queryWords.forEach( function ( w ) {
			if ( hay.indexOf( w ) !== -1 ) {
				score += 1;
			} else if ( hay.some( function ( h ) { return h.indexOf( w ) === 0 || w.indexOf( h ) === 0; } ) ) {
				score += 0.5;
			}
		} );

		return score;
	}

	function findAnswer( query ) {
		var words = tokens( query ).map( stem );

		if ( ! words.length ) {
			return null;
		}

		var best = null;
		var bestScore = 0;

		( data.faq || [] ).forEach( function ( entry ) {
			// The question carries far more signal than the answer body.
			var score = overlap( words, entry.q ) * 3 + overlap( words, entry.a );

			if ( score > bestScore ) {
				bestScore = score;
				best = { type: 'faq', entry: entry, score: score };
			}
		} );

		( data.experiences || [] ).forEach( function ( exp ) {
			var haystack = [ exp.title, exp.excerpt, exp.category, exp.level ].join( ' ' );
			var score = overlap( words, exp.title ) * 3 + overlap( words, haystack );

			if ( score > bestScore ) {
				bestScore = score;
				best = { type: 'experience', entry: exp, score: score };
			}
		} );

		// Below this the "match" is usually one incidental word, and a wrong
		// answer is worse than an honest hand-off.
		return bestScore >= 2 ? best : null;
	}

	/* ------------------------------------------------------------- Rendering */

	function el( tag, cls, text ) {
		var node = document.createElement( tag );

		if ( cls ) {
			node.className = cls;
		}

		if ( text ) {
			node.textContent = text;
		}

		return node;
	}

	function link( href, label, cls ) {
		var a = el( 'a', cls || 'assistant__action', label );
		a.href = href;

		if ( href.indexOf( 'wa.me' ) !== -1 ) {
			a.target = '_blank';
			a.rel = 'noopener';
		}

		return a;
	}

	function scrollDown() {
		log.scrollTop = log.scrollHeight;
	}

	function say( who, text, actions ) {
		var wrap = el( 'div', 'assistant__msg assistant__msg--' + who );

		if ( 'you' === who ) {
			wrap.appendChild( el( 'span', 'screen-reader-text', S.you ) );
		}

		wrap.appendChild( el( 'p', 'assistant__bubble', text ) );

		if ( actions && actions.length ) {
			var row = el( 'div', 'assistant__actions' );
			actions.forEach( function ( a ) {
				row.appendChild( a );
			} );
			wrap.appendChild( row );
		}

		log.appendChild( wrap );
		scrollDown();
	}

	function whatsappAction( question ) {
		if ( ! data.whatsapp ) {
			return null;
		}

		var url = data.whatsapp;
		var text = question
			? 'Hi! ' + question
			: 'Hi! I have a question about booking.';

		url += ( url.indexOf( '?' ) === -1 ? '?' : '&' ) + 'text=' + encodeURIComponent( text );

		return link( url, S.whatsapp, 'assistant__action assistant__action--wa' );
	}

	function answerFor( match, question ) {
		if ( ! match ) {
			var fallback = [];
			var wa = whatsappAction( question );

			if ( wa ) {
				fallback.push( wa );
			}

			if ( data.bookingUrl ) {
				fallback.push( link( data.bookingUrl, S.seeAll ) );
			}

			say( 'bot', S.noAnswer, fallback );
			return;
		}

		if ( 'faq' === match.type ) {
			var actions = [];

			if ( match.entry.url ) {
				actions.push( link( match.entry.url, match.entry.tag ? S.readMore + ' — ' + match.entry.tag : S.readMore ) );
			}

			var wa2 = whatsappAction( question );

			if ( wa2 ) {
				actions.push( wa2 );
			}

			say( 'bot', match.entry.a, actions );
			return;
		}

		var exp = match.entry;
		var bits = [ exp.excerpt ];
		var meta = [];

		if ( exp.duration ) {
			meta.push( exp.duration );
		}

		if ( exp.level ) {
			meta.push( exp.level );
		}

		if ( exp.group ) {
			meta.push( exp.group );
		}

		// Price only when one is actually set — never implied.
		if ( exp.price ) {
			meta.push( S.from.replace( '%s', exp.price ) );
		}

		if ( meta.length ) {
			bits.push( meta.join( ' · ' ) );
		}

		say( 'bot', exp.title + ' — ' + bits.join( ' ' ), [
			link( exp.url, S.book, 'assistant__action assistant__action--primary' ),
			whatsappAction( question ),
		].filter( Boolean ) );
	}

	function ask( question ) {
		say( 'you', question );

		// A real endpoint takes precedence when one is configured.
		if ( data.endpoint ) {
			fetch( data.endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify( { question: question } ),
			} )
				.then( function ( r ) { return r.ok ? r.json() : Promise.reject(); } )
				.then( function ( json ) {
					if ( json && json.answer ) {
						say( 'bot', json.answer, [ whatsappAction( question ) ].filter( Boolean ) );
					} else {
						answerFor( findAnswer( question ), question );
					}
				} )
				.catch( function () {
					answerFor( findAnswer( question ), question );
				} );
			return;
		}

		answerFor( findAnswer( question ), question );
	}

	/* ------------------------------------------------------------- Behaviour */

	var started = false;

	function start() {
		if ( started ) {
			return;
		}

		started = true;
		say( 'bot', data.greeting );

		( data.chips || [] ).forEach( function ( chip ) {
			var b = el( 'button', 'assistant__chip', chip );
			b.type = 'button';
			b.addEventListener( 'click', function () {
				if ( chip === S.seeAll || /everything/i.test( chip ) ) {
					say( 'you', chip );
					say( 'bot', S.seeAll, [ link( data.bookingUrl, S.seeAll, 'assistant__action assistant__action--primary' ) ] );
					return;
				}

				ask( chip );
			} );
			chipBox.appendChild( b );
		} );
	}

	function open() {
		panel.hidden = false;
		toggle.setAttribute( 'aria-expanded', 'true' );
		root.classList.add( 'is-open' );
		start();

		try {
			window.sessionStorage.setItem( 'ptAssistantOpen', '1' );
		} catch ( e ) {}

		window.setTimeout( function () {
			input.focus();
		}, 60 );
	}

	function close() {
		panel.hidden = true;
		toggle.setAttribute( 'aria-expanded', 'false' );
		root.classList.remove( 'is-open' );

		try {
			window.sessionStorage.removeItem( 'ptAssistantOpen' );
		} catch ( e ) {}

		toggle.focus();
	}

	toggle.addEventListener( 'click', function () {
		if ( panel.hidden ) {
			open();
		} else {
			close();
		}
	} );

	closeBtn.addEventListener( 'click', close );

	document.addEventListener( 'keydown', function ( event ) {
		if ( 'Escape' === event.key && ! panel.hidden ) {
			close();
		}
	} );

	form.addEventListener( 'submit', function ( event ) {
		event.preventDefault();

		var question = input.value.trim();

		if ( ! question ) {
			return;
		}

		input.value = '';
		ask( question );
	} );

	// Stay open across a click-through to an experience page.
	try {
		if ( '1' === window.sessionStorage.getItem( 'ptAssistantOpen' ) ) {
			open();
		}
	} catch ( e ) {}
}() );
