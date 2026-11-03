<?php
/**
 * Blog post card.
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

$cats = get_the_category();
?>
<article <?php post_class( 'post-card' ); ?>>
	<a class="post-card__media" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true">
		<?php if ( has_post_thumbnail() ) : ?>
			<?php the_post_thumbnail( 'popeye-wide', array( 'loading' => 'lazy' ) ); ?>
		<?php else : ?>
			<img src="<?php echo esc_url( popeye_img( 'public_fbab_6229d9679bfe4e8c8741d48790e51b52' ) ); ?>" alt="" loading="lazy">
		<?php endif; ?>
		<?php if ( $cats ) : ?>
			<span class="pill"><?php echo esc_html( $cats[0]->name ); ?></span>
		<?php endif; ?>
	</a>
	<div class="post-card__body">
		<p class="post-card__meta"><?php echo esc_html( get_the_date( 'F Y' ) ); ?> · <?php echo esc_html( sprintf( _n( '%d min read', '%d min read', popeye_reading_time(), 'popeye-charters' ), popeye_reading_time() ) ); ?></p>
		<h3 class="post-card__title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
		<p class="post-card__excerpt"><?php echo esc_html( wp_trim_words( get_the_excerpt(), 22, '…' ) ); ?></p>
		<a class="link-arrow" href="<?php the_permalink(); ?>"><?php esc_html_e( 'Read Article', 'popeye-charters' ); ?> <?php popeye_the_icon( 'arrow' ); ?></a>
	</div>
</article>
