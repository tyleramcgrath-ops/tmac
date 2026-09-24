=== AI SEO Autopilot for All in One SEO ===
Tags: seo, all in one seo, aioseo, schema, ai
Requires at least: 6.0
Tested up to: 7.2
Requires PHP: 7.4
Stable tag: 1.2.0
License: GPLv2 or later

Uses Claude to write SEO titles, meta descriptions, keyphrases, social tags and schema for every page, then saves them into All in One SEO in one click.

== Description ==

* Builds a site profile (business name, type, contact details, social profiles) and fills AIOSEO's knowledge graph.
* Writes a title, meta description, focus keyphrase, and social title/description for every post and page.
* Adds schema to AIOSEO's graph: page type, article type, Service, FAQ, local business type and address.
* Lets you review and edit before saving. Every change is backed up and can be restored.
* Works with AIOSEO Lite and Pro. Pro-only features (additional keyphrases, category/tag SEO) are labelled and switch on when Pro is active.
* A self-test runs after every AIOSEO update. If AIOSEO changes how it stores data, the plugin switches to another working write path, or stops and tells you. It never writes blindly.

Requires an Anthropic API key.

== Installation ==

1. Upload the zip under Plugins → Add New → Upload Plugin and activate it. All in One SEO must be active.
2. Go to SEO Autopilot → Settings and add your Anthropic API key.
3. Go to SEO Autopilot → Autopilot and click Run Autopilot.

== Changelog ==

= 1.2.0 =
* No API key needed: an Import / Export tab and a REST API (Application Password) let Claude write the SEO in a chat and send it back for review and apply.

= 1.1.0 =
* Token saver mode, on by default: sends less page text, shortens long titles in code instead of a second request, skips pages whose SEO you already wrote, and processes one page at a time.
* Claude Haiku 4.5 is now the default model.

= 1.0.0 =
* First release.
