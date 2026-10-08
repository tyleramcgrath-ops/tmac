<?php
/**
 * Where the operator finds the review link and the QR code.
 *
 * The page is no use to anybody if the person running the shop has to ask
 * what its address is every time they want to put it on a card, so the link,
 * a QR code and something printable all live on one admin screen under
 * Comments, next to the reviews themselves.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * The address the bundled QR code actually encodes.
 *
 * A QR code is unreadable to the person holding it, so a stale one is a
 * silent failure: the card looks right and sends every guest to a 404. The
 * screen compares this against the page's real permalink and refuses to show
 * the code when they differ.
 */
const PT_REVIEW_QR_URL = 'https://palmtreesurf.com/leave-a-review/';

/**
 * Add the screen under Comments.
 */
function pt_review_link_menu() {
	add_comments_page(
		__( 'Review link & QR', 'palmtreesurf' ),
		__( 'Review link & QR', 'palmtreesurf' ),
		'edit_posts',
		'pt-review-link',
		'pt_review_link_screen'
	);
}
add_action( 'admin_menu', 'pt_review_link_menu' );

/**
 * Render the screen.
 */
function pt_review_link_screen() {
	if ( ! current_user_can( 'edit_posts' ) ) {
		return;
	}

	$url     = pt_reviews_page_url();
	$matches = ( untrailingslashit( $url ) === untrailingslashit( PT_REVIEW_QR_URL ) );
	$qr      = PT_URI . 'assets/images/qr/leave-a-review.svg';
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Review link & QR', 'palmtreesurf' ); ?></h1>

		<?php if ( ! $url ) : ?>
			<div class="notice notice-error">
				<p><?php esc_html_e( 'The Leave a Review page does not exist yet. Create a page and set its template to "Leave a Review".', 'palmtreesurf' ); ?></p>
			</div>
			</div>
			<?php
			return;
		endif;
		?>

		<p>
			<?php esc_html_e( 'Send this to anyone who has been out with you. They pick their trip, tap the stars and write a line or two — no account, nothing to install.', 'palmtreesurf' ); ?>
		</p>

		<h2><?php esc_html_e( 'The link', 'palmtreesurf' ); ?></h2>
		<p>
			<input type="text" class="large-text code" readonly
				value="<?php echo esc_attr( $url ); ?>"
				onfocus="this.select()" />
		</p>
		<p class="description">
			<?php esc_html_e( 'Paste it into a WhatsApp message, an email signature or the note you send after a trip.', 'palmtreesurf' ); ?>
		</p>

		<h2><?php esc_html_e( 'The QR code', 'palmtreesurf' ); ?></h2>

		<?php if ( ! $matches ) : ?>
			<div class="notice notice-warning">
				<p>
					<strong><?php esc_html_e( 'The bundled QR code no longer matches this page.', 'palmtreesurf' ); ?></strong>
				</p>
				<p>
					<?php
					printf(
						/* translators: 1: address the QR code points at, 2: the page's real address. */
						esc_html__( 'It points at %1$s but the page is now at %2$s. Nobody can tell by looking at a QR code, so it is hidden rather than shown wrong. Ask for a new one, or change the page address back.', 'palmtreesurf' ),
						'<code>' . esc_html( PT_REVIEW_QR_URL ) . '</code>',
						'<code>' . esc_html( $url ) . '</code>'
					);
					?>
				</p>
			</div>
		<?php else : ?>
			<div id="pt-review-card" class="pt-review-card">
				<img src="<?php echo esc_url( $qr ); ?>" alt="<?php esc_attr_e( 'QR code linking to the Leave a Review page', 'palmtreesurf' ); ?>" width="220" height="220" />
				<div>
					<p class="pt-review-card__title"><?php esc_html_e( 'How was your trip?', 'palmtreesurf' ); ?></p>
					<p class="pt-review-card__sub"><?php esc_html_e( 'Scan to leave us a review — it takes a minute.', 'palmtreesurf' ); ?></p>
					<p class="pt-review-card__url"><?php echo esc_html( $url ); ?></p>
				</div>
			</div>

			<p class="pt-review-actions">
				<button type="button" class="button button-primary" onclick="window.print()">
					<?php esc_html_e( 'Print this card', 'palmtreesurf' ); ?>
				</button>
				<a class="button" href="<?php echo esc_url( PT_URI . 'assets/images/qr/leave-a-review.png' ); ?>" download>
					<?php esc_html_e( 'Download the QR as a PNG', 'palmtreesurf' ); ?>
				</a>
				<a class="button" href="<?php echo esc_url( $qr ); ?>" download>
					<?php esc_html_e( 'Download the QR as an SVG', 'palmtreesurf' ); ?>
				</a>
			</p>
			<p class="description">
				<?php esc_html_e( 'The SVG stays sharp at any size — use it for anything a printer is producing. The PNG is easier to drop into a social post.', 'palmtreesurf' ); ?>
			</p>
		<?php endif; ?>

		<h2><?php esc_html_e( 'What happens to a review', 'palmtreesurf' ); ?></h2>
		<p>
			<?php esc_html_e( 'It arrives in Comments, held for approval, and appears on the site only once you approve it — on the Leave a Review page and on the tour the guest picked, where it counts towards that tour\'s star rating.', 'palmtreesurf' ); ?>
		</p>

		<style>
			.pt-review-card {
				display: flex;
				align-items: center;
				gap: 20px;
				max-width: 520px;
				padding: 24px;
				border: 1px solid #c3c4c7;
				border-radius: 10px;
				background: #fff;
			}
			.pt-review-card img { display: block; }
			.pt-review-card__title { margin: 0 0 4px; font-size: 20px; font-weight: 700; }
			.pt-review-card__sub { margin: 0 0 10px; font-size: 14px; }
			.pt-review-card__url { margin: 0; font-size: 12px; color: #50575e; word-break: break-all; }

			/* Printing the admin page gives a sheet of WordPress chrome, so
			   everything except the card is dropped. */
			@media print {
				body * { visibility: hidden !important; }
				#pt-review-card, #pt-review-card * { visibility: visible !important; }
				#pt-review-card {
					position: absolute;
					top: 0;
					left: 0;
					border: 1px dashed #999;
				}
			}
		</style>
	</div>
	<?php
}
