<?php
/**
 * A page the theme does not own: title, then whatever the editor holds.
 *
 * @package rma
 */

?>
<main id="main">
	<header class="subhero subhero-plain">
		<div class="wrap">
			<p class="eyebrow">RMA</p>
			<h1><?php the_title(); ?></h1>
		</div>
	</header>
	<article <?php post_class( 'wrap prose-wrap' ); ?>>
		<div class="prose"><?php the_content(); ?></div>
	</article>
</main>
