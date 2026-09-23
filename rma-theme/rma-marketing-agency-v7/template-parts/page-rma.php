<?php
/**
 * The layout for the theme's own pages: the eight services plus Services,
 * Case Studies, About, Insights, and Contact.
 *
 * If the page has content in the editor, that content is shown in place of
 * the built-in copy, so the team can rewrite any page without touching code.
 *
 * @package rma
 */

$rma_slug     = $args['slug'];
$rma_services = rma_services();
$rma_service  = isset( $rma_services[ $rma_slug ] ) ? $rma_services[ $rma_slug ] : null;
$rma_page     = $rma_service ? $rma_service : rma_company_pages()[ $rma_slug ];
$rma_title    = $rma_page['title'];
$rma_has_body = '' !== trim( get_the_content() );
$rma_name     = $rma_service ? $rma_title : 'Marketing';
$rma_subject  = $rma_service ? str_replace( array( 'ai ', 'seo' ), array( 'AI ', 'SEO' ), strtolower( $rma_title ) ) : 'marketing';
?>
<main id="main">

	<header class="subhero">
		<div class="hero-aurora" aria-hidden="true"><i></i><i></i></div>
		<div class="subhero-inner wrap">
			<div class="subhero-copy">
				<nav class="crumbs" aria-label="Breadcrumb">
					<a href="<?php echo rma_url(); ?>">Home</a>
					<?php if ( $rma_service ) : ?>
						<span aria-hidden="true">/</span><a href="<?php echo rma_url( 'services' ); ?>">Services</a>
					<?php endif; ?>
					<span aria-hidden="true">/</span><span aria-current="page"><?php echo esc_html( $rma_title ); ?></span>
				</nav>
				<p class="pill"><?php echo $rma_service ? esc_html( $rma_service['tag'] ) : 'Relative Marketing Agency'; ?></p>
				<h1><?php echo esc_html( $rma_title ); ?></h1>
				<p class="lede"><?php echo esc_html( $rma_page['summary'] ); ?></p>
				<?php if ( 'contact' !== $rma_slug ) : ?>
					<div class="hero-actions">
						<a class="btn btn-glow" href="<?php echo rma_url( 'contact' ); ?>" data-magnetic><?php echo $rma_service ? 'Start Planning' : "Let's Talk"; ?> <?php echo rma_icon( 'arrow', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
					</div>
				<?php endif; ?>
			</div>
			<div class="subhero-art" aria-hidden="true">
				<div class="orbit orbit-small">
					<div class="orbit-ring ring-1"></div>
					<div class="orbit-ring ring-2"></div>
					<div class="orbit-core">
						<?php echo $rma_service ? rma_icon( $rma_slug, 56 ) : rma_logo(); // phpcs:ignore WordPress.Security.EscapeOutput ?>
					</div>
				</div>
			</div>
		</div>
	</header>

	<?php if ( 'contact' === $rma_slug ) : ?>
		<section class="contact wrap" id="contact-form">
			<div class="contact-side">
				<p class="eyebrow">What happens next</p>
				<ol class="contact-steps">
					<li><b>Tell us the goal</b><span>A few lines about the business and what needs to move.</span></li>
					<li><b>We look first</b><span>We review your site, channels, and reporting before we talk.</span></li>
					<li><b>You get a first plan</b><span>The two or three moves that matter most, and how we'd measure them.</span></li>
				</ol>
			</div>
			<form class="contact-form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<?php echo rma_form_fields( 'contact' ); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped inside. ?>
				<?php echo rma_form_status(); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				<div class="field-row">
					<label class="field"><span>Name</span><input type="text" name="name" required autocomplete="name"></label>
					<label class="field"><span>Email</span><input type="email" name="email" required autocomplete="email"></label>
				</div>
				<label class="field"><span>Company</span><input type="text" name="company" autocomplete="organization"></label>
				<fieldset class="field">
					<legend>What do you need help with?</legend>
					<div class="choices">
						<?php foreach ( $rma_services as $service ) : ?>
							<label class="choice"><input type="radio" name="interest" value="<?php echo esc_attr( $service['title'] ); ?>"><span><?php echo esc_html( $service['title'] ); ?></span></label>
						<?php endforeach; ?>
						<label class="choice"><input type="radio" name="interest" value="Not sure yet" checked><span>Not sure yet</span></label>
					</div>
				</fieldset>
				<label class="field"><span>Message</span><textarea name="message" rows="5" placeholder="Where is marketing stuck right now?"></textarea></label>
				<button class="btn btn-glow btn-large" type="submit">Send it <?php echo rma_icon( 'arrow', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
			</form>
		</section>
	<?php endif; ?>

	<?php if ( 'services' === $rma_slug ) : ?>
		<section class="services wrap">
			<div class="bento bento-even">
				<?php
				$rma_n = 0;
				foreach ( $rma_services as $slug => $service ) :
					++$rma_n;
					?>
					<a class="card reveal" href="<?php echo rma_url( $slug ); ?>" data-spotlight style="--d:<?php echo (int) $rma_n; ?>">
						<span class="card-top">
							<span class="card-icon"><?php echo rma_icon( $slug, 22 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
							<span class="card-num">0<?php echo (int) $rma_n; ?></span>
						</span>
						<span class="card-body">
							<span class="card-tag"><?php echo esc_html( $service['tag'] ); ?></span>
							<span class="card-title"><?php echo esc_html( $service['title'] ); ?></span>
							<span class="card-text"><?php echo esc_html( $service['summary'] ); ?></span>
						</span>
						<span class="card-go"><?php echo rma_icon( 'arrow-up-right', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
					</a>
				<?php endforeach; ?>
			</div>
		</section>
	<?php endif; ?>

	<?php if ( $rma_has_body ) : ?>
		<article class="wrap prose-wrap">
			<div class="prose"><?php the_content(); ?></div>
		</article>
	<?php elseif ( 'contact' !== $rma_slug ) : ?>
		<section class="essay wrap">
			<aside class="essay-aside reveal">
				<p class="eyebrow">Inside this page</p>
				<p>Strategy, creative direction, social media support, website alignment, campaign planning, and reporting.</p>
				<a class="link-arrow" href="<?php echo rma_url( 'contact' ); ?>">Talk to RMA <?php echo rma_icon( 'arrow-up-right', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
			</aside>
			<div class="essay-body">
				<?php foreach ( rma_essay( $rma_name, $rma_subject ) as $i => $para ) : ?>
					<p class="reveal<?php echo 0 === $i ? ' essay-lead' : ''; ?>"><?php echo esc_html( $para ); ?></p>
				<?php endforeach; ?>
			</div>
		</section>

		<section class="approach wrap">
			<div class="section-head reveal">
				<div>
					<p class="eyebrow">How we approach it</p>
					<h2>Ten questions every plan <em>answers first.</em></h2>
				</div>
			</div>
			<ol class="approach-grid">
				<?php foreach ( rma_approach() as $i => $item ) : ?>
					<li class="reveal" style="--d:<?php echo (int) ( $i % 5 ); ?>">
						<span class="approach-num"><?php echo esc_html( str_pad( (string) ( $i + 1 ), 2, '0', STR_PAD_LEFT ) ); ?></span>
						<b><?php echo esc_html( $item[0] ); ?></b>
						<p><?php echo esc_html( $item[1] ); ?></p>
					</li>
				<?php endforeach; ?>
			</ol>
		</section>
	<?php endif; ?>

	<?php if ( $rma_service ) : ?>
		<section class="related wrap">
			<p class="eyebrow">Works well with</p>
			<div class="related-row">
				<?php
				$rma_keys  = array_keys( $rma_services );
				$rma_at    = array_search( $rma_slug, $rma_keys, true );
				$rma_count = count( $rma_keys );
				for ( $k = 1; $k <= 3; $k++ ) :
					$slug    = $rma_keys[ ( $rma_at + $k ) % $rma_count ];
					$service = $rma_services[ $slug ];
					?>
					<a class="related-card" href="<?php echo rma_url( $slug ); ?>" data-spotlight>
						<span class="card-icon"><?php echo rma_icon( $slug, 20 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
						<b><?php echo esc_html( $service['title'] ); ?></b>
						<?php echo rma_icon( 'arrow-up-right', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
					</a>
				<?php endfor; ?>
			</div>
		</section>
	<?php endif; ?>

</main>
