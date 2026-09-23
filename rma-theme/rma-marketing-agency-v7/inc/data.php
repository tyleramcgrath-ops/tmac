<?php
/**
 * Site content that more than one template needs: the services, the
 * company pages, and the long-form copy the inner pages share.
 *
 * @package rma
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The eight services, in menu order.
 *
 * @return array<string, array{title: string, summary: string, tag: string}>
 */
function rma_services() {
	return array(
		'ai-search-optimization' => array(
			'title'   => 'AI Search Optimization',
			'summary' => 'Prepare brand content for answer engines, AI summaries, and citation-ready search experiences.',
			'tag'     => 'Answer engines',
		),
		'seo'                    => array(
			'title'   => 'SEO',
			'summary' => 'Build technical, content, and authority systems that make the site easier to discover and easier to trust.',
			'tag'     => 'Search',
		),
		'paid-media'             => array(
			'title'   => 'Paid Media',
			'summary' => 'Plan creative tests, audience structure, offers, and landing pages so ad spend has a real operating system.',
			'tag'     => 'Ads',
		),
		'web-design'             => array(
			'title'   => 'Web Design',
			'summary' => 'Design conversion pages that communicate quickly, load well, and support campaign traffic.',
			'tag'     => 'Conversion',
		),
		'social-media'           => array(
			'title'   => 'Social Media',
			'summary' => 'Create platform-specific content rhythms, campaigns, and community signals without chasing random posting.',
			'tag'     => 'Content',
		),
		'event-planning'         => array(
			'title'   => 'Event Planning',
			'summary' => 'Turn launches, activations, and field marketing into structured campaigns before, during, and after the event.',
			'tag'     => 'Live',
		),
		'branding'               => array(
			'title'   => 'Branding',
			'summary' => 'Clarify positioning, voice, visual direction, and the message architecture behind every campaign.',
			'tag'     => 'Identity',
		),
		'analytics-reporting'    => array(
			'title'   => 'Analytics & Reporting',
			'summary' => 'Build readable reporting loops that connect marketing activity to decisions without relying on vanity metrics.',
			'tag'     => 'Decisions',
		),
	);
}

/**
 * The company pages the theme owns, besides the services.
 *
 * @return array<string, array{title: string, summary: string}>
 */
function rma_company_pages() {
	return array(
		'services'     => array(
			'title'   => 'Services',
			'summary' => 'A complete overview of the marketing services RMA can build into one connected growth system.',
		),
		'case-studies' => array(
			'title'   => 'Case Studies',
			'summary' => 'A practical case-study framework showing how strategy, creative, publishing, and reporting work together.',
		),
		'about'        => array(
			'title'   => 'About',
			'summary' => 'A focused explanation of how RMA thinks, plans, collaborates, and keeps marketing work accountable.',
		),
		'insights'     => array(
			'title'   => 'Insights',
			'summary' => 'Long-form marketing thinking across content, social media, campaign planning, search, and conversion.',
		),
		'contact'      => array(
			'title'   => 'Contact',
			'summary' => 'A clear path to start a conversation, explain priorities, and shape the first marketing plan.',
		),
	);
}

/**
 * Link to one of the site's pages by slug.
 *
 * @param string $slug Page slug, or '' for home.
 */
function rma_url( $slug = '' ) {
	return esc_url( home_url( $slug ? '/' . $slug . '/' : '/' ) );
}

/**
 * The shared essay the v6 inner pages carried, said once instead of ten times.
 *
 * @param string $name    The subject as it starts a sentence ("AI Search Optimization").
 * @param string $subject The subject mid-sentence ("AI search optimization").
 * @return string[]
 */
function rma_essay( $name, $subject ) {
	return array(
		sprintf( '%s works best when it is treated as part of a complete marketing system instead of a single task on a checklist. The first job is to clarify the audience, the offer, the message, the channel, and the next action a person should take after seeing the campaign. That sounds basic, but it is where disconnected marketing starts. RMA connects %s to the larger path from awareness to trust to inquiry.', $name, $subject ),
		'A strong plan also keeps social media from becoming random output. Social channels should show the brand\'s point of view, answer buyer questions, create proof, and give campaigns a place to breathe between major launches. When search content, email topics, ad creative, website updates, and sales enablement are planned together, the brand looks more confident because the same ideas appear in different formats without sounding copied and pasted.',
		'The practical advantage is focus. Instead of chasing every trend, the team decides which themes matter this month, which offers need support, which pages need better explanation, and which campaign assets should be tested next. Reporting then becomes a conversation about what to keep, what to adjust, and what to stop doing. That is the difference between scattered marketing and useful marketing.',
	);
}

/**
 * The ten planning questions every v6 inner page walked through, each with
 * a one-line answer.
 *
 * @return array<int, array{0: string, 1: string}>
 */
function rma_approach() {
	return array(
		array( 'The strategic role', 'Agree on the decision each piece of work is supposed to support before anything is made.' ),
		array( 'What needs to be planned first', 'Audience, offer, message, channel, and the next action a person should take.' ),
		array( 'How the work connects to social media', 'Social carries the point of view between launches instead of posting for the sake of it.' ),
		array( 'How creative direction stays consistent', 'One message architecture, adapted per format, so nothing sounds copied and pasted.' ),
		array( 'How campaigns become easier to manage', 'A shared calendar and clear owners turn launches into a rhythm instead of a scramble.' ),
		array( 'What the website needs to support', 'Pages that explain the offer quickly and catch the traffic every campaign sends.' ),
		array( 'How reporting should be read', 'What happened, what mattered, and what to do next, not a pile of numbers.' ),
		array( 'How teams keep momentum', 'Monthly themes and a short list of tests keep the work moving without chasing trends.' ),
		array( 'What clean execution looks like', 'Fewer, better assets, shipped on time, measured against the goal they were made for.' ),
		array( 'How RMA would approach the first plan', 'Audit what exists, pick the few moves that matter most, and build the reporting loop first.' ),
	);
}
