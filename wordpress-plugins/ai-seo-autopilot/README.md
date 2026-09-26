# AI SEO Autopilot for All in One SEO

A WordPress plugin that uses Claude to write the SEO for every page and save it into
All in One SEO (AIOSEO), in one click. It works with AIOSEO Lite and Pro.

What it fills in:

| Item | AIOSEO Lite | AIOSEO Pro |
|---|---|---|
| SEO title and meta description for every post and page | ✓ | ✓ |
| Focus keyphrase | ✓ | ✓ |
| Facebook / X social title and description | ✓ | ✓ |
| Knowledge graph: business name, logo, phone, email, social profiles, homepage title and description | ✓ | ✓ |
| Schema: page type (About, Contact, FAQ…), article type, Service, FAQ, local business type, address and area served | ✓ | ✓ |
| Additional keyphrases | shown as "Needs AIOSEO Pro" | ✓ |
| Category and tag archive SEO | shown as "Needs AIOSEO Pro" | ✓ when AIOSEO Pro exposes term abilities (WordPress 6.9+) |

Pro-only items are skipped on Lite and switch on by themselves after an upgrade.

## Install

1. Download `ai-seo-autopilot.zip` from `wordpress-plugins/dist/`.
2. In WordPress, go to **Plugins → Add New → Upload Plugin**, choose the zip and activate it.
   All in One SEO (Lite or Pro) must be active.
3. Open **SEO Autopilot → Settings** and paste an Anthropic API key from
   [console.anthropic.com](https://console.anthropic.com). Click **Test connection**.
   You can instead put the key in `wp-config.php`, which keeps it out of the database:
   ```php
   define( 'AISA_ANTHROPIC_API_KEY', 'sk-ant-...' );
   ```

## No API key? Let Claude write it in a chat

You don't need Anthropic API credits. **SEO Autopilot → Import / Export** offers two ways
to have Claude write the SEO in a normal Claude chat, on your Claude plan:

1. **Connect.** Create an Application Password under **Users → Profile**, then give Claude
   your site address, your username and that password. Claude reads your pages through
   `/wp-json/aisa/v1/export` and sends the SEO to `/wp-json/aisa/v1/import`. Both endpoints
   need an administrator's credentials. Revoke the password when you're done.
2. **Swap files.** Click **Download site content**, attach the file in your Claude chat, and
   upload the file Claude gives back with **Import SEO file**.

Either way, the SEO arrives as proposals on the Autopilot tab. You review them and click
Apply, with the usual backups and restore. Tick **Apply immediately** to skip the review.

## Use

**SEO Autopilot → Autopilot → Run Autopilot.**

1. It reads your homepage, About and Contact pages and builds a **site profile**: business
   name, type, phone, email, address, social profiles and brand voice. The profile goes
   into AIOSEO's knowledge graph and gives every page the same business context.
2. It writes a title, description, keyphrase, social tags and schema for every published
   post and page.
3. With **Let me review** ticked (the default), you get an editable table with character
   counters. Change anything you like, then click **Apply all proposals**. Untick it and
   everything is saved straight away.

Worth checking by hand before you apply: phone, email and address on the **Site profile**
tab. Claude is told to leave these blank rather than guess, but they matter most.

**Existing SEO.** By default only empty fields are filled, and anything you wrote in AIOSEO
yourself is kept. Values that contain only AIOSEO smart tags (for example
`#post_title #separator_sa #site_title`) count as empty. Values this plugin wrote earlier
can be updated again. To replace everything instead, choose **Replace everything** on the
Settings tab.

**Undo.** Every apply saves a backup of the values it changed. Use **Restore previous** on a
row, **Restore previous AIOSEO settings** on the Site profile tab, or
`wp aisa restore --all --user=admin` from WP-CLI. Up to 5 backups are kept per page.

**Large sites.** The admin page processes 3 pages at a time and must stay open while it
runs. For hundreds of pages, WP-CLI is easier:

```bash
wp aisa run --user=admin            # generate and apply everything
wp aisa run --review --user=admin   # generate only, then review in the admin
wp aisa health --user=admin         # compatibility test + diagnostic report
```

**Token saver (on by default).** The default model is Claude Haiku 4.5, the cheapest and
fastest. With **Token saver** ticked on the Settings tab:

- only the first 6,000 characters of each page are sent (24,000 with it off);
- the site profile reads less of the homepage, About and Contact pages;
- a title or description that comes back too long is shortened in code at a word boundary,
  dropping the brand suffix first, instead of asking Claude a second time;
- in "fill empty fields" mode, pages whose title, description and keyphrase a person already
  wrote are skipped before any request is made;
- one page is processed at a time, which keeps you under API rate limits.

Every page is then exactly one request. For better copy, pick Sonnet 5 or Opus 5 on the
Settings tab, or untick Token saver. If your host cuts off long requests, keep Haiku or use
WP-CLI.

## Staying compatible when AIOSEO updates

The plugin never writes to AIOSEO's database tables directly. It has three ways to write,
tried in this order:

1. **AIOSEO's Abilities API** (AIOSEO 4.9.8+ on WordPress 6.9+). This is AIOSEO's published
   interface for AI tools, with a versioned input schema. The plugin reads that schema at run
   time and only sends fields the installed AIOSEO says it accepts.
2. **AIOSEO's PostSeoService** (AIOSEO 4.9.8+ on older WordPress). This is the same code the
   Abilities API calls, reached directly.
3. **AIOSEO's Post model** (AIOSEO 4.x and later). This is the legacy fallback. It only
   writes to columns the table actually has.

Every write is checked by reading the value back. If a path fails, or reports success
without saving, the next path is tried, and the failing one is recorded.

A **self-test** runs by itself whenever AIOSEO, WordPress or this plugin changes version. It
saves test values on a temporary draft post, reads them back, then deletes the draft. If no
path works, nothing is written and a notice appears in wp-admin.

Tested against real installs: WordPress 7.2 + AIOSEO 5.0.2 (Abilities API),
WordPress 6.8 + AIOSEO 5.0.2 (PostSeoService), and WordPress 6.8 + AIOSEO 4.9.0 and 4.7.2
(Post model). A GitHub Actions job re-runs these tests every week against the newest AIOSEO
code, so a breaking AIOSEO change shows up as a failed check before your sites update.

### If an update does break it

1. Open **SEO Autopilot → Health** and click **Copy report**. The report lists your versions,
   which write paths passed, the exact error, and which AIOSEO classes, methods, abilities
   and table columns exist. It contains no API keys or page content.
2. Paste it to Claude and ask for a fix pack.
3. The fix is a small separate plugin built from
   [`examples/aisa-fix-template.php`](examples/aisa-fix-template.php). It adds a new write
   path through the `aisa_adapters` filter, or points renamed settings to their new place
   through `aisa_site_option_map`. Install it next to this plugin and the Health tab confirms
   it works. You don't need to reinstall the main plugin.

## Schema

The extra schema is merged into AIOSEO's own JSON-LD graph through AIOSEO's
`aioseo_schema_output` filter, so each page has one graph with no duplicates. If a future
AIOSEO stops calling that filter, the plugin prints its Service and FAQ nodes as a separate
JSON-LD block instead, so they don't silently disappear. FAQ schema is only added for
questions that are actually written on the page. Google currently shows FAQ rich results
mainly for government and health sites, but the markup is still valid and useful to other
search and AI engines.

## Hooks

| Filter | Use |
|---|---|
| `aisa_adapters` | Add or reorder write paths (fix packs). |
| `aisa_site_option_map` | Point a site-profile field to a different AIOSEO setting path. |
| `aisa_term_ability_names` | Rename the AIOSEO Pro term abilities, if they change. |
| `aisa_post_text` | Change the page text sent to Claude. |
| `aisa_claude_request_body` | Adjust the API request (model, max tokens…). |
| `aisa_schema_fallback_enabled` | Return false to disable the separate JSON-LD fallback. |

## Development

`tests/run.sh` builds a throwaway WordPress site on SQLite with AIOSEO from GitHub, then runs
the self-test, the end-to-end suite and the front-end schema checks. Claude API calls are
answered by `tests/mock-claude.php`, so no key is needed.

```bash
tests/run.sh                                  # latest WordPress + latest AIOSEO
WP_REF=6.8.9 tests/run.sh                     # WordPress without the Abilities API
WP_REF=6.8.9 AIOSEO_REF=4.9.0 tests/run.sh    # AIOSEO before its service layer existed
```

`./build-zip.sh` writes `../dist/ai-seo-autopilot.zip`. Tests and examples are left out of
the zip.
