<?php
/**
 * We Have Rehabs theme bootstrap.
 *
 * @package WeHaveRehabs
 */

defined( 'ABSPATH' ) || exit;

define( 'WHR_VERSION', '1.2.0' );
define( 'WHR_DIR', get_template_directory() );
define( 'WHR_URI', get_template_directory_uri() );

require WHR_DIR . '/inc/setup.php';
require WHR_DIR . '/inc/post-types.php';
require WHR_DIR . '/inc/meta-fields.php';
require WHR_DIR . '/inc/template-tags.php';
require WHR_DIR . '/inc/search.php';
require WHR_DIR . '/inc/forms.php';
require WHR_DIR . '/inc/customizer.php';
require WHR_DIR . '/inc/demo-content.php';
require WHR_DIR . '/inc/importer.php';
require WHR_DIR . '/inc/plans.php';
