<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<!-- NAV -->
<header class="nav">
  <a href="<?php echo esc_url(home_url('/')); ?>" class="nav-logo">
    <img src="https://eliteextra.com/wp-content/uploads/2023/06/EnVue2011-500x188-1-66904380e836a6105bae0e94a376d8ad.png" alt="EnVue Telematics">
  </a>
  <ul class="nav-links">
    <li><a href="<?php echo esc_url(home_url('/solutions/')); ?>">Solutions</a></li>
    <li><a href="<?php echo esc_url(home_url('/results/')); ?>">Results</a></li>
    <li><a href="<?php echo esc_url(home_url('/industries/')); ?>">Industries</a></li>
    <li><a href="<?php echo esc_url(home_url('/partners/')); ?>">Partners</a></li>
    <li><a href="<?php echo esc_url(home_url('/resources/')); ?>">Resources</a></li>
    <li><a href="<?php echo esc_url(home_url('/company/')); ?>">Company</a></li>
  </ul>
  <nav class="nav-right">
    <a href="tel:8002011169" class="btn btn-ghost">(800) 201-1169</a>
    <a href="<?php echo esc_url(home_url('/#demo')); ?>" class="btn btn-primary">Get a Demo</a>
  </nav>
</header>
