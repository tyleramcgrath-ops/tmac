<?php
/**
 * Page not found.
 */

get_header();
echo suncoast_page_hero( 'Page not found', 'We couldn\'t find that page.', '', suncoast_breadcrumbs( array( array( 'Home', home_url( '/' ) ), array( 'Page not found', null ) ) ) ); // phpcs:ignore
?>
<div class="wrap page-grid">
  <div>
    <article class="prose">
      <p>The address may have changed when the site was rebuilt. Try one of the pages below, <a href="<?php echo esc_url( suncoast_url( 'news' ) ); ?>">browse the news</a>, or call or text <a href="tel:<?php echo esc_attr( suncoast_option( 'phone_tel' ) ); ?>"><?php echo esc_html( suncoast_option( 'phone' ) ); ?></a> and we'll point you the right way.</p>
      <h2>Services</h2>
      <div class="tile-grid">
        <?php foreach ( suncoast_services() as $slug => $label ) : ?>
        <a href="<?php echo esc_url( suncoast_url( $slug ) ); ?>"><?php echo esc_html( $label ); ?></a>
        <?php endforeach; ?>
      </div>
      <h2>Elsewhere on the site</h2>
      <ul>
        <li><a href="<?php echo esc_url( home_url( '/' ) ); ?>">Home</a></li>
        <li><a href="<?php echo esc_url( suncoast_url( 'about-suncoast-carpet-cleaning' ) ); ?>">About Us</a></li>
        <li><a href="<?php echo esc_url( suncoast_url( 'locations' ) ); ?>">Locations</a></li>
        <li><a href="<?php echo esc_url( suncoast_url( 'get-that-stain-out' ) ); ?>">Get That Stain Out!</a></li>
        <li><a href="<?php echo esc_url( suncoast_url( 'contact-us' ) ); ?>">Contact Us</a></li>
      </ul>
    </article>
  </div>
  <aside class="side"><?php echo suncoast_estimate_form( true ) . suncoast_contact_card(); // phpcs:ignore ?></aside>
</div>
<?php get_footer(); ?>
