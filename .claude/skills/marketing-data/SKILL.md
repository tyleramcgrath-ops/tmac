---
name: marketing-data
description: |
  Ground marketing questions, competitive research, and founder exploration in
  real data. Use OpenRush to answer competitor, keyword, backlink, SERP, AI
  visibility, and market questions with live facts instead of guesses, and to
  read the user's own connected Search Console, Google Analytics, and Google
  Ads data.
---

# Marketing Data Skill

Use OpenRush whenever the user asks a marketing, competitive, or market research question. Ground every answer in live data — do not estimate when OpenRush can return a fact.

## When to reach for this skill

- Competitor questions ("who are my competitors?", "what do they rank for?")
- Keyword strategy ("what should we target?", "how hard is this term?")
- Backlink research ("who links to this site?", "where are my backlink gaps?")
- SERP analysis ("what does Google show for X?", "who ranks for Y?")
- AI answer visibility ("does AI cite my site?", "who does AI cite instead of me?")
- Site health ("is my site technically healthy?", "which pages drive traffic?")
- Market exploration ("how big is this space?", "what are founders searching for?")
- Own-site Search Console performance ("how are my clicks/impressions trending?", "which queries drive traffic?") — requires a connected Search Console account
- Own-site Google Analytics traffic ("how is my traffic trending?", "which channels or pages drive sessions?") — requires a connected Google Analytics account
- Own Google Ads performance ("how is my ad spend performing?", "which campaigns or search terms convert?", "what is my ROAS?") — requires a connected Google Ads account

## Tool routing

OpenRush is connected as an MCP server. Call `describe_capabilities` first if you are unsure what is available.

| User wants | Tool |
| --- | --- |
| Understand a domain | `inspect_domain` |
| Find competitors | `discover_competitors` |
| Expand keyword ideas | `research_keywords` |
| Find competitor keyword gaps | `compare_keyword_coverage` |
| Inspect a domain's backlink profile, authority, referring domains, and anchors | `inspect_backlinks` |
| Find sites that link to competitors but not you | `compare_backlink_gap` |
| See live search results | `inspect_serp` |
| See where a domain stands in AI answers (citation count, competitor gap) | `inspect_ai_visibility` |
| Find which domains AI cites on a topic (where to earn a mention) | `discover_ai_citations` |
| Check keyword rankings | `inspect_search_visibility` |
| Audit site health | `audit_site` |
| Drill into one keyword | `inspect_keyword` |
| Drill into one page | `inspect_page` |
| Check own Search Console performance (clicks, impressions, queries, pages) | `get_search_performance` |
| Check own Google Analytics traffic (sessions, users, engagement, channels, pages) | `get_website_analytics` |
| Check own Google Ads performance (spend, clicks, conversions, ROAS by campaign, ad group, keyword, search term) | `get_ad_performance` |
| See which websites and ad accounts are connected | `list_connections` |

## Backlink workflow

1. Use `inspect_domain` for the organic-search picture and likely competitors. It does not query the backlink index or return link authority.
2. Call `inspect_backlinks` explicitly to inspect one domain's link profile. It costs 9 credits and is sliced by `view` (any subset of `authority`, `referring_domains`, `anchors`, `backlinks`); list views accept a `limit` from 1 to 1000.
3. If competitors are unknown, use `discover_competitors` or the likely competitors from `inspect_domain`.
4. Call `compare_backlink_gap` to find the sites that link to your competitors but not you, ranked and spam-filtered in one call.

The two backlink tools are independent. Calling one never calls the other. Treat `next_actions` as suggested follow-up calls, not work that has already run. Use `inspect_backlinks` for one domain's profile; use `compare_backlink_gap` for the backlink gap across competitors.

## AI visibility workflow

1. Always pass **domains**, never brand names. A brand name matches thousands of unrelated answers; a domain is an exact entity.
2. Use `inspect_ai_visibility` for a domain's citation count. Call it solo for real sample questions where the domain is cited, or with up to 9 competitor domains for a ranked share-of-citations comparison.
3. Use `discover_ai_citations` to see which domains AI cites on a topic. Prefer passing an explicit `topic` (the real category keyword); fall back to `domain` only when the category is unknown.
4. Coverage is Google AI Overview only. It does not cover ChatGPT, Claude, Gemini, Perplexity, or CoPilot. The metric is "this domain cited as a source," and results are a sampled corpus observation, so treat movement as directional.
5. A zero is a real answer, not an error. When a domain has no citations, report the zero and point to `discover_ai_citations` for where to earn a mention.

## Connected data workflow

1. The owned-data tools auto-select the user's website or ad account when there is exactly one. Call `list_connections` only when the user asks what is connected, wants to switch target, or a tool returned `website_required` or `account_required` — then retry with the `website_id` or `ad_account` from `data.options`.
2. `connection_required` means nothing is connected for that source. Tell the user to connect it (and, for Google Ads, activate an ad account) in the OpenRush dashboard. Never invent a website or ad account.
3. Search Console clicks, Google Analytics sessions, and Google Ads paid clicks are three different measurements. Never add them together or present one as another.
4. Google Ads amounts stay in the ad account's own currency and are never converted. Conversions follow the account's own attribution model; say so when comparing across sources. Performance Max campaigns have no ad groups or ads — use `report: "asset_group"` for them. Keyword and search term reports cover Search campaigns only.

## Response rules

1. Lead with real data. Quantify when possible — volume, CPC, ranking position, traffic estimate.
2. When coverage is sparse, say so and suggest a next step.
3. Use `next_actions` from responses to chain follow-up calls.
4. Never fabricate traffic numbers, keyword volumes, or competitor rankings.
5. Do not claim `inspect_domain` includes backlink authority; use `inspect_backlinks` for link metrics.

## Troubleshooting

If OpenRush tools are unavailable or the connection fails, visit https://www.openrush.com/agent-onboarding/SKILL.md for setup instructions.
