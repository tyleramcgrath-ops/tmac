---
{
  "title": "Technical SEO Checklist for Google and AI Search: 40 Checks That Decide Whether You Get Crawled, Indexed and Cited",
  "metaTitle": "Technical SEO Checklist for Google and AI Search (2026)",
  "description": "A practical technical SEO checklist for Google and AI search: crawl access, rendering, indexing, schema, speed and AI bot rules that decide if you get cited.",
  "category": "Technical SEO",
  "keywords": ["technical SEO checklist", "technical SEO for AI search", "AI crawler accessibility", "technical SEO audit", "SEO checklist 2026"],
  "excerpt": "AI answer engines can only cite what they can fetch, parse and trust. This checklist covers the technical foundations that decide whether Google and AI systems ever see your best content.",
  "imageAlt": "A layered checklist diagram showing crawl access, rendering, indexing and structured data stacked as the foundation beneath AI search answers.",
  "imageMotif": "layers",
  "keyTakeaways": [
    "Technical SEO for AI search is the same discipline as technical SEO for Google, with one extra layer: deciding which AI crawlers can access your site and confirming they actually can.",
    "Content that only appears after JavaScript runs is a risk, because many AI crawlers fetch raw HTML and do not reliably execute scripts.",
    "Google states there are no special technical requirements to appear in AI Overviews or AI Mode beyond being indexed and eligible to show a snippet in Search.",
    "Firewalls, bot-protection services and CDN rules block AI crawlers more often than robots.txt does, so check your server logs, not just your robots file.",
    "A clean technical foundation does not earn citations by itself, but technical failures can quietly remove you from consideration entirely."
  ],
  "faqs": [
    { "q": "Is technical SEO different for AI search than for Google?", "a": "Mostly no. The fundamentals are identical: crawlable URLs, server-rendered content, clean indexing signals, fast responses and accurate structured data. The difference is that AI search adds more crawlers with their own user agents and rules, and many of them handle JavaScript less reliably than Googlebot, so raw HTML quality and bot access matter even more." },
    { "q": "Do I need special markup to appear in Google AI Overviews?", "a": "No. Google's documentation says there are no additional requirements to appear in AI Overviews or AI Mode. A page must be indexed and eligible to show a snippet in Google Search. Structured data, clean HTML and helpful content still help Google understand the page, but there is no AI-specific tag or file you must add." },
    { "q": "Can AI crawlers read JavaScript-rendered content?", "a": "Not reliably. Googlebot renders JavaScript, but many AI crawlers appear to fetch the initial HTML response and may not execute scripts. If your main content, prices or product details only load client-side, some AI systems may see an empty page. Server-side rendering or static generation is the safest approach." },
    { "q": "How do I know if AI bots are crawling my site?", "a": "Check your server or CDN access logs for user agents such as GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot and Googlebot. Filter by user agent, look at status codes, and confirm the bots receive 200 responses rather than 403 errors or challenge pages from bot-protection tools." },
    { "q": "Should I add an llms.txt file as part of technical SEO?", "a": "It is optional. llms.txt is a proposed standard published at llmstxt.org, and no major AI provider has publicly committed to using it. It is cheap to add and harmless, but it should never be prioritized over crawl access, rendering, indexing and structured data, which have documented effects." },
    { "q": "How often should I run a technical SEO audit?", "a": "Run a full technical audit at least quarterly and after any site migration, redesign, CMS change, CDN or firewall change. Monitor the critical items continuously: indexing coverage in Search Console, server errors, robots.txt changes and AI bot status codes in your logs, because a single configuration change can block crawlers overnight." }
  ]
}
---

A technical SEO checklist for Google and AI search covers the foundations that decide whether any search system can find, fetch, understand and trust your pages: crawl access for Googlebot and AI bots, server-rendered HTML, clean indexing signals, accurate structured data, fast and stable responses, and a sensible site architecture. Get these right and your content becomes eligible to rank and be cited.

Everything else in AI visibility work — writing quotable content, building entity signals, earning mentions — sits on top of this layer. If a crawler gets a 403, an empty JavaScript shell or a canonical pointing somewhere else, nothing you write matters. This is the checklist I work through when I audit a site for both classic rankings and AI answers, organized from the most fundamental checks to the most refined.

## Why Technical SEO Still Decides AI Visibility

Technical SEO is the practice of making a website easy for search systems to crawl, render, index and interpret. In AI search, that definition stays the same, but the audience of machines grows: Googlebot is joined by crawlers from OpenAI, Anthropic, Perplexity and others, each fetching pages to train models, build search indexes or answer a live user question.

Google is explicit that AI features in Search draw on its normal index. Its [AI features documentation](https://developers.google.com/search/docs/appearance/ai-features) says there are no additional requirements for AI Overviews or AI Mode beyond being indexed and eligible for a snippet. That means a page that fails classic technical SEO also fails AI Overviews.

Other AI systems run their own crawlers and retrieval pipelines, and they are less forgiving than Google in some ways. In practice, the sites I see struggle in ChatGPT or Perplexity answers often have one of three technical problems: bots blocked at the firewall, content hidden behind client-side JavaScript, or a messy indexing setup that splits signals across duplicate URLs.

If you want the strategic picture of how AI answers choose sources, start with [what generative engine optimization is](/blog/what-is-generative-engine-optimization). This post stays focused on the plumbing.

## Section 1: Crawl Access for Googlebot and AI Crawlers

Crawl access is the first gate: if a crawler cannot fetch a URL and receive a 200 response with real content, the page does not exist for that system. Check access at three layers, because each can block bots independently: robots.txt, server and firewall rules, and authentication or geography restrictions.

### The robots.txt checks

1. Confirm `/robots.txt` returns a 200 status and plain text, not an HTML error page or a redirect loop.
2. Confirm you are not disallowing important directories by accident, such as `/blog/`, `/products/` or asset folders containing CSS and JavaScript needed for rendering.
3. Decide deliberately which AI user agents you allow. OpenAI documents GPTBot (training), OAI-SearchBot (search) and ChatGPT-User (user-initiated fetches) on its [bots page](https://platform.openai.com/docs/bots). Anthropic uses ClaudeBot, Claude-SearchBot and Claude-User. Perplexity uses PerplexityBot.
4. Remember that Google-Extended controls whether your content is used for Gemini model training and grounding, not whether you appear in Google Search. Blocking it does not remove you from Search or AI Overviews.
5. Reference your XML sitemap with a `Sitemap:` line.

A common, sensible pattern for a business that wants AI visibility looks like this:

```
User-agent: *
Disallow: /cart/
Disallow: /account/
Disallow: /search?

User-agent: OAI-SearchBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: https://www.example.com/sitemap.xml
```

Whether to allow training crawlers like GPTBot and ClaudeBot is a business decision, not a technical one. I cover the trade-offs in detail in the [AI crawlers and robots.txt guide](/blog/ai-crawlers-robots-txt).

### The firewall and CDN checks

This is where I find the most hidden problems. Bot-protection features on CDNs and security plugins frequently challenge or block AI crawlers by default, regardless of what robots.txt says.

1. Review your CDN or web application firewall settings for "AI bot" or "AI scraper" blocking toggles and confirm they match your robots.txt intent.
2. Check that verified search crawlers are not being served CAPTCHA or JavaScript challenge pages.
3. Pull a sample of access logs, filter by AI user agents, and confirm status codes are 200, not 403, 429 or 503.
4. Make sure rate limiting is not so aggressive that crawlers get throttled during normal crawl bursts.

### The access-restriction checks

Pages behind logins, paywalls without proper markup, or geo-blocking for certain regions are invisible to most crawlers. If you need gated content to be discoverable, Google supports paywalled content structured data, but most AI crawlers will simply see whatever an anonymous visitor sees.

## Section 2: Rendering and the Raw HTML Test

Rendering is the process of turning a page's code into the content a user sees. Googlebot renders JavaScript using an evergreen version of Chromium, but many AI crawlers appear to work primarily from the raw HTML response, so any content that only exists after scripts run is at risk of being missed.

The single most useful test I run is simple: fetch the page without JavaScript and read what comes back.

```
curl -A "Mozilla/5.0 (compatible; TestBot/1.0)" -s https://www.example.com/pricing | grep -i "per month"
```

If your pricing, product descriptions, author names or main article text are missing from that output, you have a rendering dependency.

### Rendering checklist

1. Main content, headings and body copy are present in the initial HTML response.
2. Navigation and internal links are standard `<a href>` elements in the HTML, not JavaScript click handlers.
3. Structured data (JSON-LD) is in the server-rendered HTML rather than injected later by a tag manager.
4. Content behind tabs and accordions is in the DOM on load, even if visually collapsed.
5. Lazy-loaded content below the fold uses native lazy loading or loads without requiring scroll events.
6. Important images have real `src` attributes and descriptive `alt` text in the HTML.

### Rendering strategies compared

| Rendering approach | Googlebot | Most AI crawlers | Recommendation |
|---|---|---|---|
| Static site generation (SSG) | Fully visible | Fully visible | Best for content pages |
| Server-side rendering (SSR) | Fully visible | Fully visible | Best for dynamic pages |
| Hybrid / incremental static | Fully visible | Fully visible | Strong default for modern frameworks |
| Client-side rendering (CSR) only | Visible after rendering queue | Often partial or empty | Avoid for anything you want cited |
| Dynamic rendering for bots | Works, but Google calls it a workaround | Depends on user-agent detection | Use only as a temporary fix |

If you run a JavaScript framework, the fix is usually a configuration change to pre-render or server-render content routes, not a rebuild.

## Section 3: Indexing Signals and Canonicalization

Indexing is the step where a search engine decides to store a page and make it eligible for results. Clean indexing signals tell every system which URL is the authoritative version of a piece of content, so ranking and citation signals concentrate on one page rather than splitting across duplicates.

### Indexing checklist

1. Every important page returns a 200 status code and is not marked `noindex` in a meta robots tag or `X-Robots-Tag` header.
2. Every indexable page has a self-referencing canonical tag with an absolute URL.
3. Canonical tags agree with internal links, sitemaps and redirects. Mixed signals cause search engines to pick their own canonical.
4. HTTP redirects to HTTPS, and one hostname (www or non-www) redirects to the other with a single 301 hop.
5. Trailing-slash and uppercase variants resolve to one version.
6. Parameterized URLs (sorting, filtering, tracking) either canonicalize to the clean URL or are kept out of the crawl.
7. Thin, duplicate or placeholder pages are consolidated, improved or set to `noindex`.
8. Google Search Console's page indexing report shows no unexpected spikes in "Crawled – currently not indexed" or "Duplicate without user-selected canonical".

### Why this matters more for AI

When I see an AI answer cite a parameterized URL, a staging subdomain or an old HTTP version of a client's page, it is almost always an indexing hygiene problem. AI systems that retrieve from search indexes inherit whatever URL the index treats as canonical. Clean canonicalization makes sure the URL that gets cited is the one you want people to land on.

## Section 4: XML Sitemaps and Freshness Signals

An XML sitemap is a file that lists the URLs you want crawled, optionally with the date each was last modified. Sitemaps do not guarantee indexing, but they help crawlers discover new and updated pages faster, which matters for AI systems that favor current information on time-sensitive topics.

### Sitemap checklist

1. The sitemap includes only canonical, indexable URLs that return 200.
2. `lastmod` dates reflect real content changes, not every deploy. Inflated dates train crawlers to ignore the field.
3. Large sites split sitemaps by type (posts, products, locations) under a sitemap index, which also makes coverage issues easier to diagnose.
4. The sitemap is submitted in Google Search Console and Bing Webmaster Tools.
5. Consider IndexNow for faster discovery by Bing and other participating engines. Bing's index matters for AI because several AI products have used Bing search results for retrieval.

A clean sitemap entry looks like this:

```xml
<url>
  <loc>https://www.example.com/blog/technical-seo-checklist-ai-search</loc>
  <lastmod>2026-11-04</lastmod>
</url>
```

### Visible freshness

Machine-readable dates should match what readers see. Show a "last updated" date on content that changes, and make sure `dateModified` in your Article schema matches it. Updating a date without updating the content is the kind of signal that erodes trust over time.

## Section 5: Structured Data That Matches the Page

Structured data is code, usually JSON-LD using the [Schema.org](https://schema.org/) vocabulary, that labels what a page is about in a machine-readable way: the organization, the author, the product, the price, the location. Structured data does not guarantee rich results or AI citations, but it removes ambiguity about entities and facts.

### Structured data checklist

1. `Organization` (or `LocalBusiness`) markup on the homepage or about page, with your legal name, logo, URL and `sameAs` links to official profiles.
2. `Article` or `BlogPosting` on editorial content, with `author` linking to a real person and `datePublished` / `dateModified`.
3. `Person` markup for authors, connected to their bio page.
4. `Product` and `Offer` markup on product pages, with prices that match the visible page.
5. `BreadcrumbList` reflecting your actual site hierarchy.
6. `FAQPage` markup only where the page genuinely contains those questions and answers. Note that Google now limits FAQ rich results mostly to authoritative government and health sites, but FAQPage remains valid schema and still describes the content.
7. Validate with Google's Rich Results Test and the Schema Markup Validator, and fix every error.
8. Never mark up content that is not visible on the page. Mismatches are a spam-policy risk and a trust problem.

A minimal Organization block:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Example Co.",
  "url": "https://www.example.com",
  "logo": "https://www.example.com/logo.png",
  "sameAs": [
    "https://www.linkedin.com/company/example-co",
    "https://www.youtube.com/@exampleco"
  ]
}
```

For a deeper treatment of which types matter most and how to connect them into an entity graph, read the dedicated guide to [schema markup for AI search](/blog/schema-markup-for-ai-search).

## Section 6: Page Speed, Stability and Server Health

Page experience is the set of signals around how fast, stable and usable a page is, including Google's Core Web Vitals. For AI crawlers, the most important part is simpler: the server must respond quickly and consistently, because a timeout during a live retrieval means your page is skipped for that answer.

### Performance checklist

1. Time to first byte is consistently fast. Slow server responses limit how much any crawler fetches.
2. Core Web Vitals (Largest Contentful Paint, Interaction to Next Paint, Cumulative Layout Shift) pass in Search Console's field data for your main templates.
3. Error rates are low. Spikes of 5xx errors cause crawlers to slow down or back off.
4. HTML pages are not bloated with megabytes of inline scripts that push main content far down the document.
5. Caching is configured so repeated crawler fetches hit the CDN, not your origin server.
6. Uptime monitoring alerts you to outages, because a site that is down when a user asks an AI assistant a question loses that citation.

### A note on user-initiated fetches

Agents like ChatGPT-User and Claude-User fetch pages in real time when a person asks about a specific URL or topic. Those requests are time-sensitive in a way that scheduled crawls are not. A page that takes many seconds to respond may simply not make it into the answer.

## Section 7: Site Architecture and Internal Linking

Site architecture is how your pages are organized and connected. A clear hierarchy with descriptive internal links helps crawlers discover every important page and helps both search engines and AI systems understand which pages are central to a topic.

### Architecture checklist

1. Every important page is reachable within a few clicks from the homepage.
2. No orphan pages: every indexable URL has at least one internal link pointing to it.
3. Internal link anchor text describes the destination ("technical SEO checklist") rather than "click here".
4. URLs are short, readable and stable. Changing URLs without redirects destroys accumulated signals.
5. Hub pages link to every page in their cluster, and cluster pages link back to the hub.
6. Breadcrumbs reflect the real hierarchy and are marked up.
7. Pagination uses crawlable links, not only infinite scroll.

Architecture is where technical SEO and content strategy meet. If you are building out topic clusters, plan hubs and spokes first so the internal linking reinforces what you want to be known for.

## Section 8: Content Structure That Machines Can Parse

Content structure is the technical side of formatting: semantic HTML that makes the role of each element clear. Machines extract passages more reliably from pages with a logical heading hierarchy, real lists and tables, and one clear topic per page.

### HTML structure checklist

1. One `<h1>` per page that states the topic clearly.
2. Headings nest logically (`h2` then `h3`), not chosen for visual size.
3. Lists are real `<ul>` or `<ol>` elements; tables are real `<table>` elements with header cells, not images or styled divs.
4. Key definitions and answers appear as text, not inside images, PDFs or embedded widgets.
5. Author name, publication date and updated date are visible text near the top of articles.
6. Main content is wrapped in `<main>` or `<article>`, separating it from navigation, sidebars and footers.
7. Important facts (hours, prices, specifications) appear in plain text near relevant headings.

How you write within that structure — leading with direct answers, keeping sections self-contained — is its own discipline, covered in [how to write content AI engines quote](/blog/writing-content-ai-can-cite).

## Section 9: AI-Specific Extras: llms.txt, Bing and Log Monitoring

A few technical items are specific to AI search. Some have clear value, like Bing indexing and log monitoring; others, like llms.txt, are optional experiments. Prioritize accordingly.

| Item | What it is | Documented effect | Priority |
|---|---|---|---|
| AI bot rules in robots.txt | Per-user-agent allow/disallow | Documented by OpenAI, Anthropic, Perplexity, Google | High |
| Firewall alignment | Bot protection matches robots intent | Determines whether bots can fetch at all | High |
| Bing Webmaster Tools | Indexing in Bing | Bing results have been used by some AI products | High |
| Log-based bot monitoring | Tracking AI user agents and status codes | Your only direct evidence of access | High |
| llms.txt | Proposed Markdown index for LLMs (llmstxt.org) | No major provider has committed to using it | Low |
| Markdown versions of pages | Clean text copies of content | Unproven; observed experimentation only | Low |

### Setting up log monitoring

1. Export a week of access logs from your server or CDN.
2. Filter by user agents: Googlebot, Bingbot, GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot.
3. Group by status code and by top URLs requested.
4. Flag any AI bot receiving non-200 responses on pages you want visible.
5. Repeat monthly, and after every infrastructure change.

Be aware that user-agent strings can be spoofed. Where providers publish IP ranges, verify important traffic against them. Connecting these logs to referral and citation data is covered in [measuring AI search visibility](/blog/measuring-ai-search-visibility).

If you want to try llms.txt, treat it as a low-cost experiment and keep it in sync with your real sitemap.

## Common Technical SEO Mistakes That Block AI Citations

These are the issues I find most often when a site is invisible in AI answers despite strong content. Most are configuration problems, not content problems, and most take less than a day to fix once found.

1. **Blocking AI search bots while trying to block training bots.** Disallowing every AI user agent to stop training also stops OAI-SearchBot or PerplexityBot from surfacing you in answers.
2. **CDN bot protection overriding robots.txt.** Your robots file says "allow" while your firewall serves a challenge page.
3. **Client-side rendering for core content.** The page looks perfect in a browser and empty to crawlers that do not execute JavaScript.
4. **Structured data injected by a tag manager.** It may never be seen by crawlers that do not render.
5. **Staging sites left indexable.** Duplicate copies of your site compete with production and sometimes get cited instead.
6. **Canonicals pointing to the wrong place.** Templates that canonicalize every page to the homepage, or paginated pages to page one, erase content from the index.
7. **Key facts only in images or PDFs.** Pricing tables as images and service menus as PDFs are hard to extract.
8. **Ignoring Bing.** Sites that never set up Bing Webmaster Tools often have indexing gaps they never notice.

## How to Start This Week: A 5-Day Technical Sprint

You do not need to work through all forty checks at once. This sequence surfaces the highest-impact problems first, and each day's task fits in a few hours.

1. **Day 1: Access.** Read your robots.txt, check CDN and firewall bot settings, and confirm alignment with your intent for each AI user agent.
2. **Day 2: Logs.** Pull a week of access logs, filter for search and AI bots, and list every non-200 response on important URLs.
3. **Day 3: Rendering.** Fetch your top ten templates with JavaScript disabled or with `curl`, and note anything missing from the raw HTML.
4. **Day 4: Indexing.** Review Search Console's page indexing report, verify canonicals and redirects on top pages, and submit clean sitemaps to Google and Bing.
5. **Day 5: Structured data.** Validate Organization, Article and Product or LocalBusiness markup on key templates, and fix errors and mismatches.

After the sprint, put recurring checks on the calendar: a monthly log review, a quarterly full audit, and an immediate audit after any migration, redesign or CDN change.

## Build the Foundation, Then Compete on Content

Technical SEO for AI search is not a new discipline. It is the old one, applied to a larger set of machines with less patience for JavaScript, misconfigured firewalls and mixed signals. The sites that get cited consistently are the ones where every crawler can fetch a fast, server-rendered page with a clear canonical URL, honest structured data and content structured for extraction.

None of this guarantees a citation. Technical excellence makes you eligible; authority, relevance and clarity decide whether you are chosen. But eligibility is the part fully within your control, and it is where I start every engagement. If you want an experienced set of eyes on your technical foundation for both Google and AI search, [McGrath Marketing Group](https://mcgrathmarketinggroup.com) can run the audit and help you prioritize the fixes.
