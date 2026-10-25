<?php
/**
 * Test-only mu-plugin: answers Claude API calls with canned JSON so the full flow can be
 * tested without an API key. It also records each request so tests can assert on it.
 *
 * Not shipped in the plugin zip.
 */

add_filter(
	'pre_http_request',
	function ( $pre, $args, $url ) {
		if ( 0 !== strpos( $url, 'https://api.anthropic.com/' ) ) {
			return $pre;
		}
		$body = json_decode( $args['body'], true );
		$log   = get_option( 'aisa_test_requests', [] );
		$log[] = [
			'headers' => $args['headers'],
			'body'    => $body,
		];
		update_option( 'aisa_test_requests', $log, false );

		$schema = $body['output_config']['format']['schema'];
		$user   = $body['messages'][0]['content'];

		if ( isset( $schema['properties']['site_represents'] ) ) {
			$out = [
				'site_represents'   => 'organization',
				'name'              => 'Bright Smile Dental',
				'description'       => 'Family and cosmetic dentist in Austin, TX since 2009.',
				'business_type'     => 'Dentist',
				'phone'             => '+1-512-555-0142',
				'email'             => 'hello@brightsmile.example',
				'founding_date'     => '2009',
				'address'           => [
					'street'      => '1200 Congress Ave',
					'city'        => 'Austin',
					'region'      => 'TX',
					'postal_code' => '78701',
					'country'     => 'US',
				],
				'area_served'       => 'Austin and Round Rock, TX',
				'price_range'       => '$$',
				'home_title'        => 'Family Dentist in Austin, TX | Bright Smile Dental',
				'home_description'  => 'Gentle family and cosmetic dentistry in downtown Austin: cleanings, whitening, Invisalign and same-day emergencies. Book your visit today.',
				'primary_keyphrase' => 'austin family dentist',
				'voice'             => 'Warm, reassuring and plain-spoken; speaks to busy Austin families.',
				'social'            => [
					'facebook'      => 'https://www.facebook.com/brightsmileatx',
					'twitter'       => '',
					'instagram'     => 'https://www.instagram.com/brightsmileatx',
					'tiktok'        => '',
					'pinterest'     => '',
					'youtube'       => '',
					'linkedin'      => '',
					'yelp'          => '',
					'wikipedia'     => '',
					'google_places' => '',
					'threads'       => '',
					'bluesky'       => '',
				],
			];
		} elseif ( isset( $schema['properties']['schema'] ) ) {
			preg_match( '/^Page title: (.*)$/m', $user, $m );
			$page = isset( $m[1] ) ? $m[1] : 'Page';
			$faqs = [];
			$svc  = [
				'include'      => false,
				'name'         => '',
				'service_type' => '',
				'description'  => '',
				'area_served'  => '',
			];
			if ( 'Teeth Whitening' === $page ) {
				$svc  = [
					'include'      => true,
					'name'         => 'Professional Teeth Whitening',
					'service_type' => 'Teeth whitening',
					'description'  => 'In-office Zoom whitening that brightens teeth up to 8 shades in one visit.',
					'area_served'  => 'Austin, TX',
				];
				$faqs = [
					[
						'question' => 'How long does whitening last?',
						'answer'   => 'Results typically last 1 to 3 years with good care.',
					],
				];
			}
			$out = [
				'title'                 => substr( $page . ' in Austin, TX | Bright Smile Dental', 0, 60 ),
				'description'           => str_pad( 'Learn about ' . strtolower( $page ) . ' at Bright Smile Dental in Austin. Friendly care, flexible hours, easy booking.', 145, ' Call today.' ),
				'focus_keyphrase'       => strtolower( $page ) . ' austin',
				'additional_keyphrases' => [ 'dentist austin', 'austin dental care' ],
				'og_title'              => $page . ' at Bright Smile Dental',
				'og_description'        => 'Everything you need to know about ' . strtolower( $page ) . ' from your Austin family dentist.',
				'schema'                => [
					'page_type'    => 'Contact' === $page ? 'ContactPage' : ( 'About Us' === $page ? 'AboutPage' : 'WebPage' ),
					'article_type' => false !== strpos( $user, 'Content type: post' ) ? 'BlogPosting' : 'none',
					'service'      => $svc,
					'faqs'         => $faqs,
				],
			];
		} elseif ( isset( $schema['properties']['ok'] ) ) {
			$out = [ 'ok' => true ];
		} else {
			$out = [
				'title'       => 'Archive | Bright Smile Dental',
				'description' => 'Archive description.',
			];
		}

		return [
			'headers'  => [],
			'body'     => wp_json_encode(
				[
					'id'          => 'msg_test',
					'type'        => 'message',
					'role'        => 'assistant',
					'model'       => $body['model'],
					'stop_reason' => 'end_turn',
					'content'     => [
						[
							'type' => 'text',
							'text' => wp_json_encode( $out ),
						],
					],
				]
			),
			'response' => [
				'code'    => 200,
				'message' => 'OK',
			],
			'cookies'  => [],
			'filename' => null,
		];
	},
	10,
	3
);
