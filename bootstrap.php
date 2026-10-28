<?php
// ProSite local preview bootstrap; launched only by local desktop process.
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);
$root = $argv[1]; $base = $argv[2]; $url = $argv[3];
if (!is_dir($root) || !is_file($root.'/wp-load.php')) { fwrite(STDERR,"WordPress core missing\n"); exit(1); }
chdir($root);
define('WP_INSTALLING', true);
require_once $root.'/wp-load.php';
require_once $root.'/wp-admin/includes/upgrade.php';
require_once $root.'/wp-admin/includes/plugin.php';
require_once $root.'/wp-admin/includes/file.php';
if (!is_blog_installed()) {
  wp_install('ProSite Preview', 'prosite', 'preview@example.invalid', true, '', bin2hex(random_bytes(18)));
}
update_option('home', $url); update_option('siteurl', $url);
$plugins = get_plugins();
foreach ($plugins as $key=>$info) {
  if (strpos($key, 'sqlite-database-integration/')===0) continue;
  if (!is_plugin_active($key)) {
    $result=activate_plugin($key);
    if (is_wp_error($result)) { fwrite(STDERR, $result->get_error_message()."\n"); exit(2); }
  }
}
$home=get_page_by_path('home');
if ($home) {update_option('show_on_front','page'); update_option('page_on_front',$home->ID);}
else { $pages=get_pages(['number'=>1,'sort_column'=>'ID']); if ($pages) {update_option('show_on_front','page'); update_option('page_on_front',$pages[0]->ID);} }
echo "READY\n";
