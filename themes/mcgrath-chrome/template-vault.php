<?php
/**
 * Template Name: The Vault (password protected)
 *
 * A private, password protected page for client work. Locked, it renders a
 * terminal-style vault door. Unlocked, it renders whatever you put in the page.
 *
 * @package mcgrath-chrome
 */

get_header();

while ( have_posts() ) :
	the_post();

	if ( post_password_required() ) :
		?>
		<section class="vault">
			<div class="vaultIn">
				<img class="vlogo" src="<?php echo esc_url( get_template_directory_uri() . '/assets/img/logo.png' ); ?>" alt="" aria-hidden="true" width="1109" height="612">
				<div class="vaultRing" aria-hidden="true"><span></span></div>
				<h1 data-tag="&lt;h1&gt;"><?php esc_html_e( 'Restricted', 'mcgrath-chrome' ); ?></h1>
				<p>
					<?php esc_html_e( 'Client work lives behind this door. It is not public, it is not in a portfolio and it is not indexed. If you were given a key, use it.', 'mcgrath-chrome' ); ?>
				</p>
				<?php echo get_the_password_form(); ?>
				<p class="hint"><?php esc_html_e( 'No key? Ask on the call.', 'mcgrath-chrome' ); ?></p>
			</div>
		</section>
		<?php
	else :
		?>
		<section class="phero">
			<canvas id="chrome"></canvas>
			<div class="pin">
				<span class="mono"><?php esc_html_e( 'Unlocked · private', 'mcgrath-chrome' ); ?></span>
				<h1 data-tag="&lt;h1&gt;"><?php the_title(); ?></h1>
			</div>
		</section>

		<div class="gut vaultOpen">
			<span class="mono"><?php esc_html_e( 'Confidential — please do not share this link', 'mcgrath-chrome' ); ?></span>
			<article class="entry rv">
				<?php the_content(); ?>
			</article>
		</div>
		<?php
	endif;

endwhile;

get_footer();
