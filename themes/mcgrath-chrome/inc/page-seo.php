<?php
/**
 * Per-page search and answer-engine content.
 *
 * Every page the theme ships targets one head term. This file holds, for each
 * of them: that term, the meta description, the question-shaped headings, the
 * comparison table, and the FAQ. The page renders from these arrays and the
 * JSON-LD in wp_head() is generated from the same ones, so the markup and the
 * structured data can never drift apart.
 *
 * Nothing in here states a price, a statistic, a client name, a certification
 * or a date. Prices come from the Customizer so the page shows whatever the
 * owner has actually set, and read "On request" until they do.
 *
 * @package mcgrath-chrome
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * The head term and meta description for each page.
 *
 * The term is the phrase the page is written to win. It appears in the title
 * tag, the H1 and the meta description, and it is the phrase the question
 * headings below are built around.
 */
function mcg_page_terms() {
	return array(
		'home'      => array(
			'term' => 'digital marketing agency in Jupiter, FL',
			'meta' => 'A digital marketing agency in Jupiter, FL doing SEO, AI search visibility and web design. One person accountable, priced in the open, no long contract.',
		),
		'seo'       => array(
			'term' => 'SEO company in Jupiter',
			'meta' => 'Looking for an SEO company in Jupiter? Local, technical and content SEO for Palm Beach County. Clear pricing, monthly reporting, no long contract.',
		),
		'webdesign' => array(
			'term' => 'web design company in Jupiter',
			'meta' => 'A web design company in Jupiter, FL building fast custom WordPress sites, built to rank from launch day and handed over so you own every part of it.',
		),
		'aeo'       => array(
			'term' => 'AI search optimization',
			'meta' => 'AI search optimization for Jupiter businesses: get named when buyers ask ChatGPT, Gemini, Perplexity or a Google AI Overview who to call. Tracked monthly.',
		),
		'about'     => array(
			'term' => 'SEO consultant in Jupiter, FL',
			'meta' => 'Tyler McGrath, an SEO consultant in Jupiter, FL. One person, not an agency: who you are hiring, how the work runs, and who this does and does not suit.',
		),
		'contact'   => array(
			'term' => 'free SEO audit in Jupiter',
			'meta' => 'Request a free SEO audit in Jupiter, FL. Rankings, site health and whether AI answers mention you, with the three things worth fixing first. No pitch.',
		),
	);
}

/** The head term for a page key, or an empty string when it has none. */
function mcg_term( $key ) {
	$terms = mcg_page_terms();
	return isset( $terms[ $key ]['term'] ) ? $terms[ $key ]['term'] : '';
}

/**
 * Two question-shaped headings per page, each answered in the first sentence
 * of the paragraph beneath it.
 *
 * Two is deliberate. It matches what the pages ranking for these terms carry;
 * a page stuffed with a dozen question headings reads as written for a parser
 * rather than for a buyer, and the extra ones earn nothing.
 */
function mcg_page_questions() {
	return array(
		'home'      => array(
			array(
				'q' => 'What does a digital marketing agency in Jupiter actually do?',
				'a' => 'It puts your business in front of people already looking for what you sell. Here that means three things: ranking in the SERPs and the map pack, being named in AI answers, and a website that turns those visits into calls.',
			),
			array(
				'q' => 'Should I fix SEO or rebuild the website first?',
				'a' => 'Usually SEO first, because a rebuild you did not need is the most expensive way to start. The audit tells you which it is. If the structure, speed and URL layout are sound, the money belongs in content and local visibility instead.',
			),
		),
		'seo'       => array(
			array(
				'q' => 'How do you choose an SEO company in Jupiter?',
				'a' => 'Ask who does the work, what ships each month, and how it gets reported. An SEO company in Jupiter that will not name the person on your account, or will not quote a price before a discovery call, is selling a process rather than an outcome.',
			),
			array(
				'q' => 'What does local SEO change that national SEO does not?',
				'a' => 'Local SEO decides whether you appear at all in the map pack and the SERPs somebody sees within a few miles of your door. It runs on your Google Business Profile, citations, reviews and location pages rather than on national authority alone.',
			),
		),
		'webdesign' => array(
			array(
				'q' => 'What should a web design company in Jupiter deliver?',
				'a' => 'A site you own outright, on your hosting, with your logins, that loads fast on a phone and keeps the rankings the old one earned. Anything a web design company in Jupiter cannot hand over at the end was never really yours.',
			),
			array(
				'q' => 'Will a redesign hurt my search rankings?',
				'a' => 'It will if the URL structure changes without redirects, which is how most redesigns lose traffic. Crawl the current site first, record what each URL earns in the SERPs today, and write the redirect map before anything is designed.',
			),
		),
		'aeo'       => array(
			array(
				'q' => 'What is AI search optimization?',
				'a' => 'AI search optimization is the work that gets your business named and linked when someone asks a model a buying question instead of running a normal search. It shares a foundation with SEO: clean structure, clear claims, and presence on sources those models already read.',
			),
			array(
				'q' => 'How is it different from ranking in the SERPs?',
				'a' => 'The SERPs give you ten positions and a second page; an AI answer gives you a paragraph naming two or three businesses and a short source list. There is no page two to fall back to, so the work targets being quotable rather than merely present.',
			),
		),
		'about'     => array(
			array(
				'q' => 'What does an SEO consultant in Jupiter, FL do that an agency does not?',
				'a' => 'You talk to the person doing the work, so nothing is lost between the sales call and the account. An SEO consultant in Jupiter, FL takes fewer clients than an agency, which is the trade: more attention per client, and a real ceiling on volume.',
			),
			array(
				'q' => 'How do I know the work is actually being done?',
				'a' => 'You see what shipped, not a summary of effort. Each month names the pages and URLs that changed, what moved in the SERPs, what did not, and what is next. A month with nothing to show is reported as a month with nothing to show.',
			),
		),
		'contact'   => array(
			array(
				'q' => 'What does a free SEO audit in Jupiter include?',
				'a' => 'Where you rank now, what is technically holding the site back, and whether AI answers name you at all. A free SEO audit in Jupiter here ends with the three fixes worth doing first, in writing, whether or not we work together.',
			),
			array(
				'q' => 'Is this a sales call in disguise?',
				'a' => 'No. The audit is run before we speak, so the call is spent on findings rather than discovery questions. If the honest answer is that your site is fine, or that somebody else suits you better, you will be told that on the call.',
			),
		),
	);
}

/**
 * One comparison table per page.
 *
 * Rows are the options, columns are the dimensions, and every cell carries a
 * concrete value rather than a tick. A price cell reads from the Customizer,
 * so the table shows what the owner set and never a number invented here.
 */
function mcg_page_table() {
	return array(
		'home'      => array(
			'head' => 'Where buyers find you, and what decides it',
			'cap'  => 'The three places a Jupiter business gets found, what decides each one, and the work that moves it.',
			'cols' => array( 'Where', 'What decides it', 'What moves it', 'How it is measured' ),
			'rows' => array(
				array( 'Google organic (the SERPs)', 'Relevance, site health, authority', 'Technical fixes, content, links', 'Rankings and organic sessions' ),
				array( 'Google map pack', 'Proximity, profile quality, reviews', 'Profile, citations, location pages', 'Map views, calls, direction requests' ),
				array( 'AI answers', 'Whether a model can parse and trust you', 'Structured data, quotable claims, cited sources', 'A fixed question set run monthly' ),
			),
		),
		'seo'       => array(
			'head' => 'What each part of the work actually moves',
			'cap'  => 'What each workstream fixes, and how fast to expect it.',
			'cols' => array( 'Workstream', 'What it fixes', 'Where you see it', 'Pace', 'What I need from you' ),
			'rows' => array(
				array( 'Local SEO', 'Being invisible inside a few miles of your door', 'The map pack and local SERPs', 'Sometimes faster than organic, sometimes slower', 'Profile access and a way to ask for reviews' ),
				array( 'Technical SEO', 'Pages that cannot be crawled, indexed or loaded quickly', 'Every URL on the site at once', 'Inside a quarter once the fixes ship', 'Developer or hosting access' ),
				array( 'Content', 'Questions your pages leave unanswered', 'Organic SERPs and AI answers', 'Compounds over six to twelve months', 'The answers only you know' ),
				array( 'Reporting', 'Not knowing which of the above paid for itself', 'One monthly report in plain English', 'From the first month', 'Analytics access, then very little' ),
			),
		),
		'webdesign' => array(
			'head' => 'New build, redesign, or keep the one you have',
			'cap'  => 'What each route starts with, and what you are left holding.',
			'cols' => array( 'Route', 'Starts with', 'What happens to your URLs', 'What ships', 'Afterwards' ),
			'rows' => array(
				array( 'New site build', 'Your buyers and what they need to decide', 'A clean URL structure planned once, up front', 'Custom design, WordPress, schema, tracking wired up', 'Yours on your hosting, documented' ),
				array( 'Redesign', 'A crawl of the current site and what it earns today', 'Every old URL mapped to a new one before design starts', 'The rebuild plus the redirect map and a post-launch crawl', 'Rankings carried across, not restarted' ),
				array( 'Keep and improve', 'The audit saying the site is structurally fine', 'Unchanged, so nothing to redirect', 'Speed, structure and conversion fixes to the site you own', 'No rebuild, no migration risk' ),
			),
		),
		'aeo'       => array(
			'head' => 'A search result and an AI answer are not the same thing',
			'cap'  => 'Why a site can rank in the SERPs and never get named in an answer.',
			'cols' => array( '', 'Classic search result', 'AI answer' ),
			'rows' => array(
				array( 'What the buyer sees', 'Ten links and a map pack', 'One paragraph naming two or three businesses' ),
				array( 'Room below the fold', 'Page two exists', 'There is no page two' ),
				array( 'What earns the place', 'Relevance, authority, site health', 'Being parseable, quotable and corroborated elsewhere' ),
				array( 'What you optimise', 'Pages, links and URLs', 'Claims, structured data and third-party sources' ),
				array( 'How you track it', 'Rank tracking by keyword', 'A fixed question set run against each model monthly' ),
			),
		),
		'about'     => array(
			'head' => 'Which service fits which problem',
			'cap'  => 'The four things this business does, and the problem each one is the answer to.',
			'cols' => array( 'Service', 'The problem it solves', 'Where it shows up' ),
			'rows' => array(
				array( 'SEO', 'Nobody nearby finds you when they search', 'Google organic and the map pack' ),
				array( 'AI search visibility', 'Models recommend competitors and never mention you', 'ChatGPT, Gemini, Perplexity, AI Overviews' ),
				array( 'Web design', 'People arrive and leave without calling', 'Your own site, on a phone, at speed' ),
				array( 'Analytics and conversion', 'Traffic exists but you cannot tell what it is worth', 'Your reporting, monthly' ),
			),
		),
		'contact'   => array(
			'head' => 'What the audit looks at',
			'cap'  => 'The four parts of a free SEO audit in Jupiter, and what comes back to you for each.',
			'cols' => array( 'Area', 'What I check', 'What you get back' ),
			'rows' => array(
				array( 'SEO performance', 'What you rank for now and what you nearly rank for', 'The terms worth chasing first, with the pages that should own them' ),
				array( 'AI search visibility', 'Whether the major models name you for buying questions', 'Which questions name you, which name somebody else' ),
				array( 'Technical issues', 'Crawling, indexing, speed on a phone, redirects and duplicate URLs', 'A prioritized fix list any developer can work from' ),
				array( 'Growth opportunities', 'Gaps between your pages and the ones outranking them', 'The three things worth fixing first, in writing' ),
			),
		),
	);
}

/**
 * The page FAQ.
 *
 * Rendered as <details> on the page and as FAQPage structured data in the
 * head, from this one array. Questions live in <summary>, not in a heading
 * tag, so a long FAQ does not swamp the page's heading outline.
 */
function mcg_page_faqs() {
	return array(
		'seo'       => array(
			array(
				'q' => 'Do you only work with businesses in Jupiter?',
				'a' => 'No. The local work centres on Jupiter, Palm Beach Gardens, Tequesta, Juno Beach, Abacoa, Jupiter Farms, Hobe Sound and Stuart, because proximity decides the result there. Clients elsewhere are welcome; the organic and technical work is identical.',
			),
			array(
				'q' => 'Will I lose rankings if I rebuild the site while you work on SEO?',
				'a' => 'Not if it is planned around the URLs the site already earns from: a crawl before anything is designed, and a redirect map written in advance. Skipping that is the most common way a local business loses traffic overnight.',
			),
			array(
				'q' => 'What does the monthly report actually contain?',
				'a' => 'What moved, what did not, what is next and what it is worth, in plain English rather than a long PDF of screenshots. If a month was slow you hear it from me first.',
			),
			array(
				'q' => 'Can I start with an audit and decide later?',
				'a' => 'Yes, and most people should. The audit ends with a prioritized fix list you can hand to any developer, including one who is not me. Nothing in it is withheld to force a second conversation.',
			),
		),
		'webdesign' => array(
			array(
				'q' => 'Do I have to move my hosting?',
				'a' => 'No. The site is built on WordPress and deployed to hosting you own and control. If your current host is the reason the site is slow, you will be told that and shown why, but the decision and the account stay yours.',
			),
			array(
				'q' => 'Can I edit the site myself afterwards?',
				'a' => 'Yes. That is why it is built on WordPress rather than a proprietary builder. Pages, text and images are editable without calling anyone, and the build is documented so any developer can pick it up if you move on.',
			),
			array(
				'q' => 'What happens to my old URLs?',
				'a' => 'Every one of them is mapped before design starts. Old addresses redirect to their closest match on the new site, so links people have saved, links other sites point at, and the rankings attached to them all survive the move.',
			),
			array(
				'q' => 'Is SEO included in a build?',
				'a' => 'The foundations are: crawlable markup, clean heading structure, schema, sensible URLs and Core Web Vitals handled before launch rather than after. Ongoing content and local visibility work is separate, because it continues long after the site ships.',
			),
		),
		'aeo'       => array(
			array(
				'q' => 'Can you guarantee ChatGPT will recommend my business?',
				'a' => 'No, and anyone who does is guessing. Answers vary by phrasing, by session and by release. What can be done is making your business the easiest one to parse, quote and corroborate, then tracking whether that shows up.',
			),
			array(
				'q' => 'Is this just SEO with a new name?',
				'a' => 'It shares a foundation with SEO and is not the same job. Ranking in the SERPs does not put you in an answer if your claims cannot be lifted in one sentence, or the sources those models read never mention you.',
			),
			array(
				'q' => 'How would I know it is working?',
				'a' => 'A fixed set of buying questions your customers would genuinely type, run against the major models every month. You see which answers name you, which name a competitor, and which sources those answers were built from.',
			),
			array(
				'q' => 'Is it too early to bother with this?',
				'a' => 'It is early, which is the argument for rather than against. Very few businesses in this market are doing the work yet, and citations compound the way links always have. Being early is cheap here in a way it will not stay.',
			),
		),
		'about'     => array(
			array(
				'q' => 'Who actually does the work?',
				'a' => 'I do. There is no account manager, no offshore content team and no handoff after the proposal. That is also the limit of the model, which is why I take a small number of clients at a time and say so rather than pretending otherwise.',
			),
			array(
				'q' => 'Do you require a long contract?',
				'a' => 'No. Website builds are fixed scope. Search work is monthly and you can stop at the end of any month. Long lock-ins exist to protect the agency through the months where nothing happens, not to protect the client.',
			),
			array(
				'q' => 'Can I see case studies?',
				'a' => 'Client work is kept private out of respect for the businesses involved, most of whom would rather competitors not know who does their search work. Ask on the call and I will walk you through examples directly.',
			),
			array(
				'q' => 'What if my site does not need the work?',
				'a' => 'Then you will be told that. It happens, and saying so costs less than taking a retainer for work with nowhere to go. Rebuilding a site that did not need rebuilding is the most common way local businesses waste money.',
			),
		),
		'contact'   => array(
			array(
				'q' => 'What do you need from me to start?',
				'a' => 'Your website address, the area you want customers from, and the one search term you wish you owned. That is enough to run the audit. Access to your analytics helps but is not required for a first look.',
			),
			array(
				'q' => 'How quickly will I hear back?',
				'a' => 'Within one business day, from me rather than from a scheduler bot. The audit itself takes longer, because it is run properly before the call rather than assembled during it.',
			),
			array(
				'q' => 'Is the audit really free, and do I keep it?',
				'a' => 'Yes to both. The findings are yours in writing whether or not we work together, and nothing is held back to force a second conversation. If another provider suits you better, the document is just as useful to them.',
			),
			array(
				'q' => 'What if I am not in Jupiter?',
				'a' => 'Still send it. Proximity matters for map results, so the local half of the audit is specific to your area rather than to mine. The technical, content and AI visibility work is the same wherever the business is.',
			),
		),
	);
}

/**
 * Service structured data per page: what this page sells, in the words the
 * page itself uses.
 */
function mcg_page_service() {
	return array(
		'seo'       => array(
			'name' => 'SEO',
			'type' => 'Search engine optimization',
			'desc' => 'Local, technical and content SEO for businesses in Jupiter, Palm Beach Gardens and Tequesta. Google Business Profile optimization, citations and location pages, technical audits and Core Web Vitals, schema, and content written for the question behind the search.',
		),
		'webdesign' => array(
			'name' => 'Web Design and Development',
			'type' => 'Web design',
			'desc' => 'Custom WordPress websites for Palm Beach County businesses, built mobile first, with Core Web Vitals handled before launch, crawlable markup and schema, and a redirect map on every redesign so rankings carry across.',
		),
		'aeo'       => array(
			'name' => 'AI Search Optimization',
			'type' => 'Answer engine optimization',
			'desc' => 'Getting a business named and cited when buyers ask ChatGPT, Gemini, Perplexity or a Google AI Overview for a recommendation. Structured data, quotable claims, consistent business facts, third-party presence, and a fixed question set tracked monthly.',
		),
		'contact'   => array(
			'name' => 'Free SEO Audit',
			'type' => 'SEO audit',
			'desc' => 'A review of current rankings, technical site health and whether AI answers name the business, returned in writing with the three fixes worth doing first.',
		),
	);
}

/* -------------------------------------------------------------------------
 * Renderers
 * ---------------------------------------------------------------------- */

/**
 * The page key currently being rendered, or an empty string.
 *
 * Resolved through mcg_page_id(), which identifies a page by its template
 * rather than its slug, so renaming a page in WordPress changes nothing here.
 */
function mcg_current_key() {
	static $key = null;

	if ( null !== $key ) {
		return $key;
	}

	$key = '';

	if ( is_front_page() ) {
		$key = 'home';
	} elseif ( is_page() ) {
		foreach ( array_keys( mcg_templates() ) as $candidate ) {
			$id = mcg_page_id( $candidate );
			if ( $id && is_page( $id ) ) {
				$key = $candidate;
				break;
			}
		}
	}

	return $key;
}

/** The two question-shaped headings and their answers. */
function mcg_questions( $key, $level = 'h2' ) {
	$all = mcg_page_questions();
	if ( empty( $all[ $key ] ) ) {
		return;
	}

	$level = in_array( $level, array( 'h2', 'h3' ), true ) ? $level : 'h2';

	echo '<div class="qa rv">';
	foreach ( $all[ $key ] as $item ) {
		printf(
			'<div class="qaItem"><%1$s data-tag="&lt;%1$s&gt;">%2$s</%1$s><p>%3$s</p></div>',
			esc_attr( $level ),
			esc_html( $item['q'] ),
			esc_html( $item['a'] )
		);
	}
	echo '</div>';
}

/**
 * The comparison table.
 *
 * A cell of the form @price:option_name reads that Customizer field, so the
 * table shows the price the owner set and nothing is hard-coded here.
 */
function mcg_table( $key ) {
	$all = mcg_page_table();
	if ( empty( $all[ $key ] ) ) {
		return;
	}

	$t = $all[ $key ];
	?>
	<div class="cmpWrap rv">
		<h2 data-tag="&lt;h2&gt;"><?php echo esc_html( $t['head'] ); ?></h2>
		<div class="cmpScroll">
			<table class="cmp">
				<caption><?php echo esc_html( $t['cap'] ); ?></caption>
				<thead>
					<tr>
						<?php foreach ( $t['cols'] as $col ) : ?>
							<th scope="col"><?php echo esc_html( $col ); ?></th>
						<?php endforeach; ?>
					</tr>
				</thead>
				<tbody>
					<?php foreach ( $t['rows'] as $row ) : ?>
						<tr>
							<?php foreach ( $row as $i => $cell ) : ?>
								<?php
								if ( 0 === strpos( $cell, '@price:' ) ) {
									$cell = mcg_opt( substr( $cell, 7 ), 'On request' );
								}
								if ( 0 === $i ) {
									echo '<th scope="row">' . esc_html( $cell ) . '</th>';
								} else {
									echo '<td>' . esc_html( $cell ) . '</td>';
								}
								?>
							<?php endforeach; ?>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
		</div>
	</div>
	<?php
}

/** The page FAQ, as an accordion. Drives the FAQPage schema in the head. */
function mcg_faq_block( $key, $heading = '' ) {
	$all = mcg_page_faqs();
	if ( empty( $all[ $key ] ) ) {
		return;
	}

	$heading = $heading ? $heading : __( 'Questions people ask before they call', 'mcgrath-chrome' );
	?>
	<section class="pageFaq rv">
		<h2 data-tag="&lt;h2&gt;"><?php echo esc_html( $heading ); ?></h2>
		<div class="faq">
			<?php foreach ( $all[ $key ] as $item ) : ?>
				<details>
					<summary><?php echo esc_html( $item['q'] ); ?></summary>
					<p><?php echo esc_html( $item['a'] ); ?></p>
				</details>
			<?php endforeach; ?>
		</div>
	</section>
	<?php
}
