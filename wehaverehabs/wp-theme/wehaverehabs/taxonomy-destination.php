<?php
/**
 * Destination guide (e.g. /destinations/costa-rica/). Regions without their own
 * guide text fall back to the search-results layout.
 *
 * @package WeHaveRehabs
 */

$term     = get_queried_object();
$story    = get_term_meta( $term->term_id, 'whr_story', true );
$children = get_terms( array( 'taxonomy' => 'destination', 'parent' => $term->term_id, 'hide_empty' => false ) );
$children = is_wp_error( $children ) ? array() : $children;

if ( ! $story && ! $children ) {
	require __DIR__ . '/archive-sanctuary.php';
	return;
}

get_header();

$facts   = whr_rows( get_term_meta( $term->term_id, 'whr_facts', true ), 2 );
$reasons = whr_rows( get_term_meta( $term->term_id, 'whr_reasons', true ), 2 );
$guide   = whr_rows( get_term_meta( $term->term_id, 'whr_guide', true ), 2 );
$faq     = whr_rows( get_term_meta( $term->term_id, 'whr_faq', true ), 2 );
$tagline = get_term_meta( $term->term_id, 'whr_tagline', true );
$count   = whr_term_count( $term );
?>

<?php $has_photo = whr_term_has_image( $term ); ?>
<section class="hero<?php echo $has_photo ? '' : ' hero--md hero--plain'; ?>">
	<?php if ( $has_photo ) : ?>
		<?php echo whr_term_image( $term, 'whr-hero', array( 'class' => 'hero__img', 'alt' => '', 'loading' => 'eager', 'fetchpriority' => 'high' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		<div class="hero__shade"></div>
	<?php endif; ?>
	<div class="hero__body" style="padding-bottom:90px">
		<div class="eyebrow"><?php echo $term->parent ? wp_kses_post( whr_destination_trail( $term ) ) : esc_html__( 'Destination', 'wehaverehabs' ); ?></div>
		<h1 class="hero__title hero__title--xl"><?php echo esc_html( $term->name ); ?></h1>
		<?php if ( $tagline ) : ?>
			<p class="hero__sub" style="margin-bottom:32px"><?php echo esc_html( $tagline ); ?></p>
		<?php endif; ?>
		<a class="btn btn--primary" href="<?php echo esc_url( whr_search_url( array( 'dest' => $term->slug ) ) ); ?>">
			<?php
			/* translators: %s: number of sanctuaries */
			echo esc_html( sprintf( _n( 'See %s sanctuary', 'See %s sanctuaries', $count, 'wehaverehabs' ), number_format_i18n( $count ) ) );
			?>
		</a>
	</div>
</section>

<?php if ( $facts ) : ?>
<section class="glance">
	<div class="wrap">
		<dl>
			<?php foreach ( $facts as $fact ) : ?>
				<div><dt><?php echo esc_html( $fact[0] ); ?></dt><dd><?php echo esc_html( $fact[1] ); ?></dd></div>
			<?php endforeach; ?>
		</dl>
	</div>
</section>
<?php endif; ?>

<?php if ( $story || $reasons ) : ?>
<section class="section">
	<div class="wrap two-col">
		<div class="pair">
			<?php
			$pics = get_posts(
				array(
					'post_type'   => 'sanctuary',
					'numberposts' => 2,
					'fields'      => 'ids',
					'tax_query'   => array( array( 'taxonomy' => 'destination', 'terms' => $term->term_id ) ), // phpcs:ignore WordPress.DB.SlowDBQuery
				)
			);
			$fallbacks = array( 'waterfall.jpg', 'plunge.jpg' );
			for ( $i = 0; $i < 2; $i++ ) {
				$ids = isset( $pics[ $i ] ) ? whr_gallery_ids( $pics[ $i ] ) : array();
				echo whr_image( $ids ? end( $ids ) : 0, 'whr-card', array( 'alt' => '' ), $fallbacks[ $i ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			}
			?>
		</div>
		<div>
			<div class="eyebrow">
				<?php
				/* translators: %s: destination */
				echo esc_html( sprintf( __( 'Why %s', 'wehaverehabs' ), $term->name ) );
				?>
			</div>
			<h2 class="display display--md" style="margin-bottom:24px"><?php echo wp_kses_post( __( 'Far enough to <em>let go.</em> Close enough to feel safe.', 'wehaverehabs' ) ); ?></h2>
			<?php echo wp_kses_post( wpautop( $story ) ); ?>
			<?php if ( $reasons ) : ?>
				<div class="reasons">
					<?php foreach ( $reasons as $r ) : ?>
						<div><strong><?php echo esc_html( $r[0] ); ?></strong><span><?php echo esc_html( $r[1] ); ?></span></div>
					<?php endforeach; ?>
				</div>
			<?php endif; ?>
		</div>
	</div>
</section>
<?php endif; ?>

<?php if ( $children ) : ?>
<section class="section bg-sand">
	<div class="wrap">
		<div class="section-head center">
			<div class="eyebrow"><?php esc_html_e( 'Regions', 'wehaverehabs' ); ?></div>
			<h2 class="display"><?php echo wp_kses_post( __( 'Choose your <em>landscape</em>', 'wehaverehabs' ) ); ?></h2>
		</div>
		<div class="tiles tiles--regions">
			<?php foreach ( $children as $child ) : ?>
				<a class="tile<?php echo whr_term_has_image( $child ) ? '' : ' tile--plain'; ?>" href="<?php echo esc_url( get_term_link( $child ) ); ?>">
					<?php echo whr_term_has_image( $child ) ? whr_term_image( $child, 'whr-wide', array( 'alt' => '' ) ) : ''; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					<span class="tile__label">
						<span class="tile__name"><?php echo esc_html( $child->name ); ?></span>
						<span class="tile__desc"><?php echo esc_html( trim( get_term_meta( $child->term_id, 'whr_card', true ) . ' · ' . whr_count_label( $child ), ' ·' ) ); ?></span>
					</span>
				</a>
			<?php endforeach; ?>
		</div>
	</div>
</section>
<?php endif; ?>

<?php
$list = new WP_Query(
	array(
		'post_type'      => 'sanctuary',
		'posts_per_page' => 6,
		'no_found_rows'  => true,
		'tax_query'      => array( array( 'taxonomy' => 'destination', 'terms' => $term->term_id ) ), // phpcs:ignore WordPress.DB.SlowDBQuery
	)
);
if ( $list->have_posts() ) :
	?>
<section class="section">
	<div class="wrap">
		<div class="section-head section-head--split">
			<h2 class="display" style="margin:0">
				<?php
				/* translators: %s: destination */
				echo wp_kses_post( sprintf( __( 'Sanctuaries in <em>%s</em>', 'wehaverehabs' ), esc_html( $term->name ) ) );
				?>
			</h2>
			<a class="eyebrow" href="<?php echo esc_url( whr_search_url( array( 'dest' => $term->slug ) ) ); ?>"><?php esc_html_e( 'View all & filter →', 'wehaverehabs' ); ?></a>
		</div>
		<div class="card-grid">
			<?php
			while ( $list->have_posts() ) {
				$list->the_post();
				get_template_part( 'template-parts/card-sanctuary' );
			}
			wp_reset_postdata();
			?>
		</div>
	</div>
</section>
<?php endif; ?>

<?php if ( $guide ) : ?>
<section class="split bg-dark">
	<div class="split__body" style="flex-grow:1.3">
		<div class="eyebrow"><?php esc_html_e( 'Before you go', 'wehaverehabs' ); ?></div>
		<h2 class="display display--md" style="margin-bottom:40px">
			<?php
			/* translators: %s: destination */
			echo wp_kses_post( sprintf( __( 'Travelling to %s <em>for healing</em>', 'wehaverehabs' ), esc_html( $term->name ) ) );
			?>
		</h2>
		<div class="guide-grid">
			<?php foreach ( $guide as $g ) : ?>
				<div><h3><?php echo esc_html( $g[0] ); ?></h3><p><?php echo esc_html( $g[1] ); ?></p></div>
			<?php endforeach; ?>
		</div>
	</div>
	<div class="split__media" style="flex-basis:420px">
		<?php echo whr_image( 0, 'whr-card', array( 'alt' => '' ), 'calm.jpg' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
	</div>
</section>
<?php endif; ?>

<section class="section">
	<div class="wrap two-col" style="align-items:flex-start">
		<?php if ( $faq ) : ?>
			<div class="faq" style="flex-grow:1.4">
				<h2 class="display display--md" style="margin:0 0 26px"><?php echo wp_kses_post( __( 'Questions, <em>gently answered</em>', 'wehaverehabs' ) ); ?></h2>
				<?php foreach ( $faq as $i => $q ) : ?>
					<details<?php echo 0 === $i ? ' open' : ''; ?>><summary><?php echo esc_html( $q[0] ); ?></summary><p><?php echo esc_html( $q[1] ); ?></p></details>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>
		<aside class="side-card">
			<h2>
				<?php
				/* translators: %s: destination */
				echo wp_kses_post( sprintf( __( 'Planning a stay in <em>%s?</em>', 'wehaverehabs' ), esc_html( $term->name ) ) );
				?>
			</h2>
			<p><?php esc_html_e( 'Our advisors know these sanctuaries personally. Free and private — by phone, video or WhatsApp.', 'wehaverehabs' ); ?></p>
			<?php
			$talk = whr_option( 'advisor_url' ) ? whr_option( 'advisor_url' ) : whr_whatsapp_url( whr_option( 'whatsapp' ) );
			if ( $talk ) :
				?>
				<a class="btn btn--primary" href="<?php echo esc_url( $talk ); ?>"><?php esc_html_e( 'Speak with an advisor', 'wehaverehabs' ); ?></a>
			<?php endif; ?>
			<?php
			$others = get_terms( array( 'taxonomy' => 'destination', 'parent' => 0, 'exclude' => array( $term->term_id ), 'hide_empty' => false ) );
			if ( $others && ! is_wp_error( $others ) ) :
				?>
				<div style="margin-top:30px;padding-top:22px;border-top:1px solid var(--line)">
					<div class="eyebrow" style="color:var(--text);margin-bottom:12px"><?php esc_html_e( 'Other destinations', 'wehaverehabs' ); ?></div>
					<div class="inline-links">
						<?php foreach ( $others as $o ) : ?>
							<a href="<?php echo esc_url( get_term_link( $o ) ); ?>"><?php echo esc_html( $o->name ); ?></a>
						<?php endforeach; ?>
					</div>
				</div>
			<?php endif; ?>
		</aside>
	</div>
</section>

<?php
get_footer();
