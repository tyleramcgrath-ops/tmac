<?php
get_header();
while (have_posts()) :
	the_post();
	?>
	<section class="page-head"><div class="wrap"><?php the_title('<h1>', '</h1>'); ?></div></section>
	<section class="section"><div class="wrap narrow entry"><?php the_content(); wp_link_pages(); ?></div></section>
	<?php
endwhile;
pps_cta();
get_footer();
