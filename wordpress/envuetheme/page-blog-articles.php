<?php
/**
 * Blog Articles listing — shares the News layout (page-news.php).
 */
$envue_listing = [
    'mode'     => 'blog',
    'path'     => '/blog-articles/',
    'crumb'    => 'Blog Articles',
    'eyebrow'  => 'Fleet Management Articles',
    'h1'       => 'Fleet Management Articles Provide Bright Ideas.',
    'lede'     => 'Practical fleet management insights from the EnVue Telematics team — GPS tracking, AI dash cams, safety, compliance, fuel, maintenance, and the operational decisions fleet managers face every day.',
    'grid_eb'  => 'Latest Articles',
    'grid_h2'  => 'Insights for modern fleet operations.',
    'hero_img' => 'https://envuetelematics.com/wp-content/uploads/2026/07/truck-lorry-sunset-768x576.jpg',
];
require get_template_directory() . '/page-news.php';
