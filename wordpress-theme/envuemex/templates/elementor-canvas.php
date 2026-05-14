<?php
/**
 * Template Name: Elementor Canvas (Blank)
 *
 * Empty body — no header, no footer. Use for landing pages built end-to-end
 * in Elementor when you want full control over the page chrome.
 *
 * @package envuemex
 */
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'envuemex-canvas' ); ?>>
<?php wp_body_open(); ?>

<?php
while ( have_posts() ) :
	the_post();
	the_content();
endwhile;
?>

<?php wp_footer(); ?>
</body>
</html>
