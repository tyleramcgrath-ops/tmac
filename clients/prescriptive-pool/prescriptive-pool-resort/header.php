<?php if (!defined('ABSPATH')) { exit; } ?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
	<div class="header-inner">
		<?php pps_badge('badge-header'); ?>
		<button class="menu-toggle" aria-controls="site-nav" aria-expanded="false"><span class="menu-label">Menu</span><span class="bars" aria-hidden="true"></span></button>
		<nav id="site-nav" class="site-nav" aria-label="Primary">
			<?php pps_navigation(); ?>
			<?php pps_button('Get a free quote', 'button-header'); ?>
			<a class="nav-phone" href="<?php echo esc_url(pps_tel()); ?>">Call or text <?php echo esc_html(pps_phone()); ?></a>
		</nav>
	</div>
</header>
<main id="main">
