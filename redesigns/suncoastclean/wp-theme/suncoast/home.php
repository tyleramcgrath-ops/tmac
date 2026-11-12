<?php
/**
 * The News page: every post, grouped by year. Also used for archives and search (index.php).
 */

get_header();

$title = is_home() ? 'News' : ( is_search() ? 'Search results' : wp_strip_all_tags( get_the_archive_title() ) );
$count = (int) $wp_query->found_posts;
$first = $count ? get_the_date( 'F j, Y', $wp_query->posts[ $count - 1 ] ) : '';
$last  = $count ? get_the_date( 'F j, Y', $wp_query->posts[0] ) : '';
$meta  = $count ? $count . ' articles, ' . $first . ' to ' . $last : 'Nothing published yet.';
$crumbs = suncoast_breadcrumbs( array( array( 'Home', home_url( '/' ) ), array( $title, null ) ) );
echo suncoast_page_hero( 'News', $title, esc_html( $meta ), $crumbs ); // phpcs:ignore
?>
<div class="wrap page-grid">
  <article>
    <?php
    $year = '';
    while ( have_posts() ) :
      the_post();
      $y = get_the_date( 'Y' );
      if ( $y !== $year ) {
        if ( $year !== '' ) {
          echo '</ul>';
        }
        $year = $y;
        echo '<h2 class="news-year">' . esc_html( $y ) . '</h2><ul class="news-list">';
      }
      ?>
      <li><h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3><time datetime="<?php echo esc_attr( get_the_date( 'Y-m-d' ) ); ?>"><?php echo esc_html( get_the_date( 'F j, Y' ) ); ?></time><p><?php echo esc_html( suncoast_excerpt( get_post() ) ); ?></p></li>
      <?php
    endwhile;
    if ( $year !== '' ) {
      echo '</ul>';
    }
    if ( ! $count ) {
      echo '<p>No articles found. <a href="' . esc_url( suncoast_url( 'news' ) ) . '">See all news</a>.</p>';
    }
    ?>
  </article>
  <aside class="side">
    <?php echo suncoast_estimate_form( true ) . suncoast_side_list( 'All services', suncoast_services() ); // phpcs:ignore ?>
  </aside>
</div>
<?php get_footer(); ?>
