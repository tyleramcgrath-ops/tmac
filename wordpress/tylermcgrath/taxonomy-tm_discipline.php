<?php
/**
 * The full portfolio.
 *
 * @package tylermcgrath
 */

get_header();
?>
<main id="main" class="tm-main tm-inner">
	<?php
	get_template_part(
		'template-parts/page-hero',
		null,
		array(
			'eyebrow' => esc_html( tm_mod( 'work_eyebrow' ) ),
			'title'   => is_tax() ? esc_html( single_term_title( '', false ) ) : esc_html( tm_mod( 'work_title' ) ),
			'lede'    => esc_html( tm_mod( 'work_text' ) ),
		)
	);
	?>
	<section class="tm-section tm-work" data-section="work" data-compass="executing">
		<div class="tm-wrap">
			<?php
			$tm_terms = get_terms(
				array(
					'taxonomy'   => 'tm_discipline',
					'hide_empty' => true,
				)
			);
			if ( $tm_terms && ! is_wp_error( $tm_terms ) ) :
				?>
				<div class="tm-work__filters">
					<a class="<?php echo is_post_type_archive( 'tm_project' ) ? 'is-active' : ''; ?>" href="<?php echo esc_url( get_post_type_archive_link( 'tm_project' ) ); ?>"><?php esc_html_e( 'All', 'tylermcgrath' ); ?></a>
					<?php foreach ( $tm_terms as $tm_term ) : ?>
						<a class="<?php echo is_tax( 'tm_discipline', $tm_term->term_id ) ? 'is-active' : ''; ?>" href="<?php echo esc_url( get_term_link( $tm_term ) ); ?>"><?php echo esc_html( $tm_term->name ); ?> <span><?php echo (int) $tm_term->count; ?></span></a>
					<?php endforeach; ?>
				</div>
			<?php endif; ?>
			<ol class="tm-projects tm-projects--grid">
				<?php
				$tm_i = 0;
				while ( have_posts() ) :
					the_post();
					$tm_t  = get_the_terms( get_the_ID(), 'tm_discipline' );
					$tm_r  = get_post_meta( get_the_ID(), '_tm_result', true );
					$tm_y  = get_post_meta( get_the_ID(), '_tm_year', true );
					++$tm_i;
					?>
					<li class="tm-project" data-reveal>
						<a class="tm-project__card" href="<?php the_permalink(); ?>" data-tilt data-spotlight>
							<?php if ( has_post_thumbnail() ) : ?>
								<span class="tm-project__media"><?php the_post_thumbnail( 'tm-card', array( 'loading' => 'lazy' ) ); ?></span>
							<?php endif; ?>
							<span class="tm-project__num"><?php echo esc_html( str_pad( (string) $tm_i, 2, '0', STR_PAD_LEFT ) ); ?></span>
							<span class="tm-project__meta"><?php echo esc_html( ( $tm_t && ! is_wp_error( $tm_t ) ? $tm_t[0]->name : '' ) . ( $tm_y ? ' · ' . $tm_y : '' ) ); ?></span>
							<span class="tm-project__title"><?php the_title(); ?></span>
							<span class="tm-project__excerpt"><?php echo esc_html( wp_strip_all_tags( get_the_excerpt() ) ); ?></span>
							<?php if ( $tm_r ) : ?>
								<span class="tm-project__result"><?php echo tm_icon( 'star' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> <?php echo esc_html( $tm_r ); ?></span>
							<?php endif; ?>
							<span class="tm-project__go" aria-hidden="true"><?php echo tm_icon( 'arrow' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
						</a>
					</li>
				<?php endwhile; ?>
			</ol>
			<div class="tm-pagination"><?php the_posts_pagination(); ?></div>
		</div>
	</section>
</main>
<?php
get_footer();
