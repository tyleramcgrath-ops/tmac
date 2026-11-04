---
{
  "title": "llms.txt: What It Is, How to Write One, and Whether You Actually Need It",
  "metaTitle": "llms.txt Guide: What It Is and Whether You Need It",
  "description": "llms.txt is a proposed Markdown file that points AI tools to your most useful content. See the format, a copy-paste template and an honest take on adoption.",
  "category": "Technical SEO",
  "keywords": ["llms.txt", "what is llms.txt", "llms.txt example", "llms-full.txt", "llms.txt SEO", "AI crawler file"],
  "excerpt": "llms.txt gets pitched as the robots.txt of AI. It isn't. Here is what the proposal actually says, how to write a good one in under an hour, and when it is worth bothering.",
  "imageAlt": "A clean grid of plain text lines and links resolving into a single readable index for an AI model.",
  "imageMotif": "grid",
  "keyTakeaways": [
    "llms.txt is a proposed standard, published at llmstxt.org, for a Markdown file at the root of a website that gives large language models a concise summary and a curated list of links to the site's most useful content.",
    "No major AI provider has publicly committed to reading llms.txt files when answering users, and Google has said it does not use llms.txt for Search or AI Overviews.",
    "llms.txt does not control crawler access; blocking or allowing AI bots is still done with robots.txt and server rules.",
    "The file is most useful today for documentation-heavy sites, where developers and AI coding tools can load it directly as context.",
    "Because llms.txt is cheap to create and low risk, publishing a small, accurate one is reasonable, but it should never displace work on crawlability, content quality and entity clarity."
  ],
  "faqs": [
    { "q": "What is llms.txt?", "a": "llms.txt is a proposed file format for a plain Markdown document placed at yoursite.com/llms.txt. It gives large language models a short description of the site and a curated, organized list of links to its most important pages, ideally with clean Markdown versions. It was proposed in 2024 at llmstxt.org as a way to give AI tools concise context without parsing full HTML pages." },
    { "q": "Does Google use llms.txt?", "a": "No. Google representatives have said publicly that Google does not use llms.txt, and Google's own documentation says there are no special files or markup required to appear in AI Overviews or AI Mode. Appearing in Google's AI features depends on normal Search eligibility, meaning your pages must be crawlable, indexable and eligible to show a snippet." },
    { "q": "Do ChatGPT, Claude or Perplexity read llms.txt?", "a": "None of the major AI providers has publicly committed to using llms.txt files from websites when their products answer users. Their crawlers may fetch the file like any other URL, but there is no documented guarantee it influences answers or citations. The clearest current use is when a person or AI coding tool deliberately loads a site's llms.txt as context." },
    { "q": "Is llms.txt the same as robots.txt?", "a": "No. robots.txt is an established standard that tells crawlers which URLs they may or may not fetch. llms.txt is a proposed content guide that points AI tools toward useful pages; it has no access-control function. If you want to allow or block AI crawlers such as GPTBot or ClaudeBot, you still do that in robots.txt." },
    { "q": "What is the difference between llms.txt and llms-full.txt?", "a": "llms.txt is a short index: a summary plus links. llms-full.txt is a convention, adopted by some documentation platforms, that concatenates the full text of the linked pages into one large Markdown file so a tool can load everything at once. llms-full.txt is not part of the core proposal and is mostly useful for documentation sites." },
    { "q": "Can llms.txt hurt my SEO?", "a": "A well-made llms.txt file should not hurt your SEO. It is just another URL on your site. The risks are indirect: wasting time on it instead of higher-impact work, publishing outdated information that contradicts your pages, or linking to Markdown copies that create confusing duplicate content if they are indexed. Keep it small, accurate and maintained." }
  ]
}
---

llms.txt is a proposed standard for a plain Markdown file at the root of your website, at `/llms.txt`, that gives large language models a short summary of your site and a curated list of links to your most useful content. It is a helpful, low-cost signpost, but it is not a ranking factor, not an access control file, and not something any major AI provider has committed to reading.

That last point is where most coverage of llms.txt goes wrong. The file gets pitched as "the robots.txt for AI" or a must-have for AI visibility, and neither claim holds up. This guide explains what the proposal actually says, shows you how to write a good file with a copy-paste template, gives an honest read on adoption in 2026, and helps you decide whether it is worth an hour of your team's time.

## What llms.txt is and where it came from

**llms.txt** is a file format proposed in September 2024 by Jeremy Howard of Answer.AI and documented at [llmstxt.org](https://llmstxt.org/). The idea is simple: language models work best with concise, clean text, while websites serve complex HTML full of navigation, scripts and layout. A curated Markdown file can hand a model the essentials directly.

The proposal describes two related ideas:

1. **The `/llms.txt` file itself.** A Markdown document at the site root with a title, a short summary, optional detail and sections of links to key resources.
2. **Markdown versions of pages.** The proposal suggests that sites offer clean Markdown copies of useful pages at the same URL with `.md` appended, so tools can fetch the text without the HTML wrapper.

The format was designed with inference time in mind, meaning the moment a person or AI tool is actively trying to answer a question using a site, rather than for bulk training crawls. That framing is important when you think about who actually uses it.

## How llms.txt differs from robots.txt and sitemap.xml

llms.txt differs from robots.txt and sitemap.xml because it is a curated content guide, while robots.txt controls access and sitemap.xml lists URLs for discovery. They solve different problems, and llms.txt replaces neither.

| File | Status | Purpose | Format | Who reads it |
|---|---|---|---|---|
| robots.txt | Established standard (RFC 9309) | Tells crawlers which URLs they may fetch | Plain text directives | Search engines and most reputable AI crawlers |
| sitemap.xml | Established protocol | Lists URLs you want discovered, with optional metadata | XML | Search engines |
| llms.txt | Proposal | Summarizes the site and curates key links for LLMs | Markdown | Some AI tools, developer workflows; no committed major provider |
| llms-full.txt | Informal convention | Full text of key pages in one file | Markdown | Mostly documentation tooling |

If your goal is to allow or block GPTBot, ClaudeBot, PerplexityBot or Google-Extended, llms.txt cannot do that. Access control lives in robots.txt, which I cover in detail in [AI Crawlers and robots.txt](/blog/ai-crawlers-robots-txt).

## The llms.txt format, section by section

The llms.txt format is plain Markdown with a specific order of sections, and only the first section is required. Here is what the proposal at llmstxt.org specifies:

1. **An H1 with the name of the site or project.** This is the only required element.
2. **A blockquote with a short summary.** One or two sentences containing the key information needed to understand the rest of the file.
3. **Optional detail paragraphs or lists.** Any additional context, written without headings, such as who the site is for or how to interpret the content.
4. **Zero or more H2 sections containing "file lists."** Each list item is a Markdown link with an optional note, in the form `- [Title](url): description`.
5. **An optional section titled "Optional."** Links under an `## Optional` heading are secondary and can be skipped when a tool needs a shorter context.

Because the structure is predictable, a tool can parse it reliably while a human can still read it comfortably. That dual readability is the whole point.

## A copy-paste llms.txt template for a business site

A good llms.txt template for a business site names the company, defines it in one sentence, and links to the handful of pages that best explain what you do, for whom and on what terms. Here is a template you can adapt.

```markdown
# Example Growth Co.

> Example Growth Co. is a Denver-based digital marketing agency that specializes in technical SEO, structured data and AI search visibility for B2B service companies.

Example Growth Co. works with in-house marketing teams and founders. The pages below describe our services, our methodology and our most useful guides. Pricing is project-based; contact us for a quote.

## Company

- [About Example Growth Co.](https://www.example.com/about): Who we are, leadership, founding date and service area
- [Services](https://www.example.com/services): Technical SEO audits, AI search visibility programs and content strategy
- [Contact](https://www.example.com/contact): How to reach the team and what information to include

## Guides

- [Technical SEO checklist](https://www.example.com/guides/technical-seo-checklist): Step-by-step crawl, index and rendering checks
- [Schema markup guide](https://www.example.com/guides/schema-markup): Which structured data types to use and how to validate them
- [Measuring AI visibility](https://www.example.com/guides/ai-visibility-measurement): How we track citations in AI answers

## Optional

- [Blog archive](https://www.example.com/blog): All articles, newest first
- [Press](https://www.example.com/press): Media coverage and speaking appearances
```

Notice what the template leaves out. It does not list every URL on the site, stuff keywords into descriptions or make claims that are not on the linked pages. The file is an editorial choice about what matters most, not a second sitemap.

## An llms.txt example for documentation sites

Documentation sites are where llms.txt has the clearest practical value today, because developers and AI coding tools actively load documentation as context. For a docs site, link to Markdown versions of pages where you can, and put reference material that is rarely needed under Optional.

```markdown
# ExampleAPI

> ExampleAPI is a REST API for sending transactional email. This file indexes the documentation most useful for building an integration.

All endpoints use JSON over HTTPS and require an API key sent in the Authorization header. The current API version is v2.

## Getting started

- [Quickstart](https://docs.example.com/quickstart.md): Create an API key and send a first message
- [Authentication](https://docs.example.com/authentication.md): API keys, scopes and key rotation
- [Errors](https://docs.example.com/errors.md): Error codes and retry guidance

## API reference

- [Send a message](https://docs.example.com/reference/messages-send.md): POST /v2/messages parameters and examples
- [Webhooks](https://docs.example.com/reference/webhooks.md): Event types and signature verification

## Optional

- [Changelog](https://docs.example.com/changelog.md): Version history
- [Legacy v1 reference](https://docs.example.com/v1/index.md): Deprecated endpoints
```

Many documentation platforms now generate llms.txt automatically, and some also generate **llms-full.txt**, a convention that concatenates the full text of the documentation into one file. llms-full.txt is not part of the core proposal, and for a marketing site it is usually unnecessary. For a large API reference, it can save a developer real time.

## Who actually reads llms.txt in 2026

The honest answer is that llms.txt is read mainly by tools and people who choose to load it, not by the major AI answer engines as a documented part of how they rank or cite sources. Here is what is publicly known.

- **Google:** Google representatives have said publicly that Google does not use llms.txt. Google's [AI features documentation](https://developers.google.com/search/docs/appearance/ai-features) says there are no additional requirements, special files or markup needed to appear in AI Overviews or AI Mode beyond normal Search eligibility.
- **OpenAI, Anthropic, Perplexity and others:** None has publicly committed to reading website llms.txt files when generating answers or choosing citations. Their crawlers may request the file like any other URL, but a fetch is not the same as a documented ranking or citation input.
- **Developer tools:** AI coding assistants and documentation servers can be pointed at an llms.txt file so a model loads curated context. This is the most concrete, documented-by-practice use.
- **AI companies' own docs:** Some AI companies publish llms.txt files for their own developer documentation. That shows they find the format useful for their users; it does not mean their products read yours.

In practice, server logs on sites that publish llms.txt often show bots requesting the file, but a log line alone cannot tell you whether that request changed any answer. Treat any claim that llms.txt "gets you cited" as unproven.

## Should you create an llms.txt file?

You should create an llms.txt file if your site has documentation or reference content that people load into AI tools, or if you want a cheap, low-risk hedge in case adoption grows. You can skip it, without losing anything documented, if your time is better spent on fundamentals.

| Site type | Recommendation | Why |
|---|---|---|
| Developer docs, APIs, SDKs | Yes, plus Markdown page versions | Developers and coding tools actively load docs as context |
| SaaS with substantial help center | Yes | Helpful for support and integration questions |
| B2B service business | Optional, keep it small | Low cost, low documented benefit |
| Local business | Low priority | Google Business Profile, reviews and local pages matter far more |
| Ecommerce | Low priority | Product feeds, structured data and crawlability matter more |
| Publisher | Optional | Curate evergreen guides; do not list the entire archive |

If you are weighing llms.txt against other work, it should rank below making sure your pages are crawlable, writing content that answers questions directly and building consistent entity signals. Those are covered in the [Technical SEO Checklist for Google and AI Search](/blog/technical-seo-checklist-ai-search) and [How to Write Content AI Engines Quote](/blog/writing-content-ai-can-cite).

## How to create and publish llms.txt step by step

Creating and publishing llms.txt takes about an hour for most business sites. The work is mostly editorial: deciding which pages genuinely represent you best.

1. **Pick your 5 to 20 most useful pages.** Choose pages that explain who you are, what you offer, how it works and your best evergreen guides.
2. **Write the H1 and summary.** Use your canonical brand name and the same one-sentence definition you use on your About page and in your structured data.
3. **Group links into H2 sections.** Common groupings are Company, Services or Products, Guides, and Policies.
4. **Write a short note for each link.** Describe what the page contains in plain language, without keyword stuffing.
5. **Move secondary links under Optional.** Archives, press pages and legacy material go here.
6. **Save the file as `llms.txt` at your web root.** It should resolve at `https://www.yourdomain.com/llms.txt` with an HTTP 200 status.
7. **Serve it as plain text.** A `text/plain` or `text/markdown` content type with UTF-8 encoding works; make sure your CDN or security layer is not blocking it.
8. **Check robots.txt.** Make sure you are not disallowing `/llms.txt` for the agents you want to read it.
9. **Add it to your release checklist.** Update the file whenever you launch, rename or retire a key page.

If you also publish Markdown versions of pages, decide whether you want them indexed by search engines. Many sites add an `X-Robots-Tag: noindex` header to `.md` copies to avoid duplicate versions competing with the canonical HTML pages.

## Common llms.txt mistakes

The most common llms.txt mistakes come from treating the file as an SEO hack rather than a curated guide.

- **Dumping the sitemap.** Listing hundreds of URLs defeats the purpose of a concise, curated file.
- **Keyword-stuffed descriptions.** Notes like "best SEO agency Denver top SEO company" read as spam to humans and add nothing for models.
- **Contradicting your pages.** Prices, service lists or claims in llms.txt that differ from your website create conflicting signals.
- **Expecting access control.** Adding "do not train on this site" to llms.txt does nothing; use robots.txt and your terms.
- **Letting it rot.** Broken links and retired products in llms.txt make the file a source of wrong information.
- **Skipping the fundamentals.** A beautiful llms.txt does nothing for pages that are blocked, slow to render or thin.

## How to start this week

You can publish a solid llms.txt this week by keeping the scope small and tying it to your existing entity work.

1. Copy the business template above and replace the placeholders with your name and one-sentence definition.
2. Choose your top 10 pages and write a one-line note for each.
3. Publish the file at your root, confirm it returns a 200 status, and check that robots.txt does not block it.
4. Add an owner and a quarterly review date to your content calendar.
5. Spend the rest of the week on higher-impact work, such as fixing your Organization schema, which is covered in [Schema Markup for AI Search](/blog/schema-markup-for-ai-search).

## The bottom line on llms.txt

llms.txt is a sensible idea with a modest, real use today, mostly for documentation and developer workflows. It is not a ranking factor, not an access control mechanism and not a documented input to Google, ChatGPT, Claude or Perplexity answers. Publish a small, accurate one if it fits your site, keep it maintained, and put most of your effort where the evidence is stronger.

If you want help deciding where llms.txt fits in a broader AI search plan, you can work with me through [McGrath Marketing Group](https://mcgrathmarketinggroup.com).
