<?php
/**
 * Homepage FAQ.
 *
 * The same questions the About page answers, which is deliberate: these are
 * what people type into a search box, and the homepage is the page most likely
 * to be returned for them. The schema is emitted once, from here, so the two
 * pages never compete with duplicate FAQ markup.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_faq = array_slice( pt_about_faq(), 0, 6 );

if ( ! $pt_faq ) {
	return;
}
?>
<section class="section section--sand home-faq">
	<div class="container container--narrow">
		<header class="section__header">
			<p class="eyebrow"><?php esc_html_e( 'Questions', 'palmtreesurf' ); ?></p>
			<h2 class="section__title"><?php esc_html_e( 'Before you book', 'palmtreesurf' ); ?></h2>
		</header>

		<div class="faq">
			<?php foreach ( $pt_faq as $pt_index => $pt_pair ) : ?>
				<details class="faq__item"<?php echo 0 === $pt_index ? ' open' : ''; ?>>
					<summary><?php echo esc_html( $pt_pair[0] ); ?></summary>
					<div class="faq__answer"><p><?php echo esc_html( $pt_pair[1] ); ?></p></div>
				</details>
			<?php endforeach; ?>
		</div>

		<?php
		$pt_about = get_page_by_path( 'about' );

		if ( $pt_about ) :
			?>
			<p class="about-faq__more">
				<?php esc_html_e( 'More about how we run things —', 'palmtreesurf' ); ?>
				<a href="<?php echo esc_url( get_permalink( $pt_about ) ); ?>"><?php esc_html_e( 'read the full story', 'palmtreesurf' ); ?></a>
			</p>
		<?php endif; ?>
	</div>
</section>
