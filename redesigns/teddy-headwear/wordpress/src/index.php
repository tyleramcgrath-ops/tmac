<?php
/**
 * Fallback for posts, archives and search.
 */
defined( 'ABSPATH' ) || exit;
teddy_body( array( 'page' => 'page' ) );
get_header();
?>
<section class="phero"><div class="wrap" style="display:grid;gap:18px">
	<span class="eyebrow"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></span>
	<h1 class="display" style="font-size:clamp(44px,8vw,120px)"><?php echo is_singular() ? esc_html( get_the_title() ) : wp_kses_post( get_the_archive_title() ? get_the_archive_title() : __( 'Journal', 'teddy' ) ); ?></h1>
</div></section>
<section class="section--tight"><div class="wrap">
	<div class="page-panel entry-content">
	<?php
	if ( have_posts() ) :
		while ( have_posts() ) :
			the_post();
			if ( is_singular() ) {
				the_content();
			} else {
				echo '<article style="padding-block:18px;border-bottom:1px solid rgba(17,36,26,.14)"><h2 style="margin:0 0 6px"><a href="' . esc_url( get_permalink() ) . '">' . esc_html( get_the_title() ) . '</a></h2>';
				the_excerpt();
				echo '</article>';
			}
		endwhile;
		the_posts_pagination();
	else :
		echo '<p>' . esc_html__( 'Nothing here yet.', 'teddy' ) . '</p>';
	endif;
	?>
	</div>
</div></section>
<?php
get_footer();
