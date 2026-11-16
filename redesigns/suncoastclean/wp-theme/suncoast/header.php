<!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<?php echo suncoast_icons(); // phpcs:ignore ?>

<div class="topbar">
  <div class="wrap">
    <span>Call or text <a href="tel:<?php echo esc_attr( suncoast_option( 'phone_tel' ) ); ?>"><?php echo esc_html( suncoast_option( 'phone' ) ); ?></a></span>
    <span class="hide-sm">Free estimates · <a href="mailto:<?php echo esc_attr( suncoast_option( 'email' ) ); ?>"><?php echo esc_html( suncoast_option( 'email' ) ); ?></a></span>
  </div>
</div>

<header class="nav">
  <div class="wrap">
    <?php echo suncoast_brand(); // phpcs:ignore ?>
    <nav class="links" aria-label="Main">
      <?php
      if ( has_nav_menu( 'primary' ) ) {
        wp_nav_menu( array( 'theme_location' => 'primary', 'container' => false, 'items_wrap' => '%3$s', 'walker' => new Suncoast_Walker(), 'depth' => 2, 'echo' => true ) );
      } else {
        echo suncoast_fallback_menu(); // phpcs:ignore
      }
      ?>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mmenu" aria-label="Menu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
      <a class="btn btn-primary" href="#estimate">Free estimate</a>
    </nav>
  </div>
</header>
<nav id="mmenu" class="mobile-menu" hidden aria-label="Menu">
  <div class="wrap">
    <?php
    if ( has_nav_menu( 'primary' ) ) {
      wp_nav_menu( array( 'theme_location' => 'primary', 'container' => false, 'items_wrap' => '<ul class="mm">%3$s</ul>', 'depth' => 2 ) );
    } else {
      echo suncoast_fallback_menu( true ); // phpcs:ignore
    }
    ?>
  </div>
</nav>

<main id="top">
