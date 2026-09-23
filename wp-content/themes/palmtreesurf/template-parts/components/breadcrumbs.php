<?php
/**
 * Visible breadcrumbs, matching the BreadcrumbList schema exactly.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

if ( is_front_page() ) {
	return;
}

$pt_crumbs = array( array( home_url( '/' ), __( 'Home', 'palmtreesurf' ) ) );

if ( is_singular( PT_EXPERIENCE_POST_TYPE ) ) {
	$pt_archive = get_post_type_archive_link( PT_EXPERIENCE_POST_TYPE );

	if ( $pt_archive ) {
		$pt_crumbs[] = array( $pt_archive, __( 'Experiences', 'palmtreesurf' ) );
	}

	$pt_terms = get_the_terms( get_the_ID(), 'experience_type' );

	if ( $pt_terms && ! is_wp_error( $pt_terms ) ) {
		$pt_term = array_shift( $pt_terms );
		$pt_link = get_term_link( $pt_term );

		if ( ! is_wp_error( $pt_link ) ) {
			$pt_crumbs[] = array( $pt_link, $pt_term->name );
		}
	}

	$pt_crumbs[] = array( '', get_the_title() );
} elseif ( is_tax( array( 'experience_type', 'skill_level' ) ) ) {
	$pt_archive = get_post_type_archive_link( PT_EXPERIENCE_POST_TYPE );

	if ( $pt_archive ) {
		$pt_crumbs[] = array( $pt_archive, __( 'Experiences', 'palmtreesurf' ) );
	}

	$pt_crumbs[] = array( '', single_term_title( '', false ) );
} elseif ( is_post_type_archive( PT_EXPERIENCE_POST_TYPE ) ) {
	$pt_crumbs[] = array( '', __( 'Experiences', 'palmtreesurf' ) );
} elseif ( is_singular() || is_page() ) {
	$pt_crumbs[] = array( '', get_the_title() );
} else {
	return;
}

if ( count( $pt_crumbs ) < 2 ) {
	return;
}
?>
<nav class="breadcrumbs" aria-label="<?php esc_attr_e( 'Breadcrumb', 'palmtreesurf' ); ?>">
	<div class="container">
		<ol class="breadcrumbs__list">
			<?php foreach ( $pt_crumbs as $pt_i => $pt_crumb ) : ?>
				<li class="breadcrumbs__item">
					<?php if ( $pt_crumb[0] ) : ?>
						<a href="<?php echo esc_url( $pt_crumb[0] ); ?>"><?php echo esc_html( $pt_crumb[1] ); ?></a>
					<?php else : ?>
						<span aria-current="page"><?php echo esc_html( $pt_crumb[1] ); ?></span>
					<?php endif; ?>
				</li>
			<?php endforeach; ?>
		</ol>
	</div>
</nav>
