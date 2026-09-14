<?php
/**
 * GENERATED FILE — do not edit directly.
 * Source: index.html.  Rebuild with: python3 tools/build-theme.py
 */
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo( 'charset' ); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<!-- ── TICKER ────────────────────────────────────────────────── -->
<div class="ticker" aria-label="Live platform metrics">
  <div class="ticker-inner">
    <span class="ticker-live"><i></i> Live</span>
    <span>Vehicles monitored <strong>12,480</strong></span>
    <span>Device uptime <strong>98.7%</strong></span>
    <span>Alerts resolved today <strong>47</strong></span>
    <span>US-based support <strong>24/7</strong></span>
  </div>
</div>

<!-- ── HEADER ────────────────────────────────────────────────── -->
<header class="site-header">
  <div class="nav-shell">
    <a class="site-brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="EnVue Telematics">
      <?php envue_brand_image(); ?>
    </a>

    <nav class="primary-nav" aria-label="Primary">
      <ul class="menu">
        <li class="has-menu">
          <a href="<?php echo esc_url( home_url( '/solutions/' ) ); ?>">Solutions</a>
          <div class="dropdown dropdown--wide">
            <a href="<?php echo esc_url( home_url( '/dash-cams/' ) ); ?>"><strong>AI Dash Cams</strong><small>Event-triggered video and driver coaching.</small></a>
            <a href="<?php echo esc_url( home_url( '/gps-tracking/' ) ); ?>"><strong>GPS Tracking</strong><small>Live location, geofencing and trip history.</small></a>
            <a href="<?php echo esc_url( home_url( '/equipment-management/' ) ); ?>"><strong>Equipment &amp; Assets</strong><small>Powered and non-powered asset visibility.</small></a>
            <a href="<?php echo esc_url( home_url( '/maintenance/' ) ); ?>"><strong>Predictive Maintenance</strong><small>Fault alerts before a truck comes off the road.</small></a>
            <a href="<?php echo esc_url( home_url( '/fuel-management/' ) ); ?>"><strong>Fuel Management</strong><small>Idle reduction, MPG and fuel card controls.</small></a>
            <a href="<?php echo esc_url( home_url( '/geotab/' ) ); ?>"><strong>Powered by Geotab</strong><small>300+ integrations on an open platform.</small></a>
          </div>
        </li>
        <li><a href="<?php echo esc_url( home_url( '/results/' ) ); ?>">Results</a></li>
        <li class="has-menu">
          <a href="<?php echo esc_url( home_url( '/industries/' ) ); ?>">Industries</a>
          <div class="dropdown">
            <a href="<?php echo esc_url( home_url( '/construction/' ) ); ?>"><strong>Construction</strong><small>Machines, yards and high-value assets.</small></a>
            <a href="<?php echo esc_url( home_url( '/trucking/' ) ); ?>"><strong>Trucking</strong><small>HOS, compliance and video liability defense.</small></a>
            <a href="<?php echo esc_url( home_url( '/field-services/' ) ); ?>"><strong>Field Services</strong><small>Dispatch accuracy and technician productivity.</small></a>
            <a href="<?php echo esc_url( home_url( '/oil-gas/' ) ); ?>"><strong>Oil &amp; Gas</strong><small>Remote tracking and lone worker safety.</small></a>
            <a href="<?php echo esc_url( home_url( '/government/' ) ); ?>"><strong>Government</strong><small>Public accountability and compliance reporting.</small></a>
          </div>
        </li>
        <li><a href="<?php echo esc_url( home_url( '/partners/' ) ); ?>">Partners</a></li>
        <li><a href="<?php echo esc_url( home_url( '/resources/' ) ); ?>">Resources</a></li>
        <li><a href="<?php echo esc_url( home_url( '/company/' ) ); ?>">Company</a></li>
      </ul>
    </nav>

    <div class="header-actions">
      <a class="header-phone" href="tel:8002011169">(800) 201-1169</a>
      <a class="button button-primary" href="#demo">Get a Demo</a>
      <button class="mobile-toggle" id="mobileToggle" type="button" aria-controls="mobileMenu" aria-expanded="false" aria-label="Open menu">
        <span></span><span></span>
      </button>
    </div>
  </div>

  <div class="mobile-menu" id="mobileMenu" hidden>
    <ul class="menu">
      <li><a href="<?php echo esc_url( home_url( '/solutions/' ) ); ?>">Solutions</a></li>
    </ul>
    <div class="mobile-sub">
      <a href="<?php echo esc_url( home_url( '/dash-cams/' ) ); ?>">AI Dash Cams</a>
      <a href="<?php echo esc_url( home_url( '/gps-tracking/' ) ); ?>">GPS Tracking</a>
      <a href="<?php echo esc_url( home_url( '/equipment-management/' ) ); ?>">Equipment &amp; Assets</a>
      <a href="<?php echo esc_url( home_url( '/maintenance/' ) ); ?>">Maintenance</a>
      <a href="<?php echo esc_url( home_url( '/fuel-management/' ) ); ?>">Fuel Management</a>
      <a href="<?php echo esc_url( home_url( '/geotab/' ) ); ?>">Powered by Geotab</a>
    </div>
    <ul class="menu">
      <li><a href="<?php echo esc_url( home_url( '/results/' ) ); ?>">Results</a></li>
      <li><a href="<?php echo esc_url( home_url( '/industries/' ) ); ?>">Industries</a></li>
      <li><a href="<?php echo esc_url( home_url( '/partners/' ) ); ?>">Partners</a></li>
      <li><a href="<?php echo esc_url( home_url( '/resources/' ) ); ?>">Resources</a></li>
      <li><a href="<?php echo esc_url( home_url( '/company/' ) ); ?>">Company</a></li>
    </ul>
    <a class="button button-primary" href="#demo">Get a Demo</a>
    <a class="header-phone" href="tel:8002011169">(800) 201-1169</a>
  </div>
</header>
