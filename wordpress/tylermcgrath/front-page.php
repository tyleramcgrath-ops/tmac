<?php
/**
 * Home page: the studio room, then the world of work.
 *
 * @package tylermcgrath
 */

get_header();

$projects    = tm_get_projects();
$disciplines = array();
foreach ( $projects as $p ) {
	if ( $p['discipline'] && ! in_array( $p['discipline'], $disciplines, true ) ) {
		$disciplines[] = $p['discipline'];
	}
}
$headline = array_values( array_filter( array_map( 'trim', explode( "\n", tm_mod( 'headline' ) ) ) ) );
?>

<main id="main" class="tm-main">

	<!-- ============ THE STUDIO ROOM ============ -->
	<section class="tm-room" id="top" data-section="room" data-compass="asleep">
		<div class="tm-room__env" aria-hidden="true">
			<img class="tm-room__plate" src="<?php echo esc_url( tm_room_image() ); ?>" alt="" fetchpriority="high" draggable="false">
			<div class="tm-room__sky"></div>
			<div class="tm-room__shade"></div>
			<div class="tm-room__ceiling"></div>
			<div class="tm-room__desk"></div>
			<canvas class="tm-room__stars" data-stars></canvas>
		</div>

		<div class="tm-room__intro">
			<span class="tm-eyebrow" data-reveal><?php echo esc_html( tm_mod( 'eyebrow' ) ); ?></span>
			<h1 class="tm-room__title">
				<?php foreach ( $headline as $i => $line ) : ?>
					<span class="tm-line" style="--i:<?php echo (int) $i; ?>"><span>
						<?php echo ( count( $headline ) - 1 === $i ) ? '<em>' . esc_html( $line ) . '</em>' : esc_html( $line ); ?>
					</span></span>
				<?php endforeach; ?>
			</h1>
			<p class="tm-room__lede" data-reveal><?php echo esc_html( tm_mod( 'intro' ) ); ?></p>
			<div class="tm-room__actions" data-reveal>
				<a class="tm-btn tm-btn--brass" href="#about" data-magnetic><?php echo esc_html( tm_mod( 'cta_primary' ) ); ?> <span aria-hidden="true">↗</span></a>
				<a class="tm-btn tm-btn--ghost" href="#services" data-magnetic><?php echo esc_html( tm_mod( 'cta_secondary' ) ); ?> <span aria-hidden="true">↗</span></a>
			</div>
		</div>

		<div class="tm-room__readout" aria-hidden="true">
			<span>HDG <b data-heading>000°</b> <i data-heading-dir>N</i></span>
			<span data-clock>--:--</span>
			<span data-sky-label>Night</span>
		</div>

		<button type="button" class="tm-awaken" data-awaken>
			<span class="tm-awaken__symbol" aria-hidden="true">✧</span>
			<span class="tm-awaken__text"><?php echo esc_html( tm_mod( 'awaken_label' ) ); ?><small><?php echo esc_html( tm_mod( 'awaken_sub' ) ); ?></small></span>
			<i aria-hidden="true">↑</i>
		</button>

		<div class="tm-room__inscription" aria-hidden="true">
			<?php echo tm_caps( get_bloginfo( 'name' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> <span>✧</span> <?php echo esc_html( tm_mod( 'inscription' ) ); ?>
		</div>

		<div class="tm-room__footer">
			<span><i aria-hidden="true"></i> <?php echo esc_html( tm_mod( 'footer_note' ) ); ?></span>
			<div>
				<button type="button" class="tm-pause" data-pause aria-pressed="false" aria-label="<?php esc_attr_e( 'Pause compass motion', 'tylermcgrath' ); ?>">Ⅱ <?php esc_html_e( 'Pause', 'tylermcgrath' ); ?></button>
				<span>© <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php echo tm_caps( get_bloginfo( 'name' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
			</div>
		</div>
	</section>

	<!-- ============ ABOUT ============ -->
	<section class="tm-section tm-about" id="about" data-section="about" data-compass="listening">
		<div class="tm-wrap tm-about__grid">
			<div class="tm-about__portrait" data-reveal data-tilt>
				<?php if ( tm_mod( 'portrait' ) ) : ?>
					<img src="<?php echo esc_url( tm_mod( 'portrait' ) ); ?>" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>" loading="lazy">
				<?php else : ?>
					<div class="tm-about__monogram">
						<?php tm_seal(); ?>
						<span>TM</span>
					</div>
				<?php endif; ?>
				<div class="tm-about__frame" aria-hidden="true"></div>
			</div>
			<div class="tm-about__copy">
				<span class="tm-eyebrow" data-reveal><?php echo esc_html( tm_mod( 'about_eyebrow' ) ); ?></span>
				<h2 class="tm-h2" data-reveal><?php echo esc_html( tm_mod( 'about_title' ) ); ?></h2>
				<div class="tm-prose" data-reveal><?php echo wp_kses_post( wpautop( tm_mod( 'about_text' ) ) ); ?></div>
				<dl class="tm-stats" data-reveal>
					<?php
					for ( $s = 1; $s <= 3; $s++ ) :
						list( $pre, $num, $suf ) = tm_stat_parts( tm_mod( 'stat' . $s . '_value' ) );
						?>
						<div class="tm-stat">
							<dt>
								<?php echo esc_html( $pre ); ?>
								<?php if ( null !== $num ) : ?>
									<span data-count="<?php echo (int) $num; ?>"><?php echo (int) $num; ?></span>
								<?php endif; ?>
								<?php echo esc_html( $suf ); ?>
							</dt>
							<dd><?php echo esc_html( tm_mod( 'stat' . $s . '_label' ) ); ?></dd>
						</div>
					<?php endfor; ?>
				</dl>
			</div>
		</div>
	</section>

	<!-- ============ WHAT I DO ============ -->
	<section class="tm-section tm-services" id="services" data-section="services" data-compass="planning">
		<div class="tm-wrap">
			<header class="tm-section__head">
				<span class="tm-eyebrow" data-reveal><?php echo esc_html( tm_mod( 'services_eyebrow' ) ); ?></span>
				<h2 class="tm-h2" data-reveal><?php echo esc_html( tm_mod( 'services_title' ) ); ?></h2>
			</header>

			<?php
			$services = array(
				array( 'seo', 'seo', 'N', 'SEO & AI Search' ),
				array( 'marketing', 'marketing', 'E', 'Marketing' ),
				array( 'web-design', 'web', 'S', 'Web Design' ),
			);
			foreach ( $services as $n => $svc ) :
				list( $anchor, $key, $bearing, $discipline ) = $svc;
				$count = 0;
				foreach ( $projects as $p ) {
					if ( $p['discipline'] === $discipline || $p['discipline'] === tm_mod( $key . '_title' ) ) {
						++$count;
					}
				}
				?>
				<article class="tm-service" id="<?php echo esc_attr( $anchor ); ?>" data-reveal data-spotlight>
					<div class="tm-service__index" aria-hidden="true">
						<span class="tm-service__bearing"><?php echo esc_html( $bearing ); ?></span>
						<span class="tm-service__num">0<?php echo (int) ( $n + 1 ); ?></span>
					</div>
					<div class="tm-service__body">
						<h3><?php echo esc_html( tm_mod( $key . '_title' ) ); ?></h3>
						<p class="tm-service__lead"><?php echo esc_html( tm_mod( $key . '_lead' ) ); ?></p>
						<p><?php echo esc_html( tm_mod( $key . '_text' ) ); ?></p>
					</div>
					<ul class="tm-service__points">
						<?php foreach ( array_filter( array_map( 'trim', explode( "\n", tm_mod( $key . '_points' ) ) ) ) as $point ) : ?>
							<li><?php echo tm_icon( 'star' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> <?php echo esc_html( $point ); ?></li>
						<?php endforeach; ?>
					</ul>
					<?php if ( $count ) : ?>
						<a class="tm-service__link" href="#portfolio" data-filter-link="<?php echo esc_attr( $discipline ); ?>">
							<?php
							/* translators: %d: number of projects. */
							printf( esc_html( _n( 'See %d project', 'See %d projects', $count, 'tylermcgrath' ) ), (int) $count );
							?>
							<?php echo tm_icon( 'arrow' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
						</a>
					<?php endif; ?>
				</article>
			<?php endforeach; ?>
		</div>
	</section>

	<!-- ============ MARQUEE ============ -->
	<div class="tm-marquee" aria-hidden="true">
		<div class="tm-marquee__track">
			<?php
			$words = array( 'Visibility', 'Strategy', 'Digital growth', 'SEO', 'AI Search', 'Web design', 'Marketing', 'Creative direction' );
			for ( $r = 0; $r < 2; $r++ ) {
				foreach ( $words as $w ) {
					echo '<span>' . esc_html( $w ) . '</span><i>✧</i>';
				}
			}
			?>
		</div>
	</div>

	<!-- ============ THE PORTFOLIO ============ -->
	<section class="tm-section tm-work" id="portfolio" data-section="work" data-compass="executing">
		<div class="tm-wrap">
			<header class="tm-section__head tm-work__head">
				<div>
					<span class="tm-eyebrow" data-reveal><?php echo esc_html( tm_mod( 'work_eyebrow' ) ); ?> <sup><?php echo count( $projects ); ?></sup></span>
					<h2 class="tm-h2" data-reveal><?php echo esc_html( tm_mod( 'work_title' ) ); ?></h2>
				</div>
				<p data-reveal><?php echo esc_html( tm_mod( 'work_text' ) ); ?></p>
			</header>

			<div class="tm-work__filters" role="group" aria-label="<?php esc_attr_e( 'Filter projects', 'tylermcgrath' ); ?>" data-reveal>
				<button type="button" class="is-active" data-filter="*" aria-pressed="true"><?php esc_html_e( 'All', 'tylermcgrath' ); ?> <span><?php echo count( $projects ); ?></span></button>
				<?php foreach ( $disciplines as $d ) : ?>
					<?php
					$c = count(
						array_filter(
							$projects,
							function ( $p ) use ( $d ) {
								return $p['discipline'] === $d;
							}
						)
					);
					?>
					<button type="button" data-filter="<?php echo esc_attr( $d ); ?>" aria-pressed="false"><?php echo esc_html( $d ); ?> <span><?php echo (int) $c; ?></span></button>
				<?php endforeach; ?>
			</div>

			<div class="tm-work__layout">
				<div class="tm-constellation" data-reveal>
					<svg viewBox="0 0 1000 640" data-constellation role="img" aria-label="<?php esc_attr_e( 'Constellation map of projects', 'tylermcgrath' ); ?>">
						<defs>
							<radialGradient id="tmStarGlow"><stop offset="0" stop-color="#fff3d6"/><stop offset=".35" stop-color="rgba(255,214,150,.55)"/><stop offset="1" stop-color="rgba(255,214,150,0)"/></radialGradient>
						</defs>
						<g class="tm-constellation__grid">
							<circle cx="500" cy="320" r="120"/><circle cx="500" cy="320" r="220"/><circle cx="500" cy="320" r="300"/>
							<line x1="500" y1="0" x2="500" y2="640"/><line x1="0" y1="320" x2="1000" y2="320"/>
						</g>
						<?php
						$n   = count( $projects );
						$pts = array();
						foreach ( $projects as $i => $p ) {
							$ang   = $i * 2.39996 - 1.2;
							$rad   = 0.22 + 0.78 * sqrt( ( $i + 0.5 ) / max( 1, $n ) );
							$pts[] = array( 500 + cos( $ang ) * $rad * 430, 320 + sin( $ang ) * $rad * 270 );
						}
						echo '<g class="tm-constellation__lines">';
						for ( $i = 1; $i < $n; $i++ ) {
							// Join each star to its nearest earlier neighbour: reads like a real constellation.
							$best = 0;
							$bd   = PHP_INT_MAX;
							for ( $j = 0; $j < $i; $j++ ) {
								$dd = pow( $pts[ $i ][0] - $pts[ $j ][0], 2 ) + pow( $pts[ $i ][1] - $pts[ $j ][1], 2 );
								if ( $dd < $bd ) {
									$bd   = $dd;
									$best = $j;
								}
							}
							printf( '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" data-a="%d" data-b="%d"/>', $pts[ $best ][0], $pts[ $best ][1], $pts[ $i ][0], $pts[ $i ][1], (int) $best, (int) $i );
						}
						echo '</g>';
						foreach ( $projects as $i => $p ) {
							printf(
								'<g class="tm-star" data-star="%1$d" data-discipline="%2$s" transform="translate(%3$.1f %4$.1f)" tabindex="-1"><circle class="tm-star__glow" r="34" fill="url(#tmStarGlow)"/><path class="tm-star__shape" d="M0 -11 L2.2 -2.2 L11 0 L2.2 2.2 L0 11 L-2.2 2.2 L-11 0 L-2.2 -2.2Z"/><text y="30">%5$s</text></g>',
								(int) $i,
								esc_attr( $p['discipline'] ),
								$pts[ $i ][0],
								$pts[ $i ][1],
								esc_html( $p['title'] )
							);
						}
						?>
					</svg>
				</div>

				<ol class="tm-projects">
					<?php foreach ( $projects as $i => $p ) : ?>
						<li class="tm-project" data-project="<?php echo (int) $i; ?>" data-discipline="<?php echo esc_attr( $p['discipline'] ); ?>" data-reveal>
							<?php
							$tag = $p['link'] ? 'a' : 'div';
							$atts = $p['link'] ? ' href="' . esc_url( $p['link'] ) . '"' . ( $p['external'] ? ' target="_blank" rel="noopener"' : '' ) : '';
							?>
							<<?php echo $tag . $atts; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above. ?> class="tm-project__card" data-tilt data-spotlight>
								<?php if ( $p['image'] ) : ?>
									<span class="tm-project__media"><img src="<?php echo esc_url( $p['image'] ); ?>" alt="" loading="lazy"></span>
								<?php endif; ?>
								<span class="tm-project__num"><?php echo esc_html( str_pad( (string) ( $i + 1 ), 2, '0', STR_PAD_LEFT ) ); ?></span>
								<span class="tm-project__meta">
									<?php echo esc_html( $p['discipline'] ); ?>
									<?php if ( $p['year'] ) : ?>
										· <?php echo esc_html( $p['year'] ); ?>
									<?php endif; ?>
								</span>
								<span class="tm-project__title"><?php echo esc_html( $p['title'] ); ?></span>
								<span class="tm-project__excerpt"><?php echo esc_html( $p['excerpt'] ); ?></span>
								<?php if ( $p['result'] ) : ?>
									<span class="tm-project__result"><?php echo tm_icon( 'star' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> <?php echo esc_html( $p['result'] ); ?></span>
								<?php endif; ?>
								<?php if ( $p['stack'] ) : ?>
									<span class="tm-project__tags">
										<?php foreach ( tm_split( $p['stack'] ) as $tag_name ) : ?>
											<span><?php echo esc_html( $tag_name ); ?></span>
										<?php endforeach; ?>
									</span>
								<?php endif; ?>
								<?php if ( $p['link'] ) : ?>
									<span class="tm-project__go" aria-hidden="true"><?php echo tm_icon( $p['external'] ? 'external' : 'arrow' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
								<?php endif; ?>
							</<?php echo $tag; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
						</li>
					<?php endforeach; ?>
				</ol>
			</div>

			<?php if ( get_posts( array( 'post_type' => 'tm_project', 'posts_per_page' => 1, 'fields' => 'ids' ) ) ) : ?>
				<p class="tm-work__all"><a class="tm-btn tm-btn--ghost" href="<?php echo esc_url( get_post_type_archive_link( 'tm_project' ) ); ?>"><?php esc_html_e( 'The full portfolio', 'tylermcgrath' ); ?> <span aria-hidden="true">↗</span></a></p>
			<?php endif; ?>
		</div>
	</section>

	<!-- ============ PROCESS ============ -->
	<section class="tm-section tm-process" id="process" data-section="process" data-compass="verifying">
		<div class="tm-wrap">
			<header class="tm-section__head">
				<span class="tm-eyebrow" data-reveal><?php echo esc_html( tm_mod( 'process_eyebrow' ) ); ?></span>
				<h2 class="tm-h2" data-reveal><?php echo esc_html( tm_mod( 'process_title' ) ); ?></h2>
			</header>
			<div class="tm-bearings" data-bearings>
				<div class="tm-bearings__track" aria-hidden="true"><span data-bearings-progress></span></div>
				<?php
				$steps = array(
					'N' => array( 0, 'process_n' ),
					'E' => array( 90, 'process_e' ),
					'S' => array( 180, 'process_s' ),
					'W' => array( 270, 'process_w' ),
				);
				foreach ( $steps as $dir => $step ) :
					$parts = array_map( 'trim', explode( '|', tm_mod( $step[1] ), 2 ) );
					?>
					<article class="tm-bearing" data-reveal data-spotlight>
						<div class="tm-bearing__dial" aria-hidden="true">
							<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="27"/><path d="M30 8 L34 30 L30 34 L26 30Z" transform="rotate(<?php echo (int) $step[0]; ?> 30 30)"/></svg>
							<span><?php echo esc_html( $dir ); ?></span>
						</div>
						<span class="tm-bearing__deg"><?php echo esc_html( str_pad( (string) $step[0], 3, '0', STR_PAD_LEFT ) ); ?>°</span>
						<h3><?php echo esc_html( $parts[0] ); ?></h3>
						<?php if ( isset( $parts[1] ) ) : ?>
							<p><?php echo esc_html( $parts[1] ); ?></p>
						<?php endif; ?>
					</article>
				<?php endforeach; ?>
			</div>
		</div>
	</section>

	<!-- ============ JOURNAL ============ -->
	<?php
	$journal = new WP_Query(
		array(
			'post_type'           => 'post',
			'posts_per_page'      => 3,
			'ignore_sticky_posts' => true,
		)
	);
	if ( $journal->have_posts() && $journal->found_posts > 0 && ! ( 1 === $journal->found_posts && 'hello-world' === $journal->posts[0]->post_name ) ) :
		?>
		<section class="tm-section tm-journal" id="journal" data-section="journal" data-compass="thinking">
			<div class="tm-wrap">
				<header class="tm-section__head tm-work__head">
					<div>
						<span class="tm-eyebrow" data-reveal><?php esc_html_e( 'Field notes', 'tylermcgrath' ); ?></span>
						<h2 class="tm-h2" data-reveal><?php esc_html_e( 'From the journal.', 'tylermcgrath' ); ?></h2>
					</div>
					<?php if ( get_option( 'page_for_posts' ) ) : ?>
						<a class="tm-btn tm-btn--ghost" href="<?php echo esc_url( get_permalink( get_option( 'page_for_posts' ) ) ); ?>"><?php esc_html_e( 'All entries', 'tylermcgrath' ); ?> ↗</a>
					<?php endif; ?>
				</header>
				<div class="tm-posts">
					<?php
					while ( $journal->have_posts() ) :
						$journal->the_post();
						get_template_part( 'template-parts/post-card' );
					endwhile;
					wp_reset_postdata();
					?>
				</div>
			</div>
		</section>
	<?php endif; ?>

	<!-- ============ CONNECT ============ -->
	<section class="tm-section tm-contact" id="connect" data-section="connect" data-compass="listening">
		<div class="tm-wrap tm-contact__grid">
			<div class="tm-contact__copy">
				<span class="tm-eyebrow" data-reveal><?php echo esc_html( tm_mod( 'contact_eyebrow' ) ); ?></span>
				<h2 class="tm-h2 tm-contact__title" data-reveal><?php echo esc_html( tm_mod( 'contact_title' ) ); ?></h2>
				<p data-reveal><?php echo esc_html( tm_mod( 'contact_text' ) ); ?></p>
				<ul class="tm-contact__links" data-reveal>
					<?php if ( tm_mod( 'connect_url' ) ) : ?>
						<li><a href="<?php echo esc_url( tm_mod( 'connect_url' ) ); ?>" target="_blank" rel="noopener"><?php echo tm_icon( 'external' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> <?php echo esc_html( preg_replace( '#^https?://(www\.)?#', '', untrailingslashit( tm_mod( 'connect_url' ) ) ) ); ?></a></li>
					<?php endif; ?>
					<?php foreach ( tm_socials() as $social ) : ?>
						<li><a href="<?php echo esc_url( $social['url'] ); ?>" target="_blank" rel="noopener me"><?php echo tm_icon( $social['icon'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> <?php echo esc_html( $social['label'] ); ?></a></li>
					<?php endforeach; ?>
				</ul>
			</div>

			<form class="tm-form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" data-contact-form data-reveal>
				<?php if ( isset( $_GET['tm_sent'] ) ) : // phpcs:ignore WordPress.Security.NonceVerification.Recommended ?>
					<p class="tm-form__status is-ok" role="status"><?php esc_html_e( 'Message received. I will be in touch soon.', 'tylermcgrath' ); ?></p>
				<?php elseif ( isset( $_GET['tm_error'] ) ) : // phpcs:ignore WordPress.Security.NonceVerification.Recommended ?>
					<p class="tm-form__status is-error" role="alert"><?php esc_html_e( 'The message could not be sent. Please check your name, email and message, then try again.', 'tylermcgrath' ); ?></p>
				<?php endif; ?>
				<input type="hidden" name="action" value="tm_contact">
				<?php wp_nonce_field( 'tm_contact', 'tm_contact_nonce' ); ?>
				<div class="tm-form__hp" aria-hidden="true"><label>Website <input type="text" name="tm_website" tabindex="-1" autocomplete="off"></label></div>
				<div class="tm-form__row">
					<label class="tm-field"><input type="text" name="tm_name" required autocomplete="name" placeholder=" "><span><?php esc_html_e( 'Your name', 'tylermcgrath' ); ?></span></label>
					<label class="tm-field"><input type="email" name="tm_email" required autocomplete="email" placeholder=" "><span><?php esc_html_e( 'Email', 'tylermcgrath' ); ?></span></label>
				</div>
				<fieldset class="tm-chips">
					<legend><?php esc_html_e( 'I’m interested in', 'tylermcgrath' ); ?></legend>
					<?php foreach ( array( tm_mod( 'seo_title' ), tm_mod( 'marketing_title' ), tm_mod( 'web_title' ), __( 'Something else', 'tylermcgrath' ) ) as $k => $topic ) : ?>
						<label><input type="radio" name="tm_topic" value="<?php echo esc_attr( $topic ); ?>" <?php checked( 0, $k ); ?>><span><?php echo esc_html( $topic ); ?></span></label>
					<?php endforeach; ?>
				</fieldset>
				<label class="tm-field tm-field--area"><textarea name="tm_message" rows="5" required placeholder=" "></textarea><span><?php esc_html_e( 'Tell me about the project', 'tylermcgrath' ); ?></span></label>
				<button type="submit" class="tm-btn tm-btn--brass tm-form__submit" data-magnetic>
					<span data-submit-label><?php esc_html_e( 'Send message', 'tylermcgrath' ); ?></span> <span aria-hidden="true">↗</span>
				</button>
				<p class="tm-form__status" data-form-status role="status" aria-live="polite"></p>
			</form>
		</div>
	</section>

</main>

<?php
get_footer();
