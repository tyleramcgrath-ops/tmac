<?php
/**
 * Site header. On photo-led pages it floats over the hero.
 *
 * @package WeHaveRehabs
 */

?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip-link screen-reader-text" href="#content"><?php esc_html_e( 'Skip to content', 'wehaverehabs' ); ?></a>

<div class="site-chrome">
	<div class="support-bar">
		<div class="wrap">
			<span>
				<?php echo esc_html( whr_text( 'crisis_text' ) ); ?>
				· <a href="<?php echo esc_url( whr_text( 'helplines_url' ) ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'Helplines worldwide', 'wehaverehabs' ); ?></a>
			</span>
			<span>
				<?php esc_html_e( 'Private guidance from our care team', 'wehaverehabs' ); ?>
				<?php
				$wa = whr_whatsapp_url( whr_option( 'whatsapp' ), __( 'Hello, I would like some guidance.', 'wehaverehabs' ) );
				if ( $wa ) {
					printf( ' · <a href="%s" target="_blank" rel="noopener">WhatsApp</a>', esc_url( $wa ) );
				}
				?>
			</span>
		</div>
	</div>

	<header class="site-header">
		<div class="wrap">
			<button type="button" class="nav-toggle" aria-expanded="false" aria-controls="primary-nav"><?php esc_html_e( 'Menu', 'wehaverehabs' ); ?></button>
			<nav class="header-nav" id="primary-nav" aria-label="<?php esc_attr_e( 'Primary', 'wehaverehabs' ); ?>">
				<?php
				if ( has_nav_menu( 'primary' ) ) {
					wp_nav_menu( array( 'theme_location' => 'primary', 'container' => false, 'depth' => 1 ) );
				} else {
					echo '<ul>';
					printf( '<li><a href="%s">%s</a></li>', esc_url( home_url( '/#destinations' ) ), esc_html__( 'Destinations', 'wehaverehabs' ) );
					printf( '<li><a href="%s">%s</a></li>', esc_url( get_post_type_archive_link( 'sanctuary' ) ), esc_html__( 'Sanctuaries', 'wehaverehabs' ) );
					printf( '<li><a href="%s">%s</a></li>', esc_url( home_url( '/#healing' ) ), esc_html__( 'Healing', 'wehaverehabs' ) );
					echo '</ul>';
				}
				?>
			</nav>

			<?php whr_header_logo(); ?>

			<div class="header-actions">
				<?php
				if ( has_nav_menu( 'secondary' ) ) {
					wp_nav_menu( array( 'theme_location' => 'secondary', 'container' => false, 'depth' => 1, 'items_wrap' => '%3$s', 'fallback_cb' => false ) );
				} elseif ( get_option( 'page_for_posts' ) ) {
					printf( '<a href="%s">%s</a>', esc_url( get_permalink( get_option( 'page_for_posts' ) ) ), esc_html__( 'Journal', 'wehaverehabs' ) );
				}
				if ( function_exists( 'pll_the_languages' ) ) {
					echo '<ul class="lang-list">';
					pll_the_languages( array( 'display_names_as' => 'slug', 'hide_current' => 1 ) );
					echo '</ul>';
				}
				$inquire = whr_option( 'advisor_url' );
				if ( ! $inquire ) {
					$inquire = is_singular( 'sanctuary' ) ? '#inquire' : get_post_type_archive_link( 'sanctuary' );
				}
				?>
				<a class="header-inquire" href="<?php echo esc_url( $inquire ); ?>"><?php esc_html_e( 'Inquire', 'wehaverehabs' ); ?></a>
			</div>
		</div>
	</header>
</div>

<main id="content">
