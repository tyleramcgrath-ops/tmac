<?php
/**
 * Product in mixed search results.
 *
 * @package drip-current
 */

defined( 'ABSPATH' ) || exit;

$drip_product = function_exists( 'wc_get_product' ) ? wc_get_product( get_the_ID() ) : null;
if ( $drip_product ) {
	drip_current_product_card( $drip_product );
} else {
	get_template_part( 'template-parts/card' );
}
