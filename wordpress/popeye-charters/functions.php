<?php
/**
 * Popeye Charters theme bootstrap.
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

define( 'POPEYE_VERSION', '1.1.0' );
define( 'POPEYE_DIR', get_template_directory() );

require POPEYE_DIR . '/inc/helpers.php';
require POPEYE_DIR . '/inc/setup.php';
require POPEYE_DIR . '/inc/customizer.php';
require POPEYE_DIR . '/inc/experiences.php';
require POPEYE_DIR . '/inc/forms.php';
require POPEYE_DIR . '/inc/schema.php';
require POPEYE_DIR . '/inc/importer.php';
