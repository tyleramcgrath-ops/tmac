<?php
/**
 * Header — renders <head>, body open tag, ambient blobs, and nav.
 */
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<div class="bg-blob b1"></div>
<div class="bg-blob b2"></div>
<div class="bg-blob b3"></div>

<nav class="top">
    <div class="inner">
        <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="brand">
            <?php
            if ( has_custom_logo() ) {
                the_custom_logo();
            } else {
                echo 'Centris<span class="dot">.</span>';
            }
            ?>
        </a>
        <div class="nav-links">
            <div class="nav-dropdown-wrap">
                <a href="<?php echo esc_url( home_url( '/services' ) ); ?>">Services</a>
                <div class="nav-dropdown">
                    <a href="<?php echo esc_url( home_url( '/service-ai-call-center' ) ); ?>"><span class="num">01</span><span>AI Call Center</span></a>
                    <a href="<?php echo esc_url( home_url( '/service-customer-support' ) ); ?>"><span class="num">02</span><span>Customer Support</span></a>
                    <a href="<?php echo esc_url( home_url( '/service-bpo' ) ); ?>"><span class="num">03</span><span>Business Process Outsourcing</span></a>
                    <a href="<?php echo esc_url( home_url( '/service-inbound-sales' ) ); ?>"><span class="num">04</span><span>Inbound Sales</span></a>
                    <a href="<?php echo esc_url( home_url( '/service-live-chat' ) ); ?>"><span class="num">05</span><span>Live Chat</span></a>
                    <a href="<?php echo esc_url( home_url( '/service-marketing-surveys' ) ); ?>"><span class="num">06</span><span>Marketing Surveys</span></a>
                    <a href="<?php echo esc_url( home_url( '/service-quality-assurance' ) ); ?>"><span class="num">07</span><span>Quality Assurance</span></a>
                    <a href="<?php echo esc_url( home_url( '/service-soft-collections' ) ); ?>"><span class="num">08</span><span>Soft Collections</span></a>
                    <a href="<?php echo esc_url( home_url( '/service-tier-1-tech' ) ); ?>"><span class="num">09</span><span>Tier 1 Tech Support</span></a>
                    <a class="all-link" href="<?php echo esc_url( home_url( '/services' ) ); ?>">View all services →</a>
                </div>
            </div>
            <div class="nav-dropdown-wrap">
                <a href="<?php echo esc_url( home_url( '/industries' ) ); ?>">Industries</a>
                <div class="nav-dropdown">
                    <a href="<?php echo esc_url( home_url( '/industry-insurance' ) ); ?>"><span>Insurance</span></a>
                    <a href="<?php echo esc_url( home_url( '/industry-healthcare' ) ); ?>"><span>Healthcare</span></a>
                    <a href="<?php echo esc_url( home_url( '/industry-retail' ) ); ?>"><span>Retail & E-commerce</span></a>
                    <a href="<?php echo esc_url( home_url( '/industry-security' ) ); ?>"><span>Security</span></a>
                    <a href="<?php echo esc_url( home_url( '/industry-utilities' ) ); ?>"><span>Utilities</span></a>
                    <a href="<?php echo esc_url( home_url( '/industry-finance' ) ); ?>"><span>Finance</span></a>
                    <a class="all-link" href="<?php echo esc_url( home_url( '/industries' ) ); ?>">View all industries →</a>
                </div>
            </div>
            <a href="<?php echo esc_url( home_url( '/case-studies' ) ); ?>">Case Studies</a>
            <a href="<?php echo esc_url( home_url( '/about' ) ); ?>">About</a>
            <a href="<?php echo esc_url( home_url( '/resources' ) ); ?>">Resources</a>
        </div>
        <a href="<?php echo esc_url( home_url( '/contact' ) ); ?>" class="btn sm">Book a demo</a>
    </div>
</nav>

<main>
