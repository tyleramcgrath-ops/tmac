---
{
  "title": "AI Crawlers and robots.txt: How to Control GPTBot, ClaudeBot, PerplexityBot and Google-Extended",
  "metaTitle": "AI Crawlers and robots.txt: GPTBot, ClaudeBot and More",
  "description": "A precise guide to AI crawlers and robots.txt: what GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot and Google-Extended control, with copy-paste rules.",
  "category": "Technical SEO",
  "keywords": ["AI crawlers robots.txt", "block GPTBot", "ClaudeBot robots.txt", "Google-Extended", "PerplexityBot", "OAI-SearchBot", "block AI crawlers"],
  "excerpt": "Blocking AI crawlers is not one decision. Training bots, search bots and user-triggered fetchers do different jobs, and robots.txt treats them separately. Here is how to choose, with rules you can copy.",
  "imageAlt": "Beams of light from several crawler sources hitting a website, with some beams passing through a filter and others stopped.",
  "imageMotif": "beam",
  "keyTakeaways": [
    "AI crawlers fall into three groups that robots.txt controls separately: training crawlers like GPTBot and ClaudeBot, search crawlers like OAI-SearchBot, Claude-SearchBot and PerplexityBot, and user-triggered fetchers like ChatGPT-User, Claude-User and Perplexity-User.",
    "Blocking a training crawler such as GPTBot tells that provider not to use your content for model training, but it does not by itself remove you from that provider's AI search results.",
    "Google-Extended is a robots.txt product token that controls whether content Google crawls is used for Gemini model training and grounding; it does not affect Google Search, AI Overviews or AI Mode.",
    "To limit how your content appears in Google AI Overviews, you use the same controls as Search, such as nosnippet, data-nosnippet, max-snippet or noindex, not Google-Extended.",
    "robots.txt is a voluntary standard, so verify what bots actually do in your server logs and use firewall rules when you need enforcement."
  ],
  "faqs": [
    { "q": "Should I block GPTBot?", "a": "Block GPTBot only if you do not want OpenAI to use your content for training its models. GPTBot is OpenAI's training crawler; blocking it does not remove you from ChatGPT search results, which rely on OAI-SearchBot. Many businesses that want AI visibility allow OAI-SearchBot and make a separate, deliberate choice about GPTBot based on how they view training use of their content." },
    { "q": "Does blocking Google-Extended remove my site from AI Overviews?", "a": "No. Google says Google-Extended does not affect inclusion in Google Search and is not a ranking signal. AI Overviews and AI Mode are part of Google Search and use content crawled by Googlebot. Google-Extended controls whether your content is used to train Gemini models and for grounding in some Gemini products. To limit AI Overview snippets, use nosnippet or related controls." },
    { "q": "What is the difference between ClaudeBot, Claude-SearchBot and Claude-User?", "a": "Anthropic documents three agents. ClaudeBot collects public web content that may be used to train Anthropic's models. Claude-SearchBot crawls to improve the quality of search results within Claude. Claude-User fetches pages when a Claude user asks a question that needs web content. Each can be allowed or disallowed separately in robots.txt using its own user-agent group." },
    { "q": "Do AI crawlers actually obey robots.txt?", "a": "Major providers including OpenAI, Anthropic, Google and Perplexity publicly state that their crawlers respect robots.txt, with caveats for some user-initiated fetchers. robots.txt is still a voluntary protocol, not a lock. Some bots ignore it or misidentify themselves. Check your server logs, verify bots against the IP ranges or verification methods providers publish, and use firewall rules when you need enforcement." },
    { "q": "How do I block all AI crawlers but keep Google Search?", "a": "Add separate robots.txt groups that disallow each AI agent you want to block, such as GPTBot, OAI-SearchBot, ClaudeBot, Claude-SearchBot, PerplexityBot, CCBot, Applebot-Extended and Google-Extended, while leaving Googlebot allowed. Be aware this also removes you from AI search features like ChatGPT search and Perplexity, and it does not opt you out of Google AI Overviews." },
    { "q": "How long does it take for robots.txt changes to take effect?", "a": "Crawlers re-read robots.txt periodically rather than instantly. Google generally caches robots.txt for up to about a day, and other providers note that changes can take some time to be reflected in their systems. Content already collected for training is not removed retroactively by a new rule; robots.txt only governs future crawling." }
  ]
}
---

AI crawlers are automated bots that AI companies use to fetch web pages, and robots.txt is how you tell each one what it may access. The key point is that AI crawlers are not one thing: training crawlers, AI search crawlers and user-triggered fetchers do different jobs, and blocking one does not block the others. Get this wrong and you can disappear from AI answers while thinking you only opted out of training.

I see this mistake in audits constantly. A site adds a blanket "block AI" snippet copied from a forum, and months later wonders why it never shows up as a source in ChatGPT search or Perplexity. Or the opposite: a publisher blocks Google-Extended expecting to stay out of AI Overviews, and nothing changes. This guide explains what each major AI user agent actually controls, according to what the providers publicly document, then gives you copy-paste robots.txt configurations for the most common business decisions.

## What AI crawlers are and why they are not all the same

An **AI crawler** is any automated agent operated by an AI company that requests pages from your site. The providers that document their bots, including OpenAI, Anthropic, Google, Perplexity and Apple, separate them by purpose. In practice, they fall into three groups.

1. **Training crawlers** collect public content that may be used to train foundation models. Examples: GPTBot, ClaudeBot, CCBot.
2. **AI search crawlers** index content so an AI product can surface and cite it in answers. Examples: OAI-SearchBot, Claude-SearchBot, PerplexityBot.
3. **User-triggered fetchers** retrieve a specific page because a person asked the assistant to look something up or open a link. Examples: ChatGPT-User, Claude-User, Perplexity-User.

There is also a fourth category that is not a crawler at all: **product tokens** such as Google-Extended and Applebot-Extended. These do not fetch pages. They are names you use in robots.txt to control how content collected by an existing crawler may be used.

The business question for each group is different. Training is about whether you want your content to shape future models. Search is about whether you want to be cited and linked in AI answers today. User-triggered fetching is about whether an assistant can read your page when a real person explicitly asks for it.

## The major AI user agents and what each one controls

The table below summarizes the AI user agents that major providers publicly document, as of late 2026. Providers update these pages, so confirm details against their official documentation, such as [OpenAI's crawler overview](https://platform.openai.com/docs/bots), before you ship changes.

| User agent | Operator | Purpose (per provider documentation) | Effect of disallowing |
|---|---|---|---|
| GPTBot | OpenAI | Crawls content that may be used to train OpenAI's generative models | Signals content should not be used for training |
| OAI-SearchBot | OpenAI | Surfaces and links websites in ChatGPT search features | Site may not appear in ChatGPT search answers |
| ChatGPT-User | OpenAI | Fetches pages for user actions in ChatGPT and custom GPTs | OpenAI notes robots.txt may not apply to user-initiated requests |
| ClaudeBot | Anthropic | Collects public web content that may be used for model training | Signals content should not be used for training |
| Claude-SearchBot | Anthropic | Crawls to improve search result quality in Claude | Content may be less visible in Claude's search results |
| Claude-User | Anthropic | Fetches pages when a Claude user's question needs them | Claude may not retrieve your pages for users |
| PerplexityBot | Perplexity | Surfaces and links websites in Perplexity search results; Perplexity says it is not used to train foundation models | Site may not appear in Perplexity answers |
| Perplexity-User | Perplexity | Fetches pages for user actions in Perplexity | Perplexity says these user-initiated requests generally do not follow robots.txt |
| Google-Extended | Google (product token) | Controls use of Google-crawled content for Gemini model training and grounding | No effect on Google Search, AI Overviews or AI Mode |
| Applebot-Extended | Apple (product token) | Controls use of Applebot-crawled content for training Apple's foundation models | Content not used for that training; Applebot search use unaffected |
| CCBot | Common Crawl | Builds the open Common Crawl dataset, which is widely used in AI research and training | Excluded from future Common Crawl snapshots |

A few clarifications that matter in practice:

- **OpenAI's agents are independent.** OpenAI documents that each setting is separate, so you can allow OAI-SearchBot for search visibility while disallowing GPTBot for training.
- **Anthropic's agents are independent too.** Anthropic documents ClaudeBot, Claude-SearchBot and Claude-User as separate agents that each respect their own robots.txt group. You may still see older names like `anthropic-ai` or `Claude-Web` in robots.txt templates; including them is harmless, but the three current agents are what Anthropic documents.
- **Google has no separate "AI Overviews bot."** Googlebot crawls for Search, and AI Overviews and AI Mode are Search features.
- **Other operators exist.** Meta, Amazon, ByteDance and others run crawlers with their own names and policies. Check each provider's documentation rather than relying on third-party lists, which frequently contain outdated or invented agent names.

## How Google-Extended really works

Google-Extended is a robots.txt product token, not a crawler, that lets you control whether content Google has crawled is used to train future Gemini models and to ground answers in certain Gemini products. Google crawls with its normal user agents; Google-Extended only governs how that content may be used.

Google's documentation is explicit that Google-Extended does not affect a site's inclusion in Google Search and is not used as a ranking signal. That means blocking Google-Extended does not remove your pages from AI Overviews or AI Mode, because those features are part of Search and draw on Search's index. Google's guidance on [AI features in Search](https://developers.google.com/search/docs/appearance/ai-features) says the controls for AI Overviews are the same controls you use for Search snippets.

If you want to limit how your content appears in Google's AI features, these are the documented options:

```html
<!-- Prevent any text snippet from this page, including in AI Overviews -->
<meta name="robots" content="nosnippet">

<!-- Limit snippet length to 50 characters -->
<meta name="robots" content="max-snippet:50">

<!-- Exclude a specific section of the page from snippets -->
<div data-nosnippet>Pricing details for logged-in customers only.</div>

<!-- Remove the page from Google Search entirely -->
<meta name="robots" content="noindex">
```

Each of these has a cost. `nosnippet` limits regular search snippets too, which usually hurts click-through. `noindex` removes the page from Search entirely. For most businesses that want visibility, the right move is to stay eligible and focus on being the best source, which I cover in [How to Show Up in Google AI Overviews and AI Mode](/blog/google-ai-overviews-optimization).

## How robots.txt rules are actually interpreted

robots.txt rules are interpreted per user-agent group, and a crawler follows only the single most specific group that matches its name. That one rule explains most of the mistakes I find. The protocol is standardized as RFC 9309, and the major providers follow its core behavior.

- **A named group replaces the wildcard group.** If you have a `User-agent: GPTBot` group, GPTBot follows that group and ignores everything under `User-agent: *`. Rules do not merge.
- **Matching is case-insensitive on the user-agent name.** `gptbot` and `GPTBot` match the same group.
- **The longest matching path wins.** If `Disallow: /blog/` and `Allow: /blog/public/` both match, the more specific `Allow` applies to `/blog/public/` URLs.
- **An empty Disallow allows everything.** `Disallow:` with no path means nothing is blocked for that group.
- **Wildcards are supported by major crawlers.** `*` matches any sequence of characters and `$` anchors the end of a URL.
- **Crawl-delay is not universal.** Google ignores it. Some other crawlers honor it.
- **The file must live at the root.** robots.txt only applies to the exact host and protocol where it is served, so `blog.example.com` needs its own file.

Here is the classic trap. A site wants GPTBot blocked from a private directory and writes:

```text
User-agent: *
Disallow: /admin/
Disallow: /checkout/

User-agent: GPTBot
Disallow: /members/
```

Because GPTBot has its own group, it now ignores the `*` rules and is allowed into `/admin/` and `/checkout/`. If you want named bots to inherit general rules, repeat those rules inside each named group.

## Copy-paste robots.txt configurations for common goals

The right robots.txt configuration depends on one decision: whether you want to be cited in AI answers, used for model training, both or neither. These four configurations cover the most common positions. Adjust paths to your site and keep any existing rules you already rely on.

### Option 1: Allow AI search, opt out of training

This is the most common choice for businesses that want visibility in ChatGPT search, Claude and Perplexity but prefer that their content not be used for model training.

```text
# AI search and user-triggered fetchers: allowed
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: PerplexityBot
User-agent: Perplexity-User
Disallow: /admin/
Disallow: /checkout/

# Training crawlers and tokens: blocked
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: CCBot
User-agent: Google-Extended
User-agent: Applebot-Extended
Disallow: /

# Everyone else, including Googlebot and Bingbot
User-agent: *
Disallow: /admin/
Disallow: /checkout/

Sitemap: https://www.example.com/sitemap.xml
```

Stacking several `User-agent` lines above one set of rules is valid and applies those rules to each listed agent.

### Option 2: Allow everything

If you want maximum reach in both AI answers and training data, you do not need AI-specific rules at all. A standard file works:

```text
User-agent: *
Disallow: /admin/
Disallow: /checkout/

Sitemap: https://www.example.com/sitemap.xml
```

### Option 3: Block AI crawlers but keep traditional search

Some publishers choose to keep Googlebot and Bingbot while blocking AI agents. Understand the trade-off: this removes you from AI search features like ChatGPT search and Perplexity, and it still does not opt you out of Google AI Overviews.

```text
User-agent: GPTBot
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: ClaudeBot
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: PerplexityBot
User-agent: Perplexity-User
User-agent: CCBot
User-agent: Google-Extended
User-agent: Applebot-Extended
Disallow: /

User-agent: *
Disallow: /admin/

Sitemap: https://www.example.com/sitemap.xml
```

As noted in the table, some user-triggered fetchers may not apply robots.txt to requests a person explicitly makes. If you need a hard block, use server or firewall rules.

### Option 4: Protect premium content, allow the rest

If you sell gated or premium content, you can block AI agents from those sections while keeping marketing pages fully available.

```text
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: CCBot
User-agent: Google-Extended
Disallow: /members/
Disallow: /courses/
Disallow: /admin/

User-agent: *
Disallow: /admin/
```

Remember that content behind a login should be protected by authentication, not robots.txt. robots.txt is publicly readable, so it also advertises the paths you list.

## How to decide what to allow

Deciding what to allow comes down to weighing visibility against control, and the answer is usually different for search and training. Here is the framework I walk clients through.

1. **Do you want to be cited and linked in AI answers?** If yes, allow the AI search crawlers: OAI-SearchBot, Claude-SearchBot and PerplexityBot. Blocking them works against everything in [How to Get Your Brand Cited by ChatGPT](/blog/how-to-get-cited-by-chatgpt) and [Perplexity SEO](/blog/perplexity-seo-guide).
2. **Do you want assistants to read your page when a user asks?** If yes, allow ChatGPT-User, Claude-User and Perplexity-User. Blocking them can mean an assistant says it could not access your page while a competitor's page loads fine.
3. **Are you comfortable with training use?** This is a values and business-model question. Publishers whose product is the content often block training crawlers. Service businesses that benefit from being widely known often allow them. Neither choice is documented to affect AI search citations directly.
4. **Is any content sensitive or licensed?** Protect it with authentication first, then robots.txt as a secondary signal.
5. **Do you have legal or contractual obligations?** Syndicated, licensed or user-generated content may come with rules you must respect regardless of marketing goals.

Write the decision down, with the date and the reasoning, so the next person who edits robots.txt understands why each line exists.

## How to verify crawler behavior in your logs

Verifying crawler behavior means checking your server or CDN logs to see which bots actually request your pages, how often and whether they respect your rules. robots.txt is a voluntary protocol, so the only way to know what is happening is to look.

1. **Export raw access logs** from your server, host or CDN for at least a few weeks.
2. **Filter by user-agent string** for the agents in the table above. Each provider's documentation lists the full string its bot sends.
3. **Verify identity.** User-agent strings can be faked. OpenAI publishes IP address ranges for its bots, Google supports reverse DNS verification for its crawlers, and other providers publish their own verification methods. Treat unverified "GPTBot" traffic from unexpected IPs as suspect.
4. **Check compliance.** Confirm that blocked agents stop requesting disallowed paths after the rule has had time to propagate.
5. **Check status codes.** Make sure AI search bots you want are receiving 200 responses, not 403 errors from an overzealous bot-protection setting.
6. **Enforce when needed.** If a bot ignores robots.txt, block it at the firewall or CDN level by verified IP or user-agent.

That fifth step catches more problems than you would expect. Security tools and CDN bot-management features sometimes block AI crawlers by default, which silently overrides a robots.txt file that allows them. Log analysis also feeds directly into measuring AI referral traffic, which I cover in [How to Measure AI Search Visibility and LLM Traffic](/blog/measuring-ai-search-visibility).

## Common mistakes with AI crawlers and robots.txt

The most common mistakes come from treating all AI bots as one bot or trusting copied snippets without checking them.

- **Blocking OAI-SearchBot or PerplexityBot by accident** while trying to block training, then losing AI search visibility.
- **Expecting Google-Extended to control AI Overviews.** It does not; Search controls do.
- **Breaking wildcard inheritance** by adding a named group without repeating the general rules.
- **Using invented user-agent names** from unofficial lists. A rule for a bot that does not exist does nothing.
- **Relying on robots.txt for private content.** It is a public file and a voluntary protocol, not access control.
- **Forgetting subdomains.** Each host needs its own robots.txt.
- **Letting a CDN override your intent** by challenging or blocking bots you have explicitly allowed.
- **Assuming retroactive removal.** A new Disallow rule governs future crawling; it does not delete content already collected.

## How to start this week

You can get your AI crawler setup right in a few hours this week by auditing what you have, deciding deliberately and verifying the result.

1. Open your live robots.txt and list every AI-related user agent it mentions, plus any named groups that may be breaking wildcard inheritance.
2. Make the search-versus-training decision using the framework above and get sign-off from whoever owns content licensing.
3. Rewrite robots.txt from the matching configuration, test it with a robots.txt parser, and deploy it.
4. Check your CDN and security settings to confirm they do not block the bots you chose to allow.
5. Pull two weeks of logs, confirm which AI agents visit and whether they receive 200 responses, and set a monthly reminder to re-check.

If you are also considering an llms.txt file, remember that it has no access-control function. The difference is explained in [llms.txt: What It Is and Whether You Need It](/blog/llms-txt-guide).

## The bottom line on AI crawlers

Controlling AI crawlers is not a single on-off switch. Training crawlers, AI search crawlers, user-triggered fetchers and product tokens each do something different, and robots.txt lets you make a separate choice for each. Most businesses that want AI visibility should allow the search and user agents, make a deliberate decision about training, use Search controls rather than Google-Extended for AI Overviews, and verify everything in their logs.

If you want help auditing your robots.txt, logs and AI search visibility together, you can work with me through [McGrath Marketing Group](https://mcgrathmarketinggroup.com).
