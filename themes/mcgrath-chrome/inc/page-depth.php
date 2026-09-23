<?php
/**
 * The long-form body of each page.
 *
 * Separated from inc/page-seo.php so the short, structural content (head term,
 * meta description, question headings, comparison table, FAQ) stays readable
 * next to the depth sections, which are simply long.
 *
 * Each page is a list of H2 blocks. A block has a heading, an optional intro
 * paragraph, and a list of H3 subsections. Every paragraph is written to be
 * useful to a buyer reading it, not to reach a number.
 *
 * THE RULE THIS FILE IS WRITTEN UNDER: nothing here states a price, a
 * timeframe, a statistic, a client name, a certification, an award, or a
 * capability the theme and the business do not actually have. Where a buyer
 * would want a number, the text says what decides it instead of inventing one.
 *
 * @package mcgrath-chrome
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Long-form sections, keyed by page.
 *
 * Structure: array( array( 'h2' => ..., 'intro' => ..., 'subs' => array(
 *     array( 'h3' => ..., 'p' => array( paragraph, paragraph ) ) ) ) )
 */
function mcg_page_depth() {
	return array(

		/* ================================================================
		 * WEB DESIGN
		 * ============================================================= */
		'webdesign' => array(
			array(
				'h2'    => 'What decides whether a website converts?',
				'intro' => 'A good-looking site that does not turn visits into calls has failed at the only job it had. Three things decide that far more often than the visual design does, and all three are measurable before anyone argues about a colour.',
				'subs'  => array(
					array(
						'h3' => 'How much does site speed matter?',
						'p'  => array(
							'A visitor on a phone, on cellular data, somewhere between the beach and the car, will not wait for a site to assemble itself. They leave, and nothing further down the page ever gets a chance to work. Speed is not a technical nicety that sits beside conversion; it is the gate in front of it.',
							'Google measures this with Core Web Vitals: how long the largest thing on screen takes to appear, how quickly the page responds when somebody taps, and whether the layout jumps around while it loads. Those three are handled during the build rather than diagnosed afterwards, because retrofitting speed into a finished site means undoing decisions that were made for other reasons.',
						),
					),
					array(
						'h3' => 'Should the site be designed for phones first?',
						'p'  => array(
							'Yes. For most local businesses the majority of visits arrive on a phone, which means the phone layout is the design and the desktop layout is the variation. Building the other way round is why so many local sites feel like a desktop page that has been squeezed rather than a page that belongs at that size.',
							'In practice that means text sized to be read at arm\'s length without pinching, tap targets big enough for a thumb rather than a mouse pointer, and forms short enough to finish one-handed. It also means the phone number is a link that dials rather than a picture of a number.',
						),
					),
					array(
						'h3' => 'How many calls to action should a page have?',
						'p'  => array(
							'Every screen should have one thing it is clearly asking you to do. When a page offers four equally weighted choices, most visitors take none of them. The design decides which single action wins on each screen, and everything else steps back to support it.',
							'That is also why the way to contact you stays reachable the whole way down the page rather than waiting at the bottom. A visitor who has decided halfway through should not have to hunt for the way to act on it.',
						),
					),
				),
			),
			array(
				'h2'    => 'How does a website build actually run?',
				'intro' => 'No surprises, and nothing designed before the things that constrain it are known. The order below exists because doing it in any other order is how redesigns lose rankings.',
				'subs'  => array(
					array(
						'h3' => 'What happens before anything is designed?',
						'p'  => array(
							'The current site gets crawled and every URL listed, along with what each one earns today. That inventory is the thing a redesign is measured against later, and it cannot be reconstructed after the old site is gone. Skipping this step is the single most expensive shortcut available in web design.',
							'Alongside it: what your buyers actually need to know, in the order they need to know it, and which pages currently answer those questions. Some pages turn out to be worth keeping word for word.',
						),
					),
					array(
						'h3' => 'What happens during design and build?',
						'p'  => array(
							'Drawn at phone width first, then opened out. Built on WordPress rather than a proprietary builder, so the site remains editable by you and by any developer who comes after, with no licence to keep paying for and no platform holding your content.',
							'Custom throughout, not a marketplace theme with your logo dropped into it. A purchased theme carries every feature its author imagined anyone might want, and your visitors download all of it whether your business uses it or not.',
						),
					),
					array(
						'h3' => 'What happens after launch?',
						'p'  => array(
							'Launch is not the end of the work. The site gets crawled again immediately afterwards and the new URLs checked against the old inventory, so anything that failed to redirect is caught in days rather than discovered months later when the traffic is already gone.',
							'Analytics and Search Console are confirmed to be recording, because a tracking tag that silently stopped working is indistinguishable from a site that stopped performing until somebody checks.',
						),
					),
				),
			),
			array(
				'h2'    => 'Is the site built to be found as well as to look right?',
				'intro' => 'Yes, and the two are not the same job. A site can be beautiful and effectively invisible. These are the parts of a build that decide whether search engines, and now answer engines, can make sense of it at all.',
				'subs'  => array(
					array(
						'h3' => 'What makes a site readable to a search engine?',
						'p'  => array(
							'One H1 per page, headings that describe the section beneath them rather than decorate it, and real text rather than words baked into images. Schema markup states in machine-readable form what the business is, where it works and what it sells, so a search engine is not left inferring it from paragraphs.',
							'Clean, readable URLs that describe the page and then stay put. A URL that changes is a URL that has to be redirected forever afterwards, so the structure is worth deciding once and deciding carefully.',
						),
					),
					array(
						'h3' => 'How will the site look when somebody shares a link?',
						'p'  => array(
							'A link pasted into a message, a group chat or a social post is rendered by whatever platform received it, using tags in the page. Left unset, those platforms guess, and a link to your business arrives looking like an error. The build sets a title, a description and an image for each page so a shared link arrives looking deliberate.',
							'This matters more for local businesses than for most, because a large share of local recommendation still happens by somebody sending somebody else a link rather than by a search at all.',
						),
					),
					array(
						'h3' => 'Can one site rank locally and nationally?',
						'p'  => array(
							'Yes, though not from the same pages. Ranking in Jupiter and ranking across the United States are not competing goals, but they are answered by different pages. Location pages carry the local signals; service and comparison pages carry the ones that work anywhere. One site does both when its structure separates them properly.',
							'Trying to make a single page serve both usually produces a page that is slightly wrong for each, which is a common reason a local site plateaus once it has taken the easy local terms.',
						),
					),
				),
			),
			array(
				'h2'    => 'What is not included in a build?',
				'intro' => 'Worth saying plainly, so nobody discovers it after the fact.',
				'subs'  => array(
					array(
						'h3' => 'What are the honest limits?',
						'p'  => array(
							'No proprietary platform, which also means no platform to blame and no one-click features that only exist inside somebody\'s builder. No stock photography pretending to be your premises or your team. No guarantee about a position in the SERPs, from a build or from anything else, because nobody controls that.',
							'And no rebuild when the site does not need one. If the audit says the structure, speed and URL layout are sound, the honest recommendation is to keep the site and spend the money on the pages and the local signals instead.',
						),
					),
				),
			),
			array(
				'h2'    => 'What does a website cost?',
				'intro' => 'No price is invented on this page. What follows is what actually moves a web design quote up or down, so you can tell whether a number you have been given anywhere is reasonable.',
				'subs'  => array(
					array(
						'h3' => 'What makes a build cost more?',
						'p'  => array(
							'Page count, mostly, and how different those pages are from each other. Ten pages built from three layouts is a far smaller job than ten pages that each need their own thinking. After that: anything that has to talk to another system, anything involving payments or bookings, and content that does not exist yet.',
							'A redesign of a large existing site also carries the URL mapping work, which is invisible in a mockup and is the part that protects the traffic you already have.',
						),
					),
					array(
						'h3' => 'What does not change the price much?',
						'p'  => array(
							'Visual ambition, within reason. A distinctive design and a plain one take similar time to build once the thinking is done; the difference sits in the design stage rather than the build. Wanting it to look good is not the expensive part.',
						),
					),
					array(
						'h3' => 'What kind of quote should I expect?',
						'p'  => array(
							'A fixed number for a fixed scope, written down, with what is and is not in it. Hourly billing on a website build transfers all the risk of a vague brief onto you. If the scope genuinely cannot be pinned down yet, the honest move is a paid discovery step rather than a guess dressed as a quote.',
						),
					),
				),
			),
		),

		/* ================================================================
		 * SEO
		 * ============================================================= */
		'seo'       => array(
			array(
				'h2'    => 'How does search decide who ranks in Jupiter?',
				'intro' => 'Local search runs on different machinery from national search, and most of the frustration local businesses feel comes from being sold one when they needed the other.',
				'subs'  => array(
					array(
						'h3' => 'Does my location affect where I rank?',
						'p'  => array(
							'Yes, more than almost any other factor. For a search with local intent, how close the searcher is to your business is one of the strongest signals in play. Somebody standing in Abacoa and somebody standing in Tequesta get different results for the same words. This is why a single ranking position is a fiction for local terms: there is no one result, there is a result per location.',
							'It also means the honest question is not "am I number one" but "in how much of the area I serve do I appear at all". That is what gets tracked, because it is the thing that corresponds to the phone ringing.',
						),
					),
					array(
						'h3' => 'Are the map pack and the organic SERPs the same contest?',
						'p'  => array(
							'No, they are separate. The map results and the ten blue links beneath them are ranked by different systems using different inputs. Your Google Business Profile, your reviews and your citations drive the first. Your website, its content and the links pointing at it drive the second. Winning one does not automatically win the other, and a business can dominate the map pack while being absent from the organic SERPs below it.',
							'Both are worth having, and they need different work, which is why local and organic are run together here rather than sold as separate products.',
						),
					),
					array(
						'h3' => 'Can anyone promise me a number one position?',
						'p'  => array(
							'No, and that includes me. Results vary by location, by device, by whether the searcher is signed in, and by what the algorithm did last week. Anyone quoting a specific position by a specific date is either guessing or selling. What can be promised is the work, the reasoning behind it, and honest reporting of what it moved.',
						),
					),
				),
			),
			array(
				'h2'    => 'What happens in the first ninety days?',
				'intro' => 'Not a fixed programme, because the audit decides the order. But the shape is consistent, and it starts with the cheapest wins rather than the most impressive-sounding ones.',
				'subs'  => array(
					array(
						'h3' => 'What gets fixed first?',
						'p'  => array(
							'Pages that cannot be crawled, pages that load slowly on a phone, redirect chains left over from an old redesign, duplicate URLs competing with each other, and thin pages dragging on the rest. None of it is interesting and all of it is cheaper to fix than to work around.',
							'This comes first because every later effort is multiplied or wasted by it. Publishing good content onto a site search engines struggle to crawl is paying twice for one result.',
						),
					),
					array(
						'h3' => 'Which pages get attention first?',
						'p'  => array(
							'Most sites already rank just off the bottom of the first page for terms nobody noticed. Moving an existing page that is close is faster and cheaper than starting a new page from nothing, because the page already has whatever authority got it that far.',
							'That list comes out of the audit and usually surprises people, because the terms are rarely the ones they assumed they were competing for.',
						),
					),
					array(
						'h3' => 'When does new content start?',
						'p'  => array(
							'New pages, new local signals and new content come after the foundation is sound and the easy ground is taken. Doing it in the other order is how a business ends up with a content programme sitting on top of a site that cannot support it.',
						),
					),
				),
			),
			array(
				'h2'    => 'What am I actually paying for?',
				'intro' => 'Worth being concrete about, because "SEO" as a product description covers everything from genuine engineering to a monthly PDF.',
				'subs'  => array(
					array(
						'h3' => 'Am I paying for a tool or for work?',
						'p'  => array(
							'For work. A tool licence resold to you with a login is not a service. Tools are used here, but what you are paying for is the judgement about which of the thousand things a tool flags are worth doing on your site this month, and then the doing of them.',
						),
					),
					array(
						'h3' => 'Who owns the accounts and the work?',
						'p'  => array(
							'Your site, your hosting, your analytics, your Google Business Profile, your content, all under your own accounts. Nothing is held in an agency account that you lose access to if you leave. The audit document is yours to hand to anybody, including a different provider.',
						),
					),
					array(
						'h3' => 'Does this work outside Jupiter?',
						'p'  => array(
							'Yes. The local work is specific to Jupiter, Palm Beach Gardens, Tequesta and the surrounding towns. The organic and technical work is identical for a business selling across the United States, and plenty of clients need both at once from the same site.',
						),
					),
				),
			),
			array(
				'h2'    => 'How do you choose which terms to target?',
				'intro' => 'Half of the value in search work is deciding what not to chase. The wrong target list produces months of effort against terms that were never going to convert.',
				'subs'  => array(
					array(
						'h3' => 'Should I chase the highest volume keywords?',
						'p'  => array(
							'Usually not. A term with high search volume attracts high competition and, for a local business, frequently attracts the wrong people entirely. Somebody searching a broad industry term may be three states away and researching for a school project. Somebody searching a specific service alongside a town name is much closer to calling.',
							'The terms worth having are usually narrower, lower volume and unglamorous, which is exactly why they are still available.',
						),
					),
					array(
						'h3' => 'What can I learn from the terms competitors already own?',
						'p'  => array(
							'Competitor analysis is most useful for what it reveals about intent rather than for the ranking table. The pages earning traffic for a competitor tell you which questions their buyers actually ask, and those questions are frequently not the ones either of you put in your headlines.',
						),
					),
					array(
						'h3' => 'Is it worth ranking for a term like best SEO company?',
						'p'  => array(
							'Rarely. Superlative terms look attractive and convert poorly, because the people typing them are comparing rather than buying, and the results are dominated by directories and listicles rather than by businesses. Ranking for the thing your customer types when they have decided is worth more than ranking for the thing they type while browsing.',
						),
					),
				),
			),
			array(
				'h2'    => 'What do the technical terms in an audit actually mean?',
				'intro' => 'Three terms that come up in every audit, in plain language, so you can tell whether somebody is describing a real problem or padding a report.',
				'subs'  => array(
					array(
						'h3' => 'What are crawling and indexing?',
						'p'  => array(
							'Crawling is a search engine reading your pages. Indexing is deciding to store them. A page can be crawled and not indexed, which is the silent failure mode: it exists, it looks fine to you, and it is not eligible to rank at all. Most sites have some of these and almost nobody knows which.',
						),
					),
					array(
						'h3' => 'What are Core Web Vitals?',
						'p'  => array(
							'Three measurements of how a page feels while loading: how long the main content takes to appear, how quickly it reacts when tapped, and whether things shift around under your finger. They are measured on real visits from real phones, not in a lab, which is why a site that feels fine on your desk can still be failing them.',
						),
					),
				),
			),
		),

		/* ================================================================
		 * AI VISIBILITY
		 * ============================================================= */
		'aeo'       => array(
			array(
				'h2'    => 'How does an answer engine pick who to name?',
				'intro' => 'Nobody outside those companies has the full picture, and anybody claiming otherwise is selling. What is observable, repeatedly and across models, is the shape of what gets quoted.',
				'subs'  => array(
					array(
						'h3' => 'Can a model actually read your pages?',
						'p'  => array(
							'Only if the page makes it easy. A model answering a question assembles it from sources it can read cleanly. A page where the key claim is inside an image, buried in a paragraph that needs three sentences of context, or loaded by a script after the fact, is harder to use than one where the claim sits in a sentence directly under a heading that asks the question.',
							'This is why the same structural work that helps a crawler helps here: headings that pose the question, answers that stand alone, and structured data stating plainly what the business is and where it operates.',
						),
					),
					array(
						'h3' => 'Why would a model trust your business?',
						'p'  => array(
							'One page claiming something is weak evidence. The same fact stated consistently on your site, your Google Business Profile, the directories that cover your industry and any coverage you have elsewhere is much stronger. Models lean on corroboration, and inconsistent business details actively work against you.',
							'This is the least glamorous part of the work and frequently the highest-yield: making the basic facts about your business identical everywhere they appear.',
						),
					),
					array(
						'h3' => 'What happens if you are not named?',
						'p'  => array(
							'A traditional search result gives you ten positions and a page two beyond it. An answer names two or three businesses and lists a handful of sources. Being fourth in that context is the same as being absent, which changes what the work is aiming at: not presence, but quotability.',
						),
					),
				),
			),
			array(
				'h2'    => 'What gets measured, and how?',
				'intro' => 'Without measurement this whole category is a story an agency tells you. With it, it is a number that either moves or does not.',
				'subs'  => array(
					array(
						'h3' => 'Why use a fixed question set?',
						'p'  => array(
							'A list of the questions your buyers would genuinely type, written in their words rather than as keyword strings. Some name your town, some do not, because the two behave differently. The set stays the same month to month, because a set that changes cannot show a trend.',
						),
					),
					array(
						'h3' => 'Why track each engine separately?',
						'p'  => array(
							'ChatGPT, Gemini, Perplexity and Google\'s AI Overviews reach different conclusions from the same question, because they read different sources and weight them differently. Treating them as one channel hides exactly the information you need.',
							'The record for each run captures whether you were named, who else was, and which URLs the answer drew on. That last part is the actionable one: it tells you which third-party pages are shaping the answer about your market.',
						),
					),
					array(
						'h3' => 'What can the numbers not tell you?',
						'p'  => array(
							'Model answers vary between sessions and change when a model is updated. A single run is an anecdote. The reason for the fixed set and the monthly cadence is to get past that variance to something that behaves like a trend, and it is still a noisier signal than rank tracking. Said plainly rather than dressed up.',
						),
					),
				),
			),
			array(
				'h2'    => 'Where does this fit against the rest of your marketing?',
				'intro' => 'It is not a replacement for search work and it is not a separate product bolted onto your marketing.',
				'subs'  => array(
					array(
						'h3' => 'Is the foundation the same as SEO?',
						'p'  => array(
							'Largely, yes. A site that is fast, cleanly structured, honestly written and genuinely useful does well in the SERPs and gets quoted in answers. Most of the work that helps one helps the other, which is why buying AI visibility disconnected from your actual website gets you a dashboard rather than a result.',
						),
					),
					array(
						'h3' => 'What is genuinely different from SEO?',
						'p'  => array(
							'The format of the content, and the weight on sources you do not own. Writing so a claim can be lifted whole is a different discipline from writing to rank, and building presence on the third-party pages a model already reads looks more like public relations than like link building.',
						),
					),
					array(
						'h3' => 'Why does being early matter?',
						'p'  => array(
							'Very few businesses in this market are doing any of this yet, and the sources these models trust accumulate slowly, the way links always have. Nothing about that advantage is permanent, but it is currently cheap, and it will not be once it is obvious.',
						),
					),
				),
			),
			array(
				'h2'    => 'What can you control, and what can you not?',
				'intro' => 'Useful to separate, because effort spent in the third category is effort wasted, and a lot of what gets sold in this space lives there.',
				'subs'  => array(
					array(
						'h3' => 'What do you fully control?',
						'p'  => array(
							'Structure, claims, structured data, speed, and how easy your content is to quote. This is where the work starts because it is the only part that responds directly to effort, and because everything else depends on it being right.',
						),
					),
					array(
						'h3' => 'What can you only influence?',
						'p'  => array(
							'Directories, review platforms, industry sites and local coverage. You cannot edit most of them, but you can make sure the facts they hold about you are correct and consistent, and you can earn a place on the ones that matter. This is slow and it compounds.',
						),
					),
					array(
						'h3' => 'What can nobody control?',
						'p'  => array(
							'How a model weighs its sources, what it does after an update, and how it phrases an answer on any given day. Nobody outside those companies controls this, and anybody offering to is describing something they cannot deliver. The work aims at being the easiest business to name, then measures whether that is happening.',
						),
					),
				),
			),
			array(
				'h2'    => 'Do I need a new website to start?',
				'intro' => 'No. This does not require a new website. The first pass is usually changes to pages you already have.',
				'subs'  => array(
					array(
						'h3' => 'What happens in the first pass?',
						'p'  => array(
							'Structured data added or corrected, the claims on your key pages rewritten so each can be lifted as a single sentence, and your business facts made consistent across the places that already list you. None of that touches the design, and all of it is reversible.',
						),
					),
					array(
						'h3' => 'What usually changes first?',
						'p'  => array(
							'The answer to the most common buying question in your market, which is often buried three paragraphs into a page rather than sitting under a heading that asks it. Moving it is a small edit that changes whether a model can use the page at all.',
						),
					),
				),
			),
			array(
				'h2'    => 'What does this not require?',
				'intro' => 'Two things people assume are prerequisites and are not.',
				'subs'  => array(
					array(
						'h3' => 'Do I need a new website?',
						'p'  => array(
							'Usually not. If the site is structurally sound, the work happens inside the pages you already have. A rebuild is recommended when the structure genuinely blocks the work, and is argued for rather than assumed, because a rebuild you did not need is the most expensive way to start anything.',
						),
					),
					array(
						'h3' => 'Do I need a big budget?',
						'p'  => array(
							'No. The first pass is edits to existing pages and corrections to listings you already have. It is not cheap because it is small, it is cheap because the expensive part of this work is deciding what to change, and that decision is made once.',
						),
					),
				),
			),
		),

		/* ================================================================
		 * ABOUT
		 * ============================================================= */
		'about'     => array(
			array(
				'h2'    => 'What can one person do, and what can they not?',
				'intro' => 'The model has a real ceiling. Being straight about where it sits is more useful to you than a capability list that quietly assumes a team behind it.',
				'subs'  => array(
					array(
						'h3' => 'What do you get that an agency cannot give you?',
						'p'  => array(
							'The person who ran your audit is the person who writes your pages and the person who answers when you email. Nothing is lost in the handover from the sales call to the account, because there is no handover. When you ask why something was done, the answer comes from whoever decided it.',
							'It also means the work is not padded to justify a headcount. A month with less worth doing is a smaller month, not an invented deliverable.',
						),
					),
					array(
						'h3' => 'What does an agency genuinely do better?',
						'p'  => array(
							'Volume, and breadth outside search. A large team can produce far more content per month than one person, run paid media across several platforms at once, and absorb a sudden deadline without everything else stopping. If those are what you need, an agency is the right answer and I will say so.',
							'There is also a resilience point worth naming: one person gets ill and takes holidays. A team covers that and I do not.',
						),
					),
					array(
						'h3' => 'Why is the client list short?',
						'p'  => array(
							'Taking on more clients than the work allows is the standard way this model fails, and it fails quietly: nobody is told their account has become a checklist. The number stays small on purpose, which occasionally means saying no to work worth having.',
						),
					),
				),
			),
			array(
				'h2'    => 'How is the work reported?',
				'intro' => 'The most common complaint about search work is not that it failed, it is that nobody could tell either way.',
				'subs'  => array(
					array(
						'h3' => 'Does the report show what actually shipped?',
						'p'  => array(
							'Yes, by name. The report names the pages and URLs that changed and what was done to each. Activity that produced nothing you can point at is not a result, and reporting it as one is how retainers survive years of nothing happening.',
						),
					),
					array(
						'h3' => 'Will you tell me when nothing moved?',
						'p'  => array(
							'Yes, in the month it happens. Rankings and visibility in the SERPs, the map results, and whether AI answers named you. Months where the numbers went sideways are reported as months where the numbers went sideways, with what I think the reason was.',
							'Search work has genuinely slow stretches, particularly early on while technical fixes are still settling. A report that shows a clean upward line every single month is a report that has been curated.',
						),
					),
					array(
						'h3' => 'How will I know what is next?',
						'p'  => array(
							'The following month\'s priority and the reasoning for it, so you can disagree before the work happens rather than after. If you think something else matters more, that is usually worth acting on, because you know your buyers better than any audit does.',
						),
					),
				),
			),
			array(
				'h2'    => 'What is it like to work together?',
				'intro' => 'The mechanics, so there are no surprises about what is expected from either side.',
				'subs'  => array(
					array(
						'h3' => 'What do you need from me?',
						'p'  => array(
							'Access to the site, the analytics and the Google Business Profile, under your own accounts. Beyond that, the answers only you have: what customers actually ask, which jobs are worth the most, which work you would rather not do more of. That last one shapes the strategy more than any tool output.',
						),
					),
					array(
						'h3' => 'How much of my time will this take?',
						'p'  => array(
							'Little, by design, and it is front-loaded. The first conversation is the longest. After that it is a report to read and the occasional question only you can answer. Work that needs your sign-off is flagged as such rather than assumed.',
						),
					),
					array(
						'h3' => 'What happens if I want to leave?',
						'p'  => array(
							'Stop at the end of any month. Everything is already in your accounts, so there is nothing to hand back and no export to request. Search work is monthly and website builds are fixed scope, and neither is structured to make going somewhere else difficult.',
						),
					),
				),
			),
			array(
				'h2'    => 'How do you decide what to work on?',
				'intro' => 'The same reasoning every month, applied to whatever the site and the numbers are saying.',
				'subs'  => array(
					array(
						'h3' => 'What gets prioritised first?',
						'p'  => array(
							'Not the most impressive-sounding work. A redirect chain quietly bleeding authority is duller than a content programme and frequently worth more this month. The order is chosen by expected effect divided by effort, and it is explained rather than asserted.',
						),
					),
					array(
						'h3' => 'Why do some months contain fewer items?',
						'p'  => array(
							'Half-done work is worth close to nothing in search. Ten pages improved properly beats forty touched lightly, which is why a month sometimes contains fewer items than it could have.',
						),
					),
					array(
						'h3' => 'Will you tell me if my idea will not work?',
						'p'  => array(
							'Yes, with the reason. If something you have asked for will not work, you get told and given the reason, rather than quietly deprioritised. That includes ideas of mine that turned out to be wrong, which happens and is worth reporting rather than burying.',
						),
					),
					array(
						'h3' => 'Would you ever recommend somebody else?',
						'p'  => array(
							'Yes. If the job needs a team, a media buying department, or a specialism outside search and web, saying so is faster and cheaper for you than finding out over two quarters. It has cost me work and it is still the right call.',
						),
					),
				),
			),
			array(
				'h2'    => 'What should I ask any SEO provider?',
				'intro' => 'Including me. If the answers are vague, that is the finding.',
				'subs'  => array(
					array(
						'h3' => 'Who will actually do the work?',
						'p'  => array(
							'Not who is on the call, who touches the account day to day. In a lot of arrangements those are different people and nobody says so until the contract is signed.',
						),
					),
					array(
						'h3' => 'What happens when you leave a provider?',
						'p'  => array(
							'Ask where the accounts live. If the site, the hosting, the analytics or the Google Business Profile sit inside an agency login, leaving costs you the asset, and that arrangement was a decision somebody made for you.',
						),
					),
					array(
						'h3' => 'How does a provider decide what to do next month?',
						'p'  => array(
							'A good answer describes a reason. A weak answer describes a package. If the plan for month six is already written before the audit has run, it is not a plan, it is a product.',
						),
					),
				),
			),
			array(
				'h2'    => 'How do I see the work rather than a summary?',
				'intro' => 'Two more worth pinning down with anybody, including me.',
				'subs'  => array(
					array(
						'h3' => 'Can I see exactly what changed?',
						'p'  => array(
							'Yes. You should be able to look at a page and see the difference, or read a report that names the URL. Work that can only be described in the abstract is work you cannot verify happened, and that is the arrangement most bad retainers rely on.',
						),
					),
					array(
						'h3' => 'What does the contract lock in?',
						'p'  => array(
							'Notice period, ownership of the work produced, and what happens to content and accounts if you stop. A short agreement that answers those three plainly is worth more than a long one that answers none of them.',
						),
					),
					array(
						'h3' => 'Does anyone check the result?',
						'p'  => array(
							'Only if you agree the measure in advance. Ask how success will be measured before the work starts, not after. A measure agreed in advance is a measure nobody can move later, which is precisely why vague engagements avoid setting one.',
						),
					),
					array(
						'h3' => 'Will they ever say no to work?',
						'p'  => array(
							'A good one will. A provider who has never turned down work has never had a reason to protect their existing clients\' time, which tells you something about how yours will be treated.',
						),
					),
				),
			),
		),

		/* ================================================================
		 * CONTACT / FREE AUDIT
		 * ============================================================= */
		'contact'   => array(
			array(
				'h2'    => 'What does the audit actually examine?',
				'intro' => 'Run before we speak, so the conversation is about findings rather than about what your business does.',
				'subs'  => array(
					array(
						'h3' => 'Where do I stand now?',
						'p'  => array(
							'What the site ranks for today, across the organic SERPs and the map results, and just as importantly what it nearly ranks for. That second list is usually where the fastest movement is available, and it is almost always full of terms the owner did not know they were in contention for.',
						),
					),
					array(
						'h3' => 'What is technically wrong with my site?',
						'p'  => array(
							'Crawling and indexing, speed on a phone rather than on a desk, redirect chains, duplicate URLs competing with each other, and pages too thin to earn anything. This part produces a prioritized fix list written so a developer can work from it without needing me to explain it.',
						),
					),
					array(
						'h3' => 'Do AI answers know my business exists?',
						'p'  => array(
							'That is exactly what this part checks. A set of buying questions run against the major models to see whether your business is named, who is named instead, and which sources those answers drew on. For most local businesses the honest answer today is that they are invisible in this channel, which is worth knowing while it is still cheap to change.',
						),
					),
				),
			),
			array(
				'h2'    => 'What happens on the call?',
				'intro' => 'One conversation. No deck, no proposal sequence afterwards, no follow-up cadence.',
				'subs'  => array(
					array(
						'h3' => 'What do we cover on the call?',
						'p'  => array(
							'What is wrong, what it is costing, and which three things are worth doing first. You can ask why about any of it, and the answer will be the actual reasoning rather than a sales line.',
						),
					),
					array(
						'h3' => 'Will you tell me if we are not a fit?',
						'p'  => array(
							'Sometimes the honest conclusion is that the site is in good shape and the money belongs somewhere other than search. Sometimes it is that the job needs a team rather than one person. Both get said on the call rather than discovered three months into a retainer.',
						),
					),
					array(
						'h3' => 'Do I keep the findings either way?',
						'p'  => array(
							'Yes. In writing, yours, whether or not anything follows. Nothing is withheld to force a second conversation, and the document is just as usable by your own developer or by another agency as it is by me.',
						),
					),
				),
			),
			array(
				'h2'    => 'Who is this for, and who is it not for?',
				'intro' => 'Worth being direct, so you can decide before spending the time.',
				'subs'  => array(
					array(
						'h3' => 'Is this right for a business around Jupiter?',
						'p'  => array(
							'Yes, and this is where it is sharpest. Proximity decides local results, so the local half of the audit is specific to the streets your customers search from rather than to a county-wide average. Jupiter, Palm Beach Gardens, Tequesta, Juno Beach, Abacoa, Jupiter Farms, Hobe Sound and Stuart are the area this is built around.',
						),
					),
					array(
						'h3' => 'Is this right for a business elsewhere in the United States?',
						'p'  => array(
							'Yes. Still worth sending. The technical review, the content gaps and the AI visibility check work identically wherever the business is, and the local portion is simply built around your area instead of mine. Plenty of the work here is national rather than local.',
						),
					),
					array(
						'h3' => 'When is this not the right call?',
						'p'  => array(
							'If what you need is paid media managed across several platforms, a large monthly content volume, or a team that can absorb a sudden deadline, one person is the wrong shape for it. Sending the form anyway is fine; you will get told that rather than sold around it.',
						),
					),
				),
			),
			array(
				'h2'    => 'What should I do before sending the form?',
				'intro' => 'Nothing here is required. It just makes the first pass more useful.',
				'subs'  => array(
					array(
						'h3' => 'What is worth having ready?',
						'p'  => array(
							'Your website address, the area you want customers from, and the one search term you wish you owned. If you have read access to analytics and Search Console, that turns a good audit into a much better one, but it is not a condition of getting a reply.',
						),
					),
					array(
						'h3' => 'What should I not worry about?',
						'p'  => array(
							'The state of your current site. An honest description of what is broken is more useful than a tidy one, and there is nothing in this category I have not seen before. You do not need to prepare anything or fix anything first.',
						),
					),
					array(
						'h3' => 'What if I already work with somebody?',
						'p'  => array(
							'Still fine to send. An outside read on the work is reasonable to want, and a second opinion that concludes your current provider is doing a good job is a genuinely useful result. I will tell you that if it is what I find.',
						),
					),
				),
			),
			array(
				'h2'    => 'What happens after the audit?',
				'intro' => 'Both outcomes, stated up front.',
				'subs'  => array(
					array(
						'h3' => 'What if we work together?',
						'p'  => array(
							'The fix list becomes the first month, technical work first. Everything stays in your own accounts from the start, so there is never a handover to negotiate later.',
						),
					),
					array(
						'h3' => 'What if we do not work together?',
						'p'  => array(
							'You keep the findings and the prioritized fix list, in writing. They are written to be handed to any developer, so the work has value whether or not it is done by me.',
						),
					),
					array(
						'h3' => 'What happens to the details I send?',
						'p'  => array(
							'The enquiry form emails it and stores nothing in the site database. Your details are not added to a mailing list, and there is no follow-up sequence. If you do not reply, you will not hear from me again.',
						),
					),
				),
			),
			array(
				'h2'    => 'What situations does this usually start from?',
				'intro' => 'Three common ones, and what the first move tends to be in each.',
				'subs'  => array(
					array(
						'h3' => 'What if I have no website yet?',
						'p'  => array(
							'The audit still applies, because your Google Business Profile, your listings and whatever does exist are already shaping what people find. Often there is visibility to claim before a single page is built.',
						),
					),
					array(
						'h3' => 'What if the site is fine but the phone is quiet?',
						'p'  => array(
							'Usually a visibility problem rather than a website problem, and occasionally a conversion problem hiding as one. The audit separates those two, which matters because the fixes cost very different amounts.',
						),
					),
					array(
						'h3' => 'What if my rankings dropped after a redesign?',
						'p'  => array(
							'The most fixable of the three and the most urgent. It is nearly always URLs that changed without redirects, and the longer it runs the more of the old authority decays. This is worth sending today rather than next month.',
						),
					),
				),
			),
			array(
				'h2'    => 'What other situations are worth sending?',
				'intro' => 'Both are common and both are time-sensitive in ways owners tend to underestimate.',
				'subs'  => array(
					array(
						'h3' => 'What if a competitor started outranking me?',
						'p'  => array(
							'Usually they did something specific rather than something magical, and it is generally visible: pages they added, listings they cleaned up, reviews they started collecting. The audit identifies which, so the response is targeted rather than a general panic about doing more marketing.',
						),
					),
					array(
						'h3' => 'What if I am about to rebuild the site?',
						'p'  => array(
							'This is the best possible moment to get an outside read, and the one almost nobody uses. A crawl and a URL inventory taken before the rebuild starts costs very little and is the only thing standing between a redesign and the traffic it can quietly destroy.',
						),
					),
					array(
						'h3' => 'What if nothing is wrong and I just want a second opinion?',
						'p'  => array(
							'Entirely reasonable, and the outcome is often that the site is fine. That is a useful thing to know with certainty rather than to assume, particularly before committing to a year of somebody\'s retainer. You get told plainly if that is the conclusion.',
						),
					),
					array(
						'h3' => 'What if I inherited a site nobody understands?',
						'p'  => array(
							'More common than people admit, particularly after a staff change or an agency ending badly. The audit doubles as documentation in that case: what exists, where it lives, what it earns and what is quietly broken. That document is useful even if you never hire anybody, because it is the map nobody left you.',
						),
					),
				),
			),
		),

		/* ================================================================
		 * HOMEPAGE
		 * ============================================================= */
		'home'      => array(
			array(
				'h2'    => 'Three places a buyer can find you',
				'intro' => 'They are ranked by different machinery and won by different work. Most local businesses are strong in one and absent from the other two without knowing it.',
				'subs'  => array(
					array(
						'h3' => 'The organic results',
						'p'  => array(
							'The ten blue links, decided by whether your site is relevant, technically sound and trusted enough. This is the slowest of the three to move and the most durable once it does, because it rests on the site you own rather than on a profile somebody else hosts.',
						),
					),
					array(
						'h3' => 'The map pack',
						'p'  => array(
							'The three local results with the map above them, decided largely by how close the searcher is, how complete and active your Google Business Profile is, and your reviews. It often moves faster than organic, and for a business that depends on people nearby it is frequently the more valuable of the two.',
						),
					),
					array(
						'h3' => 'The answer',
						'p'  => array(
							'Increasingly the first thing a buyer sees: a paragraph naming two or three businesses, assembled by a model from sources it can parse and has reason to trust. There is no page two in that format, so being considered and not named is the same as being absent.',
						),
					),
				),
			),
			array(
				'h2'    => 'What this business actually is',
				'intro' => 'Said plainly, because the category is full of companies whose description could belong to anyone.',
				'subs'  => array(
					array(
						'h3' => 'One person, accountable',
						'p'  => array(
							'Tyler McGrath. The person who runs your audit writes your pages and answers your email. No account manager, no handoff after the proposal, and no offshore content team. The limit of that model is volume, which is why the client list stays short and why that is said here rather than discovered later.',
						),
					),
					array(
						'h3' => 'Jupiter first, the United States when it applies',
						'p'  => array(
							'The local work is built around Jupiter, Palm Beach Gardens, Tequesta and the towns around them, because proximity is what decides local results and local knowledge is not something you can read off a tool. The technical, content and AI visibility work is identical for a business selling anywhere in the country.',
						),
					),
					array(
						'h3' => 'Priced in the open',
						'p'  => array(
							'You get a number before a meeting rather than after one. Website builds are fixed scope, search work is monthly, and you can stop at the end of any month. Long lock-ins exist to protect the agency through the months where nothing happens.',
						),
					),
				),
			),
			array(
				'h2'    => 'How to tell whether search work is being done properly',
				'intro' => 'Useful whether or not you ever hire anybody here, and the questions are the same for any provider.',
				'subs'  => array(
					array(
						'h3' => 'Ask what shipped, not what was worked on',
						'p'  => array(
							'A report should name the pages and URLs that changed. Activity that produced nothing you can point at is not a result, and a report made of effort rather than output is the single clearest warning sign in this industry.',
						),
					),
					array(
						'h3' => 'Ask what did not work',
						'p'  => array(
							'Search work has slow months. A report showing a clean upward line every single month has been curated, and whoever curated it is now managing your perception rather than your rankings.',
						),
					),
					array(
						'h3' => 'Ask who holds the accounts',
						'p'  => array(
							'Your site, hosting, analytics and Google Business Profile should be in your name. If any of them sit inside an agency account, leaving costs you the asset, and that arrangement is a choice somebody made on your behalf.',
						),
					),
				),
			),
			array(
				'h2'    => 'The mistakes that cost local businesses the most',
				'intro' => 'All three are common, all three are expensive, and all three are avoidable by knowing about them in advance.',
				'subs'  => array(
					array(
						'h3' => 'Rebuilding a site that did not need rebuilding',
						'p'  => array(
							'The most common way money disappears in this category. A site that is structurally sound and merely looks dated does not need replacing; it needs its speed, structure and content attended to. A rebuild also puts every ranking the old site earned at risk for no reason.',
						),
					),
					array(
						'h3' => 'Changing URLs without redirects',
						'p'  => array(
							'The second most common, and the most damaging. When a redesign changes addresses and nobody maps the old ones to the new, every link pointing at the site breaks at once and the rankings attached to those addresses go with them. It is entirely preventable with a crawl beforehand.',
						),
					),
					array(
						'h3' => 'Treating reviews as a one-off push',
						'p'  => array(
							'A burst of reviews followed by two years of silence reads differently from a steady trickle, both to customers reading them and to the systems ranking the map results. Reviews are a process rather than a campaign.',
						),
					),
				),
			),
			array(
				'h2'    => 'What the first ninety days usually look like',
				'intro' => 'Not a fixed programme, because the audit decides the order. But the shape is consistent across most engagements, and it deliberately starts with the least impressive work.',
				'subs'  => array(
					array(
						'h3' => 'Weeks one and two: find out what is true',
						'p'  => array(
							'The site gets crawled, the rankings recorded, the Google Business Profile reviewed and a set of buying questions run against the AI engines. This produces the baseline everything afterwards is measured against, and it frequently contradicts what the owner believed was happening.',
						),
					),
					array(
						'h3' => 'The rest of the first month: fix what is broken',
						'p'  => array(
							'Technical issues first, because they are cheap, they are certain, and everything published later is multiplied or wasted by them. Pages that cannot be indexed, phone speed, redirect chains and duplicate URLs competing with each other.',
						),
					),
					array(
						'h3' => 'Month two: take what you nearly have',
						'p'  => array(
							'The terms sitting just off the first page get the attention before any new page is written, because a page that already ranks somewhere is far cheaper to move than a page starting from nothing. This list comes out of the audit and is usually not what anyone expected.',
						),
					),
					array(
						'h3' => 'Month three onwards: build',
						'p'  => array(
							'New content, local signals and the work that compounds. This is the part most agencies start with, and starting here is why so many retainers show a lot of activity and very little movement for the first half of a year.',
						),
					),
				),
			),
			array(
				'h2'    => 'Where the work actually happens',
				'intro' => 'Split roughly in two, and the second half is the one most businesses neglect entirely.',
				'subs'  => array(
					array(
						'h3' => 'On your own site',
						'p'  => array(
							'Structure, speed, content and the claims your pages make. This is the half you control completely, which is why it comes first and why it is the only half anybody can promise to deliver.',
						),
					),
					array(
						'h3' => 'Everywhere else you appear',
						'p'  => array(
							'Your Google Business Profile, the directories that list your industry, review platforms, and any coverage elsewhere. You cannot edit most of it, but consistency across it is one of the strongest signals available to both search engines and answer engines, and inconsistency actively works against you.',
						),
					),
					array(
						'h3' => 'Why consistency matters more than volume',
						'p'  => array(
							'One accurate listing is worth more than five that disagree about your address, your hours or what you are called. Contradictory business details give both a search engine and an answer engine a reason to trust somebody else instead, and cleaning them up is unglamorous work that pays immediately.',
							'It is also the part that stays fixed once it is fixed, unlike rankings, which is why it is worth doing properly the first time rather than repeatedly.',
						),
					),
					array(
						'h3' => 'The half nobody audits',
						'p'  => array(
							'Most businesses have never checked what the directories, review sites and data aggregators actually say about them. It takes an afternoon to find out and it is routinely where the quickest wins in local visibility are sitting, untouched, because it is duller than talking about content.',
							'Old addresses, a phone number from two offices ago and a business name that does not match your signage are all common, and every one of them is a small argument against trusting you.',
						),
					),
				),
			),
		),
	);
}

/**
 * Render a page's long-form sections.
 *
 * Plain semantic markup: H2, an optional intro, then H3 subsections. No
 * structural cleverness, because this is the part of the page a person is
 * actually reading and a crawler is actually parsing.
 */
function mcg_depth( $key ) {
	$all = mcg_page_depth();
	if ( empty( $all[ $key ] ) ) {
		return;
	}

	foreach ( $all[ $key ] as $block ) {
		echo '<section class="depth rv">';
		printf( '<h2 data-tag="&lt;h2&gt;">%s</h2>', esc_html( $block['h2'] ) );

		if ( ! empty( $block['intro'] ) ) {
			printf( '<p class="depthIntro">%s</p>', esc_html( $block['intro'] ) );
		}

		echo '<div class="depthGrid">';
		foreach ( $block['subs'] as $sub ) {
			echo '<div class="depthItem">';
			printf( '<h3 data-tag="&lt;h3&gt;">%s</h3>', esc_html( $sub['h3'] ) );
			foreach ( $sub['p'] as $para ) {
				printf( '<p>%s</p>', esc_html( $para ) );
			}
			echo '</div>';
		}
		echo '</div></section>';
	}
}
