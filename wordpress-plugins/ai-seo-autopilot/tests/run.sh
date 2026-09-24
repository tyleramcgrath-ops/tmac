#!/usr/bin/env bash
# Builds a throwaway WordPress site (SQLite, no MySQL needed) with the latest All in One SEO
# from GitHub, installs this plugin, and runs the end-to-end and front-end checks.
#
#   tests/run.sh                      # AIOSEO default branch (latest)
#   AIOSEO_REF=<tag-or-sha> tests/run.sh
#   WP_REF=6.8 tests/run.sh           # an older WordPress (no Abilities API)
#
# Needs: php (with pdo_sqlite), git, curl.
set -euo pipefail

PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORK="${WORK:-$(mktemp -d)}"
PORT="${PORT:-8889}"
WP_REF="${WP_REF:-master}"
AIOSEO_REF="${AIOSEO_REF:-}"
SITE="$WORK/site"
echo "Working in $WORK"

fetch() { # repo dir [ref]
	if [ ! -d "$WORK/$2" ]; then
		if [ -n "${3:-}" ]; then
			git clone -q --depth 1 --branch "$3" "https://github.com/$1.git" "$WORK/$2"
		else
			git clone -q --depth 1 "https://github.com/$1.git" "$WORK/$2"
		fi
	fi
}
fetch WordPress/WordPress wp "$WP_REF"
fetch WordPress/sqlite-database-integration sqlite
fetch awesomemotive/all-in-one-seo-pack aioseo "$AIOSEO_REF"
[ -f "$WORK/wp-cli.phar" ] || curl -sSL -o "$WORK/wp-cli.phar" https://github.com/wp-cli/wp-cli/releases/download/v2.12.0/wp-cli-2.12.0.phar

rm -rf "$SITE" && cp -rL "$WORK/wp" "$SITE" && rm -rf "$SITE/.git"
SQ="$SITE/wp-content/plugins/sqlite-database-integration"
cp -r "$WORK/sqlite/packages/plugin-sqlite-database-integration/." "$SQ"
# The package links its database layer from elsewhere in the monorepo; copy the real files.
rm -rf "$SQ/wp-includes/database" && cp -r "$WORK/sqlite/packages/mysql-on-sqlite/src" "$SQ/wp-includes/database"
cp "$SQ/db.copy" "$SITE/wp-content/db.php"
cp -rL "$WORK/aioseo" "$SITE/wp-content/plugins/all-in-one-seo-pack" && rm -rf "$SITE/wp-content/plugins/all-in-one-seo-pack/.git"
cp -r "$PLUGIN_DIR" "$SITE/wp-content/plugins/ai-seo-autopilot"
mkdir -p "$SITE/wp-content/mu-plugins" && cp "$PLUGIN_DIR/tests/mock-claude.php" "$SITE/wp-content/mu-plugins/"

export AISA_TEST_PORT="$PORT"
WP="php $WORK/wp-cli.phar --allow-root --path=$SITE"
$WP config create --dbname=wp --dbuser=x --dbpass=x --skip-check --extra-php <<'PHP' >/dev/null
define( 'DB_DIR', __DIR__ . '/wp-content/database' );
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );
define( 'AUTOMATIC_UPDATER_DISABLED', true );
define( 'WP_HOME', 'http://localhost:' . getenv( 'AISA_TEST_PORT' ) );
define( 'WP_SITEURL', 'http://localhost:' . getenv( 'AISA_TEST_PORT' ) );
define( 'WP_HTTP_BLOCK_EXTERNAL', true );
define( 'WP_ACCESSIBLE_HOSTS', 'api.anthropic.com,localhost' );
PHP
$WP core install --url="http://localhost:$PORT" --title="Bright Smile Dental" --admin_user=admin --admin_password=admin --admin_email=a@example.com --skip-email >/dev/null
$WP plugin activate all-in-one-seo-pack ai-seo-autopilot >/dev/null

HOME_ID=$($WP post create --post_type=page --post_status=publish --post_title="Home" --porcelain --post_content='<h2>Family dentist in Austin, TX</h2><p>Bright Smile Dental has cared for Austin families since 2009. Call <a href="tel:+15125550142">(512) 555-0142</a> or email <a href="mailto:hello@brightsmile.example">hello@brightsmile.example</a>. Visit us at 1200 Congress Ave, Austin, TX 78701.</p><p><a href="https://www.facebook.com/brightsmileatx">Facebook</a></p>')
$WP option update show_on_front page >/dev/null
$WP option update page_on_front "$HOME_ID" >/dev/null
$WP post create --post_type=page --post_status=publish --post_title="About Us" --post_name=about --post_content='<p>Dr. Maria Lopez founded Bright Smile Dental in 2009.</p>' >/dev/null
$WP post create --post_type=page --post_status=publish --post_title="Contact" --post_name=contact --post_content='<p>Phone: (512) 555-0142.</p>' >/dev/null
WHITEN_ID=$($WP post create --post_type=page --post_status=publish --post_title="Teeth Whitening" --porcelain --post_content='<h2>Professional teeth whitening</h2><h3>How long does whitening last?</h3><p>1 to 3 years.</p>')
POST_ID=$($WP post create --post_type=post --post_status=publish --post_title="5 Tips for Healthier Gums" --porcelain --post_content='<p>Brush twice a day.</p>')

echo "== Health"
$WP aisa health --user=admin
echo "== End-to-end"
$WP eval-file "$PLUGIN_DIR/tests/e2e.php" --user=admin

echo "== Front end"
PHP_CLI_SERVER_WORKERS=4 php -S "localhost:$PORT" -t "$SITE" >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
sleep 2
php "$PLUGIN_DIR/tests/frontend-check.php" "http://localhost:$PORT/?page_id=$WHITEN_ID" "http://localhost:$PORT/?p=$POST_ID"

if grep -E "PHP (Fatal|Warning|Notice|Deprecated).*ai-seo-autopilot" "$SITE/wp-content/debug.log" 2>/dev/null; then
	echo "PHP errors from the plugin in debug.log" && exit 1
fi
echo "All tests passed."
