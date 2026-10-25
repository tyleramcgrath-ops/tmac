<?php
/**
 * Pages (Our Story, Help, Contact, cart/checkout/account when not using blocks…).
 *
 * @package drip-current
 */

defined( 'ABSPATH' ) || exit;

get_header();
?>
<main id="main" class="site-main">
	<?php
	while ( have_posts() ) :
		the_post();
		$drip_is_shop_page = function_exists( 'is_cart' ) && ( is_cart() || is_checkout() || is_account_page() );
		?>
		<article id="post-<?php the_ID(); ?>" <?php post_class( $drip_is_shop_page ? 'container commerce-page' : 'container page-article' ); ?>>
			<header class="page-header">
				<h1 class="page-title"><?php the_title(); ?></h1>
			</header>
			<?php if ( has_post_thumbnail() && ! $drip_is_shop_page ) : ?>
				<figure class="page-hero"><?php the_post_thumbnail( 'full' ); ?></figure>
			<?php endif; ?>
			<div class="entry-content">
				<?php
				the_content();
				wp_link_pages();
				?>
			</div>
		</article>
		<?php
		if ( comments_open() || get_comments_number() ) {
			comments_template();
		}
	endwhile;
	?>
</main>
<?php
get_footer();
