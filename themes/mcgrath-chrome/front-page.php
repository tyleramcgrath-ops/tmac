<?php
/**
 * Front page.
 *
 * Hero with a live visibility dashboard, the stat strip, the scroll-driven
 * dissolve that shatters a page of blue links and reassembles it as the
 * question a buyer asks a model, services, a featured case study, the Jupiter
 * section, FAQ, the free audit, client logos and the closing CTA.
 *
 * @package mcgrath-chrome
 */

get_header();
?>

<!-- ============================ HERO ============================ -->
<section class="hero" id="hero">
	<!-- The photograph is the hero. It bleeds off the top, right and bottom and
	     dissolves leftward into the paper, so the headline sits on clean ground
	     and the dashboard floats over open water. -->
	<div class="heroPhoto" aria-hidden="true">
		<?php mcg_plate( 'hero', '', '50% 34%' ); ?>
		<span class="veil"></span>
	</div>

	<div class="heroIn gut">
		<div class="heroCopy">
			<span class="eyebrow"><?php echo esc_html( mcg_opt( 'mcg_hero_kicker', 'Jupiter, Florida · Serving Clients Nationwide' ) ); ?></span>

			<h1>
				<span class="line"><span data-l><?php echo esc_html( mcg_opt( 'mcg_hero_l1', 'Built to Make Your' ) ); ?></span></span>
				<span class="line"><span data-l><?php echo esc_html( mcg_opt( 'mcg_hero_l2', 'Business Impossible' ) ); ?></span></span>
				<span class="line"><span data-l><?php echo esc_html( mcg_opt( 'mcg_hero_l3', 'to Miss.' ) ); ?></span></span>
			</h1>

			<p><?php echo esc_html( mcg_opt( 'mcg_hero_sub', 'SEO, AI Search Optimization, web design and digital strategies that get you found, build authority and drive measurable growth.' ) ); ?></p>

			<div class="heroBtns">
				<a class="btn" href="<?php echo esc_url( mcg_url( 'contact' ) ); ?>" data-mag>
					<?php esc_html_e( 'Start a Project', 'mcgrath-chrome' ); ?> <span class="arw" aria-hidden="true">&rarr;</span>
				</a>
				<a class="btn ghost" href="<?php echo esc_url( mcg_url( 'vault' ) ); ?>">
					<?php esc_html_e( 'See Our Work', 'mcgrath-chrome' ); ?>
				</a>
			</div>

			<div class="trust">
				<span class="faces" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
				<p><?php echo wp_kses_post( mcg_opt( 'mcg_hero_trust', 'Trusted by growing businesses<br>in Jupiter and across the country.' ) ); ?></p>
			</div>
		</div>

		<div class="heroScene">
			<span class="tag" aria-hidden="true">
				<?php echo esc_html( mcg_opt( 'mcg_plate_l1', 'Higher Visibility' ) ); ?><br>
				<?php echo esc_html( mcg_opt( 'mcg_plate_l2', 'Stronger Businesses' ) ); ?><br>
				<?php echo esc_html( mcg_opt( 'mcg_plate_l3', 'A Brighter Tomorrow' ) ); ?>
			</span>

			<!-- The dashboard is drawn in markup, not shipped as an image, so it
			     stays sharp on every screen and readable to a crawler. -->
			<div class="dash rv" role="img"
				aria-label="<?php esc_attr_e( 'A visibility dashboard showing a score of 87 out of 100 across Google Search, ChatGPT, Gemini, Perplexity and AI Overviews.', 'mcgrath-chrome' ); ?>">
				<div class="dashBar" aria-hidden="true">
					<i></i><i></i><i></i>
					<span class="dots"><b></b><b></b><b></b><b></b></span>
				</div>

				<div class="dashBody" aria-hidden="true">
					<div class="dashNav">
						<span class="dlogo">
							<img src="<?php echo esc_url( get_template_directory_uri() . '/assets/img/logo.png' ); ?>"
								alt="" width="1109" height="612">
						</span>
						<ul>
							<li class="on">Overview</li>
							<li>Search Visibility</li>
							<li>AI Search</li>
							<li>Keywords</li>
							<li>Leads</li>
							<li>Reports</li>
						</ul>
					</div>

					<div class="dashMain">
						<div class="dashHead">
							<h4><?php esc_html_e( 'Your Business Visibility', 'mcgrath-chrome' ); ?></h4>
							<span class="dashPill"><?php esc_html_e( 'Last 90 days', 'mcgrath-chrome' ); ?></span>
						</div>

						<div class="plats">
							<?php foreach ( mcg_platforms() as $mcg_p ) : ?>
								<span class="plat">
									<?php mcg_icon( $mcg_p['icon'] ); ?>
									<span><?php echo wp_kses_post( $mcg_p['label'] ); ?></span>
								</span>
							<?php endforeach; ?>
						</div>

						<div class="score">
							<div class="sHead">
								<span class="sLab"><?php esc_html_e( 'Visibility Score', 'mcgrath-chrome' ); ?></span>
								<span class="up">32%</span>
							</div>
							<span class="sNum"><b data-count="87">87</b><small>/ 100</small></span>
							<span class="spark">
								<svg viewBox="0 0 100 40" preserveAspectRatio="none">
									<defs>
										<linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
											<stop offset="0" stop-color="#2563C8" stop-opacity=".22"/>
											<stop offset="1" stop-color="#2563C8" stop-opacity="0"/>
										</linearGradient>
									</defs>
									<path class="fl" d="M1,33 L13,31 L25,32 L37,25 L49,23 L61,17 L73,15 L85,8 L97,3 L97,40 L1,40 Z"/>
									<path class="ln" d="M1,33 L13,31 L25,32 L37,25 L49,23 L61,17 L73,15 L85,8 L97,3"/>
								</svg>
							</span>
						</div>

						<div class="tiles">
							<span class="tile"><span class="tl"><?php esc_html_e( 'Organic Traffic', 'mcgrath-chrome' ); ?></span><span class="tv">12.4K</span><span class="td">&uarr; 60%</span></span>
							<span class="tile"><span class="tl"><?php esc_html_e( 'Leads', 'mcgrath-chrome' ); ?></span><span class="tv">482</span><span class="td">&uarr; 41%</span></span>
							<span class="tile"><span class="tl"><?php esc_html_e( 'Keyword Rankings', 'mcgrath-chrome' ); ?></span><span class="tv">1,036</span><span class="td">&uarr; 122%</span></span>
							<span class="tile"><span class="tl"><?php esc_html_e( 'AI Citations', 'mcgrath-chrome' ); ?></span><span class="tv">89</span><span class="td">&uarr; 318%</span></span>
						</div>
					</div>
				</div>
			</div>

			<div class="heroSig" aria-hidden="true">
				<span class="script"><?php echo esc_html( mcg_opt( 'mcg_location', 'Jupiter, Florida' ) ); ?></span>
				<span class="mono"><?php echo esc_html( mcg_opt( 'mcg_coords', '26.9342° N, 80.0942° W' ) ); ?></span>
			</div>
		</div>
	</div>
</section>

<!-- ========================== STAT STRIP ========================== -->
<section class="strip gut" aria-label="<?php esc_attr_e( 'At a glance', 'mcgrath-chrome' ); ?>">
	<div class="stripIn">
		<?php foreach ( mcg_strip() as $mcg_s ) : ?>
			<div class="sItem">
				<?php mcg_icon( $mcg_s['icon'] ); ?>
				<span><b><?php echo esc_html( $mcg_s['value'] ); ?></b><span><?php echo esc_html( $mcg_s['label'] ); ?></span></span>
			</div>
		<?php endforeach; ?>
	</div>
</section>

<!-- =====================================================================
     THE DISSOLVE
     A real page of blue links is sampled into particles, flown across the
     stage and reassembled as the question a buyer now asks a model. The
     text on both ends is live DOM, so it is crawlable and screen readable.
     ===================================================================== -->
<section class="heroSeq" id="heroSeq" aria-labelledby="shiftHead">
	<div class="hstage">
		<div class="hbg" id="hbg" aria-hidden="true"></div>
		<canvas id="morph" class="hmorph" aria-hidden="true"></canvas>

		<div class="hoverlay">
			<div class="htitle" id="htitle">
				<span class="eyebrow"><?php esc_html_e( 'What we do', 'mcgrath-chrome' ); ?></span>
				<h2 id="shiftHead" data-tag="&lt;h2&gt;"><?php echo esc_html( mcg_opt( 'mcg_shift_head', 'Search changed. We changed with it.' ) ); ?></h2>
				<p><?php echo esc_html( mcg_opt( 'mcg_shift_sub', 'A modern marketing partner for a multi-platform world. From Google to AI search, we help brands show up, stand out and grow — with strategies built for what is next.' ) ); ?></p>
				<a class="alink" href="#services"><?php esc_html_e( 'Our Services', 'mcgrath-chrome' ); ?> <span class="arw" aria-hidden="true">&rarr;</span></a>
			</div>

			<div class="serp" id="serp">
				<div class="sbar" id="sbar"><span data-t><?php echo esc_html( mcg_opt( 'mcg_hero_query', 'seo company jupiter fl' ) ); ?></span></div>

				<div class="res">
					<div class="rurl"><span class="fav"></span><span data-t>clutch.co &rsaquo; fl &rsaquo; jupiter &rsaquo; seo</span></div>
					<div class="rtitle"><span data-t>Top 10 SEO Companies in Jupiter, FL (2026)</span></div>
					<div class="rsnip"><span data-t>Verified reviews, pricing ranges and minimum project</span><span data-t>sizes for agencies serving Palm Beach County.</span></div>
				</div>

				<div class="res">
					<div class="rurl"><span class="fav"></span><span data-t>palmbeachdigital.com &rsaquo; seo-services</span></div>
					<div class="rtitle"><span data-t>Jupiter SEO Services for Local Business</span></div>
					<div class="rsnip"><span data-t>Local rankings, Google Business Profile management</span><span data-t>and monthly reporting for small teams.</span></div>
				</div>

				<div class="res">
					<div class="rurl"><span class="fav"></span><span data-t>yelp.com &rsaquo; search &rsaquo; seo-jupiter-fl</span></div>
					<div class="rtitle"><span data-t>Best SEO Companies near Jupiter, Florida</span></div>
					<div class="rsnip"><span data-t>Nineteen listings with star ratings, photos and hours.</span><span data-t>Sorted by recommended.</span></div>
				</div>

				<div class="res">
					<div class="rurl"><span class="fav"></span><span data-t>searchfirmfl.com &rsaquo; locations &rsaquo; jupiter</span></div>
					<div class="rtitle"><span data-t>SEO Agency Serving Jupiter and Palm Beach Gardens</span></div>
					<div class="rsnip"><span data-t>Free site audit, no long-term contracts and a dedicated</span><span data-t>account manager on every account.</span></div>
				</div>
			</div>

			<div class="qtext" id="qtext">
				<p>
<?php
$mcg_ask  = mcg_opt( 'mcg_hero_ask', 'Who is the best SEO company in' );
$mcg_mark = mcg_opt( 'mcg_hero_mark', 'Jupiter, FL?' );
foreach ( preg_split( '/\s+/', trim( wp_strip_all_tags( $mcg_ask ) ) ) as $mcg_word ) {
	echo '<span data-q>' . esc_html( $mcg_word ) . '</span> ';
}
echo '<span data-q class="mk">' . esc_html( wp_strip_all_tags( $mcg_mark ) ) . '</span>';
?>
				</p>
			</div>

			<!-- Where the pixels land: the query sitting in a search field, and the
			     overview that comes back for it with its sources listed alongside.
			     Drawn generically, not as a copy of any one engine's branding. -->
			<div class="askResult" id="dcites">
				<div class="ovCard">
					<div class="ovMain">
						<span class="ovHead"><i class="ovDot"></i><?php esc_html_e( 'AI overview', 'mcgrath-chrome' ); ?></span>
						<p class="ovBody"><?php echo wp_kses_post( mcg_opt( 'mcg_overview_body', 'Searches for SEO in Jupiter, Florida most often surface <b>McGrath Marketing Group</b>, a practice covering SEO, AI search optimisation and web design for local and national clients. Coverage on regional directories and review sites supports the same shortlist.' ) ); ?></p>
					</div>
					<div class="ovRail">
						<span class="ovRailLab"><?php esc_html_e( 'Sources', 'mcgrath-chrome' ); ?></span>
						<span class="railItem first"><i class="fv"></i><b><?php echo esc_html( wp_parse_url( home_url(), PHP_URL_HOST ) ); ?></b></span>
						<span class="railItem"><i class="fv"></i><b>directory-site.com</b></span>
						<span class="railItem"><i class="fv"></i><b>review-site.com</b></span>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- =========================== SERVICES =========================== -->
<section class="sec gut lens svcSec" id="services">
	<div class="lensX" id="lensX" aria-hidden="true">
		<span class="d">&lt;!-- what a crawler reads on this section --&gt;</span>
		<span>&lt;section id="services"&gt;</span>
		<span>  &lt;h2&gt; <span class="k">Search changed. We changed with it.</span> &lt;/h2&gt;</span>
		<span class="d">       unique h2 · no competing heading on the page</span>
		<span>  &lt;h3&gt; <span class="k">SEO</span> &lt;/h3&gt;</span>
		<span class="d">       schema: Service → provider: ProfessionalService</span>
		<span>  &lt;h3&gt; <span class="k">AI Search / GEO / AEO</span> &lt;/h3&gt;</span>
		<span class="d">       schema: Service → sameAs: 4 model surfaces</span>
		<span>  &lt;h3&gt; <span class="k">Web Design &amp; Development</span> &lt;/h3&gt;</span>
		<span class="d">       schema: Service → areaServed: 12 cities</span>
		<span>  &lt;h3&gt; <span class="k">Analytics &amp; Conversion</span> &lt;/h3&gt;</span>
		<span class="d">       answer-ready format: yes</span>
		<span>&lt;/section&gt;</span>
		<span class="d">render-blocking: none · CLS 0.00 · LCP 0.9s</span>
	</div>
	<span class="mono lensHint"><?php esc_html_e( 'Move your cursor — see what a crawler sees', 'mcgrath-chrome' ); ?></span>

	<div class="wrap">
		<div class="shead rv">
			<div class="sheadL">
				<span class="eyebrow"><?php esc_html_e( 'Our services', 'mcgrath-chrome' ); ?></span>
				<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'Four disciplines. One person accountable.', 'mcgrath-chrome' ); ?></h2>
			</div>
			<a class="alink" href="<?php echo esc_url( mcg_url( 'contact' ) ); ?>">
				<?php esc_html_e( 'Start a project', 'mcgrath-chrome' ); ?> <span class="arw" aria-hidden="true">&rarr;</span>
			</a>
		</div>

		<div class="svcGrid">
			<?php foreach ( mcg_services() as $mcg_i => $mcg_svc ) : ?>
				<a class="svcCard rv<?php echo $mcg_svc['accent'] ? ' accent' : ''; ?>"
					data-d="<?php echo (int) $mcg_i % 2; ?>" href="<?php echo esc_url( mcg_url( $mcg_svc['url'] ) ); ?>">
					<span class="svcPic">
						<?php mcg_img( $mcg_svc['img'], $mcg_svc['alt'] ); ?>
						<span class="num"><?php echo esc_html( sprintf( '%02d', $mcg_i + 1 ) ); ?></span>
					</span>
					<span class="svcTxt">
						<h3 data-tag="&lt;h3&gt;"><?php echo esc_html( $mcg_svc['title'] ); ?></h3>
						<p><?php echo esc_html( $mcg_svc['sub'] ); ?></p>
						<!-- the disciplines stay on the page as one thin line, so the card
						     reads as a picture and a promise but the terms are still here. -->
						<span class="svcTags"><?php echo esc_html( implode( ' · ', $mcg_svc['items'] ) ); ?></span>
						<span class="svcGo"><?php esc_html_e( 'Explore', 'mcgrath-chrome' ); ?> <span class="arw" aria-hidden="true">&rarr;</span></span>
					</span>
				</a>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<!-- ========================= CASE STUDY ========================== -->
<?php
$mcg_case = mcg_case();
$mcg_shot = mcg_case_shot();
?>

<section class="case sec gut<?php echo $mcg_shot ? '' : ' noShot'; ?>" id="work">
	<div class="caseIn">
		<div class="caseHead rv">
			<span class="eyebrow"><?php esc_html_e( 'Selected Work', 'mcgrath-chrome' ); ?></span>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'Visibility that drives business.', 'mcgrath-chrome' ); ?></h2>
			<a class="alink" href="<?php echo esc_url( mcg_url( 'vault' ) ); ?>">
				<?php esc_html_e( 'View all case studies', 'mcgrath-chrome' ); ?> <span class="arw" aria-hidden="true">&rarr;</span>
			</a>
		</div>

		<div class="caseGrid">
			<div class="caseDetail rv">
				<span class="caseLabel<?php echo $mcg_case['verified'] ? ' isReal' : ''; ?>">
					<?php echo esc_html( $mcg_case['label'] ); ?>
				</span>
				<h3 data-tag="&lt;h3&gt;"><?php echo esc_html( $mcg_case['head'] ); ?></h3>
				<p class="caseMeta"><?php echo esc_html( $mcg_case['meta'] ); ?></p>
				<p class="caseText"><?php echo esc_html( $mcg_case['summary'] ); ?></p>
				<a class="alink caseGo" href="<?php echo esc_url( mcg_url( 'vault' ) ); ?>">
					<?php esc_html_e( 'View case study', 'mcgrath-chrome' ); ?> <span class="arw" aria-hidden="true">&rarr;</span>
				</a>
			</div>

			<?php if ( $mcg_shot ) : ?>
				<figure class="caseShot rv" data-d="1">
					<div class="shotBar" aria-hidden="true">
						<i></i><i></i><i></i>
						<?php if ( $mcg_case['shot_url'] ) : ?>
							<span class="shotUrl"><?php echo esc_html( $mcg_case['shot_url'] ); ?></span>
						<?php endif; ?>
					</div>
					<img src="<?php echo esc_url( $mcg_shot ); ?>"
						alt="<?php esc_attr_e( 'The finished website for this project', 'mcgrath-chrome' ); ?>"
						width="1400" height="1050" loading="lazy" decoding="async">
				</figure>
			<?php endif; ?>
		</div>

		<?php if ( $mcg_case['verified'] && $mcg_case['metrics'] ) : ?>
			<div class="caseResults rv" data-d="2">
				<?php foreach ( $mcg_case['metrics'] as $mcg_m ) : ?>
					<div class="caseResult">
						<b><?php echo esc_html( $mcg_m['value'] ); ?></b>
						<span><?php echo esc_html( $mcg_m['label'] ); ?></span>
					</div>
				<?php endforeach; ?>
			</div>
			<p class="caseFoot rv" data-d="3"><?php
				printf(
					/* translators: %s: the period the figures were measured over. */
					esc_html__( 'Measured over %s.', 'mcgrath-chrome' ),
					esc_html( $mcg_case['timeframe'] )
				);
			?></p>
		<?php elseif ( $mcg_case['deliverables'] ) : ?>
			<!-- No verified client figures, so the strip carries what the work
			     involves rather than numbers nobody can stand behind. -->
			<div class="caseResults isWork rv" data-d="2">
				<?php foreach ( $mcg_case['deliverables'] as $mcg_i => $mcg_d ) : ?>
					<div class="caseResult">
						<b><?php echo esc_html( sprintf( '%02d', $mcg_i + 1 ) ); ?></b>
						<span><?php echo esc_html( $mcg_d ); ?></span>
					</div>
				<?php endforeach; ?>
			</div>
			<p class="caseFoot rv" data-d="3"><?php esc_html_e( 'An illustrative engagement, not a client record. Real client results are published here once a client agrees to them.', 'mcgrath-chrome' ); ?></p>
		<?php endif; ?>
	</div>
</section>

<!-- ======================= JUPITER ROOTS ========================= -->
<section class="roots" id="home-base">
	<div class="rootsPic" aria-hidden="true"><?php mcg_plate( 'roots', '', '50% 46%' ); ?></div>

	<div class="rootsBody">
		<div class="rv">
			<span class="eyebrow"><?php esc_html_e( 'Our home', 'mcgrath-chrome' ); ?></span>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'Jupiter roots.', 'mcgrath-chrome' ); ?><br><?php esc_html_e( 'National capability.', 'mcgrath-chrome' ); ?></h2>
			<p><?php
				printf(
					/* translators: %s: the location, wrapped for emphasis. */
					esc_html__( 'We are proud to call %s home. Our local roots keep us connected to the businesses and community we care about, while our national client base proves what is possible when strategy, creativity and technology come together.', 'mcgrath-chrome' ),
					'<b class="hl">' . esc_html( mcg_opt( 'mcg_location', 'Jupiter, Florida' ) ) . '</b>'
				);
			?></p>
			<a class="btn ghost" href="<?php echo esc_url( mcg_url( 'about' ) ); ?>">
				<?php esc_html_e( 'Our Story', 'mcgrath-chrome' ); ?> <span class="arw" aria-hidden="true">&rarr;</span>
			</a>
		</div>

		<div class="rootsSide rv" data-d="1">
			<ul class="rootsList">
				<?php foreach ( mcg_roots() as $mcg_r ) : ?>
					<li>
						<?php mcg_icon( $mcg_r['icon'] ); ?>
						<span><b><?php echo esc_html( $mcg_r['title'] ); ?></b><span><?php echo esc_html( $mcg_r['sub'] ); ?></span></span>
					</li>
				<?php endforeach; ?>
			</ul>

		</div>
	</div>
</section>

<!-- =========================== INSIGHTS ========================== -->
<?php
// Only render if there is something to point at, so the section never ships
// as an empty shelf on a site with no posts yet.
$mcg_posts = get_posts( array( 'numberposts' => 3, 'post_status' => 'publish' ) );
if ( $mcg_posts ) :
	?>
<section class="insights sec gut" id="insights">
	<div class="insIn">
		<figure class="insPic rv">
			<?php mcg_img( 'page-writing', __( 'An open magazine spread of Jupiter coastline photography on a sunlit table', 'mcgrath-chrome' ) ); ?>
		</figure>

		<div class="insBody rv" data-d="1">
			<span class="eyebrow"><?php esc_html_e( 'Insights', 'mcgrath-chrome' ); ?></span>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'Notes on search.', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'What is actually changing in search and what it means for a business in Palm Beach County. Written as it happens, not rewritten from someone else.', 'mcgrath-chrome' ); ?></p>

			<ul class="insList">
				<?php foreach ( $mcg_posts as $mcg_p ) : ?>
					<li>
						<a href="<?php echo esc_url( get_permalink( $mcg_p ) ); ?>">
							<span class="insDate"><?php echo esc_html( get_the_date( 'M j, Y', $mcg_p ) ); ?></span>
							<span class="insTitle"><?php echo esc_html( get_the_title( $mcg_p ) ); ?></span>
							<span class="arw" aria-hidden="true">&rarr;</span>
						</a>
					</li>
				<?php endforeach; ?>
			</ul>

			<a class="alink" href="<?php echo esc_url( mcg_url( 'blog' ) ); ?>">
				<?php esc_html_e( 'All insights', 'mcgrath-chrome' ); ?> <span class="arw" aria-hidden="true">&rarr;</span>
			</a>
		</div>
	</div>
</section>
<?php endif; ?>

<!-- ============================= FAQ ============================= -->
<section class="sec gut faqSec" id="faq">
	<div class="head rv" style="margin-bottom:clamp(20px,3vw,34px);">
		<div class="sheadL">
			<span class="eyebrow"><?php esc_html_e( 'Straight answers', 'mcgrath-chrome' ); ?></span>
			<h2 data-tag="&lt;h2&gt;" style="margin-top:14px;"><?php esc_html_e( 'Questions people actually ask', 'mcgrath-chrome' ); ?></h2>
		</div>
	</div>
	<div class="faq rv">
		<?php foreach ( mcg_faqs() as $mcg_faq ) : ?>
			<details>
				<summary><?php echo esc_html( $mcg_faq['q'] ); ?></summary>
				<p><?php echo esc_html( $mcg_faq['a'] ); ?></p>
			</details>
		<?php endforeach; ?>
	</div>
</section>

<!-- ========================== FREE AUDIT ========================= -->
<section class="audit sec gut" id="audit">
	<div class="auditIn">
		<div class="rv">
			<span class="eyebrow"><?php esc_html_e( 'Free tool', 'mcgrath-chrome' ); ?></span>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'Get Your Website Visibility Audit', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'See how your business performs across Google, AI search and the web — and get personalised recommendations in minutes.', 'mcgrath-chrome' ); ?></p>

			<form class="auditForm" action="<?php echo esc_url( mcg_url( 'contact' ) ); ?>" method="get">
				<label class="screen-reader-text" for="auditUrl"><?php esc_html_e( 'Your website address', 'mcgrath-chrome' ); ?></label>
				<input type="text" id="auditUrl" name="site" inputmode="url" autocomplete="url"
					placeholder="<?php esc_attr_e( 'Enter your website (e.g. yourbusiness.com)', 'mcgrath-chrome' ); ?>" required>
				<button class="btn" type="submit"><?php esc_html_e( 'Analyze My Site', 'mcgrath-chrome' ); ?> <span class="arw" aria-hidden="true">&rarr;</span></button>
			</form>
		</div>

		<div class="auditSide rv" data-d="1">
			<figure class="auditPic">
				<?php mcg_img( 'art-mobile', __( 'A site shown on two phones beside the shoreline', 'mcgrath-chrome' ) ); ?>
			</figure>
			<ul class="checks2">
				<?php foreach ( mcg_audit_checks() as $mcg_c ) : ?>
					<li><?php mcg_icon( 'check' ); ?><?php echo esc_html( $mcg_c ); ?></li>
				<?php endforeach; ?>
			</ul>
			<span class="script auditNote" aria-hidden="true"><?php esc_html_e( 'It’s free. No commitment.', 'mcgrath-chrome' ); ?></span>
		</div>
	</div>
</section>

<!-- ============================= CTA ============================= -->
<section class="cta gut" id="cta">
	<?php mcg_plate( 'ocean', 'night' ); ?>
	<canvas id="chrome2" aria-hidden="true"></canvas>

	<div class="ctaIn rv">
		<span class="eyebrow"><?php esc_html_e( 'Let’s build what’s next', 'mcgrath-chrome' ); ?></span>
		<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'A Smarter, Stronger Future for Your Business.', 'mcgrath-chrome' ); ?></h2>
		<p><?php esc_html_e( 'Whether you are in Jupiter, across Florida, or nationwide, we are ready to help you grow.', 'mcgrath-chrome' ); ?></p>
		<div class="ctaBtns">
			<a class="btn light" href="<?php echo esc_url( mcg_url( 'contact' ) ); ?>" data-mag><?php esc_html_e( 'Start a Project', 'mcgrath-chrome' ); ?></a>
			<a class="btn onDark" href="mailto:<?php echo esc_attr( mcg_opt( 'mcg_email', 'tyler@mcgrathmarketinggroup.com' ) ); ?>"><?php esc_html_e( 'Let’s Talk', 'mcgrath-chrome' ); ?></a>
		</div>
	</div>
</section>

<?php
get_footer();
