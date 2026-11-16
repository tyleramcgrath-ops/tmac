<?php
/**
 * A news post.
 */

get_header();
the_post();

$crumbs = suncoast_breadcrumbs( array( array( 'Home', home_url( '/' ) ), array( 'News', suncoast_url( 'news' ) ), array( get_the_title(), null ) ) );
echo suncoast_page_hero( '<a href="' . esc_url( suncoast_url( 'news' ) ) . '">News</a>', get_the_title(), '<time datetime="' . esc_attr( get_the_date( 'Y-m-d' ) ) . '">' . esc_html( get_the_date( 'F j, Y' ) ) . '</time>', $crumbs ); // phpcs:ignore

$older = get_previous_post();
$newer = get_next_post();
?>
<div class="wrap page-grid">
  <div>
    <article class="prose">
      <?php the_content(); ?>
    </article>
    <?php echo suncoast_page_extras(); // phpcs:ignore ?>
    <nav class="pager" aria-label="More news">
      <?php if ( $older ) : ?><a href="<?php echo esc_url( get_permalink( $older ) ); ?>"><small>Older</small><?php echo esc_html( get_the_title( $older ) ); ?></a><?php endif; ?>
      <?php if ( $newer ) : ?><a class="next" href="<?php echo esc_url( get_permalink( $newer ) ); ?>"><small>Newer</small><?php echo esc_html( get_the_title( $newer ) ); ?></a><?php endif; ?>
    </nav>
  </div>
  <aside class="side">
    <?php echo suncoast_sidebar(); // phpcs:ignore ?>
  </aside>
</div>
<?php get_footer(); ?>
