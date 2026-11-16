<?php
/**
 * Every ordinary page: dark header with breadcrumbs, the page's copy, supporting sections, sidebar.
 * The Services, Locations, stain-guide index and News pages are handled here too.
 */

get_header();
the_post();

$kind = suncoast_page_kind();
list( $label, $parent ) = suncoast_section( $kind );
$eyebrow = ( $parent && $parent !== get_post()->post_name ) ? '<a href="' . esc_url( suncoast_url( $parent ) ) . '">' . esc_html( $label ) . '</a>' : esc_html( $label );

echo suncoast_page_hero( $eyebrow, get_the_title(), '', suncoast_breadcrumbs() ); // phpcs:ignore
?>
<div class="wrap page-grid">
  <div>
    <article class="prose">
      <?php
      the_content();
      if ( $kind === 'stains-index' ) {
        $tiles = '';
        foreach ( suncoast_stains() as $s ) {
          $p = get_page_by_path( $s );
          if ( $p ) {
            $tiles .= '<a href="' . esc_url( get_permalink( $p ) ) . '">' . esc_html( get_the_title( $p ) ) . '</a>';
          }
        }
        echo '<p>Pick the stain for Sun Coast\'s own step-by-step instructions. Please test every method in an inconspicuous area first. If the stain won\'t come out, call <a href="tel:' .
          esc_attr( suncoast_option( 'phone_tel' ) ) . '">' . esc_html( suncoast_option( 'phone' ) ) . '</a> and we will have it cleaned today.</p><div class="tile-grid">' . $tiles . '</div>'; // phpcs:ignore
      }
      ?>
    </article>
    <?php echo suncoast_page_extras(); // phpcs:ignore ?>
  </div>
  <aside class="side">
    <?php echo suncoast_sidebar(); // phpcs:ignore ?>
  </aside>
</div>
<?php get_footer(); ?>
