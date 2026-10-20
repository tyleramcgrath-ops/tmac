<?php
/**
 * A single portfolio project.
 *
 * @package tylermcgrath
 */

get_header();
while ( have_posts() ) :
	the_post();
	$tm_terms = get_the_terms( get_the_ID(), 'tm_discipline' );
	$tm_disc  = ( $tm_terms && ! is_wp_error( $tm_terms ) ) ? $tm_terms[0]->name : __( 'Project', 'tylermcgrath' );
	$tm_meta  = array();
	foreach ( tm_project_fields() as $tm_key => $tm_label ) {
		$tm_meta[ $tm_key ] = get_post_meta( get_the_ID(), '_tm_' . $tm_key, true );
	}
	?>
	<main id="main" class="tm-main tm-inner">
		<?php
		get_template_part(
			'template-parts/page-hero',
			null,
			array(
				'eyebrow' => esc_html( $tm_disc . ( $tm_meta['year'] ? ' · ' . $tm_meta['year'] : '' ) ),
				'title'   => esc_html( get_the_title() ),
				'lede'    => has_excerpt() ? esc_html( get_the_excerpt() ) : '',
			)
		);
		?>
		<article <?php post_class( 'tm-section tm-article tm-case' ); ?>>
			<div class="tm-wrap">
				<dl class="tm-case__facts" data-reveal>
					<?php
					$tm_labels = array(
						'client' => __( 'Client', 'tylermcgrath' ),
						'role'   => __( 'Role', 'tylermcgrath' ),
						'year'   => __( 'Year', 'tylermcgrath' ),
						'result' => __( 'Result', 'tylermcgrath' ),
					);
					foreach ( $tm_labels as $tm_key => $tm_label ) :
						if ( ! $tm_meta[ $tm_key ] ) {
							continue;
						}
						?>
						<div><dt><?php echo esc_html( $tm_label ); ?></dt><dd><?php echo esc_html( $tm_meta[ $tm_key ] ); ?></dd></div>
					<?php endforeach; ?>
					<?php if ( $tm_meta['url'] ) : ?>
						<div><dt><?php esc_html_e( 'Live', 'tylermcgrath' ); ?></dt><dd><a href="<?php echo esc_url( $tm_meta['url'] ); ?>" target="_blank" rel="noopener"><?php echo esc_html( preg_replace( '#^https?://(www\.)?#', '', untrailingslashit( $tm_meta['url'] ) ) ); ?> ↗</a></dd></div>
					<?php endif; ?>
				</dl>
				<?php if ( $tm_meta['stack'] ) : ?>
					<div class="tm-project__tags tm-case__tags" data-reveal>
						<?php foreach ( tm_split( $tm_meta['stack'] ) as $tm_tag ) : ?>
							<span><?php echo esc_html( $tm_tag ); ?></span>
						<?php endforeach; ?>
					</div>
				<?php endif; ?>
			</div>
			<?php if ( has_post_thumbnail() ) : ?>
				<figure class="tm-article__media tm-wrap" data-reveal data-tilt><?php the_post_thumbnail( 'tm-wide' ); ?></figure>
			<?php endif; ?>
			<div class="tm-content tm-prose">
				<?php the_content(); ?>
			</div>
			<nav class="tm-wrap tm-case__next">
				<?php
				$tm_next = get_adjacent_post( false, '', false );
				if ( ! $tm_next ) {
					$tm_first = get_posts(
						array(
							'post_type'      => 'tm_project',
							'posts_per_page' => 1,
							'order'          => 'ASC',
							'exclude'        => array( get_the_ID() ),
						)
					);
					$tm_next  = $tm_first ? $tm_first[0] : null;
				}
				?>
				<a class="tm-btn tm-btn--ghost" href="<?php echo esc_url( get_post_type_archive_link( 'tm_project' ) ); ?>">← <?php esc_html_e( 'All work', 'tylermcgrath' ); ?></a>
				<?php if ( $tm_next ) : ?>
					<a class="tm-case__nextlink" href="<?php echo esc_url( get_permalink( $tm_next ) ); ?>" data-spotlight>
						<small><?php esc_html_e( 'Next star', 'tylermcgrath' ); ?></small>
						<span><?php echo esc_html( get_the_title( $tm_next ) ); ?> <?php echo tm_icon( 'arrow' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
					</a>
				<?php endif; ?>
			</nav>
		</article>
	</main>
	<?php
endwhile;
get_footer();
