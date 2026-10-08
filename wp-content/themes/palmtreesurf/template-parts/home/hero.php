<?php
/**
 * Homepage hero — approved mockup.
 *
 * Script "Tamarindo" accent, large headline, supporting line, universal search
 * and a four-item trust row.
 *
 * The trust items are Customizer fields with deliberately modest defaults. The
 * brief is explicit that a price guarantee or bilingual support may only be
 * claimed if it is operationally true, so none of those claims are hardcoded.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_script  = pt_filled( 'pt_hero_script' );
$pt_heading = pt_filled( 'pt_hero_heading' );
$pt_tagline = pt_filled( 'pt_hero_tagline' );
$pt_text    = pt_filled( 'pt_hero_text' );
$pt_accent  = pt_filled( 'pt_hero_corner' );

$pt_trust = array_filter(
	array(
		array( 'bolt', pt_filled( 'pt_trust_1' ) ),
		array( 'experts', pt_filled( 'pt_trust_2' ) ),
		array( 'shield', pt_filled( 'pt_trust_3' ) ),
		array( 'globe', pt_filled( 'pt_trust_4' ) ),
	),
	function ( $item ) {
		return '' !== $item[1];
	}
);
?>
<section class="hero">
	<div class="hero__media">
		<?php pt_image( 'hero-home', array( 'priority' => true, 'class' => 'hero__image' ) ); ?>
	</div>

	<div class="hero__inner container">
		<?php if ( $pt_script ) : ?>
			<p class="hero__script"><?php echo esc_html( $pt_script ); ?></p>
		<?php endif; ?>

		<h1 class="hero__title"><?php echo esc_html( $pt_heading ? $pt_heading : get_bloginfo( 'name' ) ); ?></h1>

		<?php if ( $pt_tagline ) : ?>
			<p class="hero__tagline"><?php echo esc_html( $pt_tagline ); ?></p>
		<?php endif; ?>

		<?php if ( $pt_text ) : ?>
			<p class="hero__text"><?php echo esc_html( $pt_text ); ?></p>
		<?php endif; ?>

		<?php // A real search: submits to the experiences archive. ?>
		<form class="hero-search" role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>">
			<label class="screen-reader-text" for="hero-search-field">
				<?php esc_html_e( 'Search experiences', 'palmtreesurf' ); ?>
			</label>
			<?php echo pt_get_icon( 'search', 'hero-search__icon', 20 ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static SVG. ?>
			<input
				type="search"
				id="hero-search-field"
				name="s"
				class="hero-search__field"
				placeholder="<?php esc_attr_e( 'What are you looking for?', 'palmtreesurf' ); ?>"
				value="<?php echo esc_attr( get_search_query() ); ?>"
			/>
			<input type="hidden" name="post_type" value="<?php echo esc_attr( PT_EXPERIENCE_POST_TYPE ); ?>" />
			<button class="btn btn--primary hero-search__submit" type="submit">
				<?php esc_html_e( 'Search', 'palmtreesurf' ); ?>
			</button>
		</form>

		<?php if ( $pt_accent ) : ?>
			<p class="hero__corner"><?php echo esc_html( $pt_accent ); ?></p>
		<?php endif; ?>
	</div>

	<?php if ( $pt_trust ) : ?>
		<div class="hero__trustbar">
			<ul class="hero__trust container">
				<?php foreach ( $pt_trust as $pt_item ) : ?>
					<li>
						<?php echo pt_get_icon( $pt_item[0], '', 20 ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static SVG. ?>
						<span><?php echo esc_html( $pt_item[1] ); ?></span>
					</li>
				<?php endforeach; ?>
			</ul>
		</div>
	<?php endif; ?>
</section>
