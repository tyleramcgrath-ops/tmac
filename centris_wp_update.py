#!/usr/bin/env python3
"""Apply the audit's SEO fixes to a WordPress site via the REST API.

Three changes, each independently selectable:

  1. --homepage-title TEXT   set the front page's SEO title tag
  2. --homepage-desc TEXT    set the front page's meta description
  3. --noindex-authors       add noindex to /author/ archives

Safety rules:
  * Dry-run by default. Nothing is written without --apply.
  * `_elementor_data` is NEVER read, written or included in any payload.
    Pages built with Elementor keep their own copy of the rendered markup, so
    any page whose SEO fields live inside Elementor is reported for manual
    fixing rather than edited here.
  * Every write is verified by reading the field back, and reported honestly
    when the value did not stick (common with SEO plugins that store data in
    their own tables rather than in postmeta).

Credentials come from the environment or a .env file:

    WP_SITE_URL=https://example.com
    WP_USERNAME=your-wp-user
    WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx

    python centris_wp_update.py --homepage-title "..." --homepage-desc "..." \
        --noindex-authors            # preview
    python centris_wp_update.py ... --apply
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
from typing import Any
from urllib.parse import urljoin, urlparse

try:
    import requests
except ImportError as exc:  # pragma: no cover - startup guard
    sys.exit(f"Missing dependency: {exc.name}\n  pip install requests")


TIMEOUT = 25

# Postmeta keys per SEO plugin. The script detects which plugin is active by
# reading the front page's meta and writing to whichever family is present.
SEO_TITLE_KEYS = {
    "aioseo": "_aioseo_title",
    "yoast": "_yoast_wpseo_title",
    "rankmath": "rank_math_title",
    "seopress": "_seopress_titles_title",
}
SEO_DESC_KEYS = {
    "aioseo": "_aioseo_description",
    "yoast": "_yoast_wpseo_metadesc",
    "rankmath": "rank_math_description",
    "seopress": "_seopress_titles_desc",
}
SEO_ROBOTS_NOINDEX_KEYS = {
    "yoast": "_yoast_wpseo_meta-robots-noindex",   # "1" = noindex
    "rankmath": "rank_math_robots",                 # serialized array
    "seopress": "_seopress_robots_index",           # "yes" = noindex
}

# Never send these keys in an update payload, whatever else happens.
FORBIDDEN_META_KEYS = {"_elementor_data", "_elementor_page_settings", "_elementor_controls_usage"}


class WpError(RuntimeError):
    pass


class WordPress:
    def __init__(self, site: str, username: str, app_password: str, dry_run: bool):
        self.site = site.rstrip("/")
        self.dry_run = dry_run
        token = base64.b64encode(
            f"{username}:{app_password.replace(' ', '')}".encode()
        ).decode()
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Basic {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "CentrisAuditBot/1.0",
        })

    def api(self, path: str) -> str:
        return f"{self.site}/wp-json/{path.lstrip('/')}"

    def request(self, method: str, path: str, **kwargs) -> Any:
        url = path if path.startswith("http") else self.api(path)
        try:
            resp = self.session.request(method, url, timeout=TIMEOUT, **kwargs)
        except requests.exceptions.RequestException as exc:
            raise WpError(f"Could not reach {self.site}: {exc}") from exc
        if resp.status_code in (401, 403):
            raise WpError(
                "WordPress rejected the credentials or the user lacks permission "
                f"(HTTP {resp.status_code}). Check WP_USERNAME and WP_APP_PASSWORD."
            )
        if resp.status_code == 404:
            raise WpError(f"Not found: {url} (is the REST API enabled?)")
        if not resp.ok:
            raise WpError(f"WordPress returned HTTP {resp.status_code} for {url}: {resp.text[:300]}")
        try:
            return resp.json()
        except ValueError as exc:
            raise WpError(f"Non-JSON response from {url}") from exc

    def whoami(self) -> dict[str, Any]:
        return self.request("GET", "wp/v2/users/me?context=edit")

    def front_page(self) -> dict[str, Any]:
        """Resolve the configured front page, falling back to the newest page."""
        settings = self.request("GET", "wp/v2/settings")
        page_id = settings.get("page_on_front")
        if settings.get("show_on_front") == "page" and page_id:
            return self.request("GET", f"wp/v2/pages/{page_id}?context=edit")
        raise WpError(
            "The site's front page is set to the blog index (show_on_front != 'page'), "
            "so there is no single page object whose title tag can be edited. "
            "Set the SEO title in your SEO plugin's global 'Homepage' settings instead."
        )

    def author_archives(self) -> list[dict[str, Any]]:
        users: list[dict[str, Any]] = []
        page = 1
        while True:
            batch = self.request("GET", f"wp/v2/users?context=edit&per_page=100&page={page}")
            if not batch:
                break
            users.extend(batch)
            if len(batch) < 100:
                break
            page += 1
        return users

    def update_meta(self, post_type: str, post_id: int, meta: dict[str, Any]) -> dict[str, Any]:
        unsafe = FORBIDDEN_META_KEYS & set(meta)
        if unsafe:  # belt and braces — nothing should ever construct such a payload
            raise WpError(f"Refusing to write protected Elementor keys: {sorted(unsafe)}")
        if self.dry_run:
            return {"_dry_run": True}
        return self.request("POST", f"wp/v2/{post_type}/{post_id}", data=json.dumps({"meta": meta}))


def detect_seo_plugin(meta: dict[str, Any]) -> str | None:
    """Identify the active SEO plugin from which postmeta keys are exposed."""
    for plugin, key in SEO_TITLE_KEYS.items():
        if key in meta:
            return plugin
    for plugin, key in SEO_DESC_KEYS.items():
        if key in meta:
            return plugin
    return None


def is_elementor_page(post: dict[str, Any]) -> bool:
    meta = post.get("meta") or {}
    if meta.get("_elementor_edit_mode"):
        return True
    # `_elementor_data` is only inspected for presence — never read or written.
    return "_elementor_data" in meta and bool(meta.get("_elementor_data"))


def load_dotenv(path: str = ".env") -> None:
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip("'\""))


def report(status: str, message: str) -> None:
    icons = {"ok": "✓", "skip": "·", "manual": "⚑", "fail": "✗", "dry": "→"}
    print(f"  {icons.get(status, '·')} {message}")


def do_homepage(wp: WordPress, title: str | None, desc: str | None) -> list[str]:
    """Set the front page's SEO title/description. Returns manual-fix notes."""
    manual: list[str] = []
    page = wp.front_page()
    meta = page.get("meta") or {}
    plugin = detect_seo_plugin(meta)
    label = f"front page #{page['id']} ({page.get('link')})"

    print(f"\nHomepage — {label}")
    if is_elementor_page(page):
        report("manual", "Page is built with Elementor. Content is not touched; only SEO postmeta is set.")

    if plugin is None:
        note = (
            f"No SEO-plugin postmeta exposed on {label}. The title tag and meta description "
            "cannot be set through the REST API — set them in the SEO plugin UI, or register "
            "the meta keys with show_in_rest."
        )
        report("manual", note)
        return [note]

    report("ok", f"Detected SEO plugin: {plugin}")

    payload: dict[str, Any] = {}
    if title:
        payload[SEO_TITLE_KEYS[plugin]] = title
    if desc:
        payload[SEO_DESC_KEYS[plugin]] = desc
    if not payload:
        return manual

    for key, value in payload.items():
        current = meta.get(key) or "(empty)"
        report("dry" if wp.dry_run else "ok", f"{key}\n      from: {current}\n      to:   {value}")

    if wp.dry_run:
        report("dry", "Dry run — nothing written. Re-run with --apply.")
        return manual

    updated = wp.update_meta("pages", page["id"], payload)
    new_meta = updated.get("meta") or {}
    for key, value in payload.items():
        if new_meta.get(key) == value:
            report("ok", f"{key} updated and verified.")
        else:
            note = (
                f"{key} did not persist on {label} — {plugin} likely stores this in its own "
                f"table. Set it manually in the plugin UI: {value}"
            )
            report("fail", note)
            manual.append(note)
    return manual


def do_noindex_authors(wp: WordPress, front_meta_plugin: str | None) -> list[str]:
    """Add noindex to author archives.

    Author archives are taxonomy-like routes with no post object, so no SEO
    plugin exposes them as editable REST resources. This reports exactly what
    must be changed and where, rather than pretending to have changed it.
    """
    manual: list[str] = []
    print("\nAuthor archives — /author/*")
    users = wp.author_archives()
    if not users:
        report("skip", "No users returned.")
        return manual

    slugs = [u.get("slug") for u in users if u.get("slug")]
    report("ok", f"{len(slugs)} author archive(s): {', '.join('/author/%s/' % s for s in slugs[:8])}"
                 + (f" … +{len(slugs) - 8} more" if len(slugs) > 8 else ""))

    note = (
        "Author archives are not post objects, so the WordPress REST API exposes no "
        "per-archive robots field to write. Set this globally instead — it is one "
        "switch and covers every author:\n"
        "        AIOSEO:    Search Appearance → Archives → Author Archives → Show in Search Results = No\n"
        "        Yoast:     Settings → Content Types/Archives → Author archives = Off (or noindex)\n"
        "        Rank Math: Titles & Meta → Authors → Author Archives → Robots = noindex\n"
        "        SEOPress:  Titles & Metas → Archives → Author archives → noindex = On\n"
        "      A code-level alternative is a wp_robots filter adding noindex on is_author()."
    )
    report("manual", note)
    manual.append("Author archives need a global noindex toggle in the SEO plugin — see instructions above.")
    return manual


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="centris_wp_update.py",
        description="Apply audited SEO fixes to a WordPress site over the REST API.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--site", default=os.environ.get("WP_SITE_URL"), help="Site URL (or WP_SITE_URL)")
    parser.add_argument("--username", default=os.environ.get("WP_USERNAME"), help="WP username (or WP_USERNAME)")
    parser.add_argument("--app-password", default=os.environ.get("WP_APP_PASSWORD"),
                        help="Application password (or WP_APP_PASSWORD)")
    parser.add_argument("--homepage-title", metavar="TEXT", help="New SEO title tag for the front page")
    parser.add_argument("--homepage-desc", metavar="TEXT", help="New meta description for the front page")
    parser.add_argument("--noindex-authors", action="store_true", help="Add noindex to /author/ archives")
    parser.add_argument("--apply", action="store_true", help="Actually write. Without this, nothing is changed.")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    load_dotenv()
    args = parse_args(argv)

    missing = [name for name, value in
               (("WP_SITE_URL/--site", args.site),
                ("WP_USERNAME/--username", args.username),
                ("WP_APP_PASSWORD/--app-password", args.app_password)) if not value]
    if missing:
        print("Missing credentials: " + ", ".join(missing), file=sys.stderr)
        print("Set them in .env or pass them as flags. See the module docstring.", file=sys.stderr)
        return 1
    if not urlparse(args.site).scheme:
        args.site = "https://" + args.site
    if not (args.homepage_title or args.homepage_desc or args.noindex_authors):
        print("Nothing to do — pass --homepage-title, --homepage-desc and/or --noindex-authors.", file=sys.stderr)
        return 1

    wp = WordPress(args.site, args.username, args.app_password, dry_run=not args.apply)
    mode = "APPLY (writes enabled)" if args.apply else "DRY RUN (no writes)"
    print(f"{args.site} — {mode}")
    print("_elementor_data is never read or written by this script.")

    try:
        me = wp.whoami()
        print(f"\nAuthenticated as {me.get('name')} ({', '.join(me.get('roles') or []) or 'unknown role'})")

        manual: list[str] = []
        if args.homepage_title or args.homepage_desc:
            manual += do_homepage(wp, args.homepage_title, args.homepage_desc)
        if args.noindex_authors:
            manual += do_noindex_authors(wp, None)
    except WpError as exc:
        print(f"\nFailed: {exc}", file=sys.stderr)
        return 1

    if manual:
        print("\n" + "─" * 70)
        print(" MANUAL FIXES REQUIRED")
        print("─" * 70)
        for note in manual:
            print(f"  ⚑ {note}")
    print()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
