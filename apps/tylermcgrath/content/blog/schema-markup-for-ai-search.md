---
{
  "title": "Schema Markup for AI Search: The Structured Data That Actually Helps in 2026",
  "metaTitle": "Schema Markup for AI Search: What Helps and What Doesn't",
  "description": "Schema markup for AI search: which JSON-LD types help Google, ChatGPT and Perplexity understand your pages, with copy-paste examples and mistakes to avoid.",
  "category": "Technical SEO",
  "keywords": ["schema markup for AI search", "structured data for AI", "JSON-LD for AI Overviews", "schema for LLMs", "Organization schema", "Article schema"],
  "excerpt": "Schema will not force an AI engine to cite you, but it removes ambiguity about who you are and what a page says. Here are the types worth implementing, with JSON-LD you can copy.",
  "imageAlt": "Stacked translucent layers of labeled data blocks feeding into an abstract AI answer panel.",
  "imageMotif": "layers",
  "keyTakeaways": [
    "Schema markup is machine-readable context in JSON-LD that tells search engines and AI systems exactly what entities, facts and relationships a page contains.",
    "Google states there is no special schema required to appear in AI Overviews or AI Mode; structured data helps by improving understanding and eligibility, not by acting as an AI switch.",
    "The highest-value types for AI visibility are Organization, Person, Article, Product, LocalBusiness and BreadcrumbList, connected with stable @id values and sameAs links.",
    "Structured data must match the visible content on the page, because markup that contradicts the page is ignored at best and treated as spam at worst.",
    "Validate every template with the Rich Results Test and the Schema.org validator, then monitor Search Console enhancement reports after each release."
  ],
  "faqs": [
    { "q": "Does schema markup help you show up in AI Overviews?", "a": "Schema markup helps indirectly. Google says there are no additional technical requirements to appear in AI Overviews or AI Mode beyond being indexed and eligible to show a snippet in Search. Structured data helps Google understand your entities and content more confidently, which supports that eligibility, but no specific schema type guarantees inclusion or citation in an AI answer." },
    { "q": "Do ChatGPT and Perplexity read schema markup?", "a": "OpenAI and Perplexity have not published detailed documentation on how their systems use JSON-LD. Their crawlers fetch the HTML, and JSON-LD sits in that HTML, so it is available to them. In practice, treat schema as a clarity layer that may help any parser, while making sure the visible text states the same facts plainly." },
    { "q": "What is the best schema type for AI search?", "a": "There is no single best type. Organization (or Person for an individual expert) is the foundation because it defines who you are. After that, use the type that matches each page: Article for editorial content, Product for products, LocalBusiness for locations, and BreadcrumbList site-wide. Connect them with @id references so they form one consistent graph." },
    { "q": "Is FAQPage schema still worth adding?", "a": "FAQPage is still valid Schema.org markup, but Google now shows FAQ rich results mainly for well-known, authoritative government and health websites. For most sites it will not produce a visual rich result. It can still be useful as clean, structured question-and-answer context, as long as the questions and answers are visible on the page." },
    { "q": "Should I use JSON-LD, Microdata or RDFa?", "a": "Use JSON-LD. Google recommends it because it is easiest to implement and maintain at scale, and it keeps structured data separate from your HTML layout. Microdata and RDFa still work, but they are harder to audit and easier to break during redesigns. JSON-LD can be injected through templates, a CMS plugin or a tag manager." },
    { "q": "Can bad schema markup hurt my site?", "a": "Yes. Markup that describes content users cannot see, misrepresents reviews or ratings, or marks up irrelevant information can violate Google's structured data guidelines and lead to a manual action that removes rich result eligibility. Invalid or contradictory markup usually just gets ignored, but it wastes effort and can muddy how systems understand your entities." }
  ]
}
---

Schema markup for AI search is structured data, usually written in JSON-LD, that labels the entities and facts on a page so search engines and AI systems can read them without guessing. It does not force ChatGPT or Google AI Overviews to cite you. It removes ambiguity about who you are, what a page covers and how your facts connect, which is what retrieval systems reward.

That distinction matters because a lot of advice in 2026 treats schema like a secret AI switch. It is not. It is closer to a well-labeled filing cabinet: it will not make a weak document worth reading, but it makes a strong one far easier to find, verify and quote. This guide covers what structured data actually does in an AI search context, which types are worth your time, copy-paste JSON-LD for each, and the mistakes I see most often when I audit sites.

## What schema markup is and why AI search changes the stakes

**Schema markup** is a shared vocabulary, maintained at [Schema.org](https://schema.org/), for describing things on the web: organizations, people, articles, products, places, events and the relationships between them. You add it to a page, most often as a JSON-LD script block, and machines read it alongside your visible content.

In classic SEO, schema was mostly about rich results: star ratings, recipe cards, event listings. Those still exist, though Google has narrowed several of them over the years. In AI search, the job shifts. Answer engines need to decide which source to trust for a fact, whether two mentions refer to the same company, and whether a page is actually about the thing the user asked. Structured data gives them explicit, unambiguous statements to cross-check.

Think of it this way. Your visible text says "we've served Denver since 2012." Your Organization markup says `"foundingDate": "2012"` and `"areaServed": "Denver, CO"`. Your Google Business Profile, your LinkedIn page and a local news mention say the same. Each consistent signal makes the fact easier for any system to accept. Schema is one of those signals, and it is the one you fully control.

## What Google and AI providers have actually said about structured data

Google has been direct on this point: there are no additional requirements, and no special schema, needed to appear in AI Overviews or AI Mode. Pages need to be indexed and eligible to show a snippet in Google Search. Google's [guidance on AI features](https://developers.google.com/search/docs/appearance/ai-features) frames structured data as part of normal best practice, with the reminder that markup should match the visible content.

Google's broader [structured data documentation](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data) explains that it uses structured data to understand page content and to gather information about the web and the world, which is the part that matters most for AI answers. Understanding is upstream of citation.

OpenAI, Anthropic and Perplexity have not published detailed specifications for how their systems use JSON-LD. Their crawlers fetch HTML, and JSON-LD lives in the HTML, so the data is there for them to parse. Beyond that, I won't claim specifics nobody has documented. The practical stance is simple: write schema for Google's documented use, and assume any other system benefits from the same clarity.

### What schema is not

- Schema is not a ranking factor you can turn up. It does not add authority a page has not earned.
- Schema is not a substitute for text. If a fact appears only in markup and nowhere on the page, you are violating guidelines and giving AI systems nothing quotable.
- Schema is not a citation guarantee. No type, property or combination forces an answer engine to name you.

## The schema types that matter most for AI visibility

The schema types that matter most for AI visibility are the ones that define entities and their relationships: Organization or Person first, then the page-level type that matches each template. Here is how I prioritize them on a typical business site.

| Schema type | Where it goes | What it clarifies for AI systems | Priority |
|---|---|---|---|
| Organization | Home page or About page | Legal name, logo, official profiles, contact points | Essential |
| Person | Author pages, founder or expert bios | Who wrote or stands behind the content, credentials | Essential for expert-led sites |
| WebSite | Home page | Site name and the publisher behind it | High |
| Article / BlogPosting | Every editorial page | Headline, author, publisher, dates | High |
| BreadcrumbList | Site-wide | Where a page sits in your topical structure | High |
| Product / Offer | Product pages | Name, brand, price, availability, identifiers | Essential for ecommerce |
| LocalBusiness | Location pages | Address, hours, geo, service area | Essential for local |
| Service | Service pages | What you offer, to whom, where | Medium |
| FAQPage | Pages with visible Q&A | Question-answer pairs | Medium (limited rich result) |
| HowTo | Step-by-step guides | Ordered steps | Low (Google dropped the rich result) |

A note on the bottom two rows. FAQPage remains valid Schema.org markup, but Google now shows FAQ rich results mainly for authoritative government and health sites. Google also stopped showing HowTo rich results. Neither is harmful when it accurately describes visible content, but neither should be the centerpiece of your strategy.

## Build a connected entity graph with @id

The single biggest upgrade most sites can make is connecting their schema blocks into one graph using `@id`. An **`@id`** is a stable URI you assign to an entity so every other block can reference it instead of redefining it. Without it, your home page declares an Organization, your blog post declares a slightly different publisher, and your author bio declares a third variation. Machines see three loosely related things instead of one authoritative entity.

The pattern is to define your core entities once, give each a permanent `@id` (a URL plus a fragment like `#organization`), and reference them everywhere else. This is the structured-data side of entity SEO, which I cover in depth in [Entity SEO and the Knowledge Graph](/blog/entity-seo-knowledge-graph).

Here is a home page graph that defines the organization, the founder and the website in one block:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.example.com/#organization",
      "name": "Example Growth Co.",
      "url": "https://www.example.com/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.example.com/images/logo.png"
      },
      "description": "Example Growth Co. is a digital marketing agency specializing in technical SEO and AI search visibility.",
      "foundingDate": "2012",
      "founder": { "@id": "https://www.example.com/#founder" },
      "sameAs": [
        "https://www.linkedin.com/company/example-growth-co",
        "https://www.youtube.com/@examplegrowth",
        "https://www.wikidata.org/wiki/Q00000000"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "sales",
        "email": "hello@example.com"
      }
    },
    {
      "@type": "Person",
      "@id": "https://www.example.com/#founder",
      "name": "Jordan Example",
      "jobTitle": "Founder and SEO Director",
      "url": "https://www.example.com/about/jordan-example",
      "worksFor": { "@id": "https://www.example.com/#organization" },
      "sameAs": [
        "https://www.linkedin.com/in/jordanexample"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://www.example.com/#website",
      "url": "https://www.example.com/",
      "name": "Example Growth Co.",
      "publisher": { "@id": "https://www.example.com/#organization" }
    }
  ]
}
```

Wrap the JSON in a `script` element with `type="application/ld+json"` in the page head or body. Only include `sameAs` URLs for profiles you actually own or that genuinely describe you. A placeholder Wikidata ID like the one above is there to show the format; never publish one that does not exist.

## Article and author markup for content you want quoted

Article markup tells machines who wrote a piece, who published it and when it was last updated, which are exactly the trust questions answer engines need to settle before quoting a source. Use `BlogPosting` or `Article` on every editorial page, and point `author` and `publisher` at the entities you defined in your graph.

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "@id": "https://www.example.com/blog/schema-guide#article",
  "headline": "Schema Markup for AI Search",
  "description": "Which structured data types help AI systems understand your pages.",
  "datePublished": "2026-10-12",
  "dateModified": "2026-11-02",
  "author": { "@id": "https://www.example.com/#founder" },
  "publisher": { "@id": "https://www.example.com/#organization" },
  "mainEntityOfPage": "https://www.example.com/blog/schema-guide",
  "image": "https://www.example.com/images/schema-guide-hero.jpg",
  "about": [
    { "@type": "Thing", "name": "Schema.org" },
    { "@type": "Thing", "name": "Structured data" }
  ]
}
```

Three details make this block more useful than the average implementation:

1. `dateModified` reflects real, meaningful updates. Bumping the date without changing content is a pattern I would avoid; it erodes trust when the page plainly has not changed.
2. `author` references a Person entity that has its own page, credentials and profiles. This supports the experience and expertise signals discussed in [E-E-A-T in the Age of AI Search](/blog/eeat-in-the-ai-era).
3. `about` names the topics in plain terms. It is optional, but it is a clean way to state what the page is about without keyword stuffing.

Markup only labels the content; the content still has to be worth quoting. The structure of the writing itself, with answer-first paragraphs and self-contained sections, is covered in [How to Write Content AI Engines Quote](/blog/writing-content-ai-can-cite).

## Product, LocalBusiness and BreadcrumbList examples

Product, LocalBusiness and BreadcrumbList markup carry the hard facts that AI answers most often get wrong: prices, availability, addresses, hours and where a page sits in your site. These are the types where precise, current data pays off most.

### Product with an Offer

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://www.example.com/products/trail-pack-30#product",
  "name": "Trail Pack 30L",
  "description": "A 30-liter hiking backpack with a ventilated back panel and rain cover.",
  "brand": { "@type": "Brand", "name": "Example Outdoor" },
  "sku": "TP30-BLK",
  "gtin13": "0000000000000",
  "image": "https://www.example.com/images/trail-pack-30.jpg",
  "offers": {
    "@type": "Offer",
    "url": "https://www.example.com/products/trail-pack-30",
    "priceCurrency": "USD",
    "price": "129.00",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition"
  }
}
```

Replace the placeholder GTIN with your real identifier or remove the property. Only add `aggregateRating` or `review` if those reviews are genuine and visible on the page.

### LocalBusiness

```json
{
  "@context": "https://schema.org",
  "@type": "Plumber",
  "@id": "https://www.example.com/locations/denver#business",
  "name": "Example Plumbing - Denver",
  "parentOrganization": { "@id": "https://www.example.com/#organization" },
  "url": "https://www.example.com/locations/denver",
  "telephone": "+1-303-555-0100",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Example St",
    "addressLocality": "Denver",
    "addressRegion": "CO",
    "postalCode": "80202",
    "addressCountry": "US"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": 39.7392, "longitude": -104.9903 },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "07:00",
      "closes": "18:00"
    }
  ],
  "areaServed": ["Denver", "Aurora", "Lakewood"]
}
```

Use the most specific LocalBusiness subtype that fits (Plumber, Dentist, LegalService and so on). The details must match your Google Business Profile exactly, down to the suite number and phone format, because AI answers about local businesses often blend several sources and inconsistencies show up quickly.

### BreadcrumbList

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.example.com/" },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.example.com/blog" },
    { "@type": "ListItem", "position": 3, "name": "Schema Markup for AI Search" }
  ]
}
```

Breadcrumbs are unglamorous, but they express your topical hierarchy in a form every parser understands.

## How to implement schema markup step by step

Implementing schema markup well is a template problem, not a page-by-page problem. Map each page template to a schema type, build it once with dynamic fields, and validate before release. Here is the process I use.

1. **Inventory your templates.** List every distinct page type: home, about, author, article, category, product, location, service, contact.
2. **Define your core entities.** Write down the canonical facts for your Organization and key People: legal name, logo URL, founding date, official profiles. Assign each a permanent `@id`.
3. **Map templates to types.** Pick one primary type per template from the table above. Resist marking up everything as everything.
4. **Pull values from the same source as the visible page.** If the price on the page comes from your product database, the price in the markup should too. This prevents drift.
5. **Reference, do not repeat.** Use `@id` references for author, publisher and parent organization rather than redefining them in every block.
6. **Validate.** Run representative URLs through Google's Rich Results Test for feature eligibility and the Schema.org validator for general correctness.
7. **Check the rendered HTML.** If schema is injected with JavaScript, confirm it appears in the rendered output Google sees, using URL Inspection in Search Console.
8. **Monitor.** Watch Search Console's enhancement reports after each deploy, and re-test templates whenever the CMS or theme changes.

If your site has deeper crawl or rendering issues, fix those first. Schema on a page that cannot be crawled or indexed does nothing. The broader foundation is in the [Technical SEO Checklist for Google and AI Search](/blog/technical-seo-checklist-ai-search).

## Common schema mistakes that undermine AI visibility

The most damaging schema mistakes are the ones that make your structured data disagree with your page or with itself. These are the problems I find most often in audits.

- **Marking up invisible content.** Adding FAQ answers, reviews or claims that do not appear on the page violates Google's guidelines and can trigger a manual action.
- **Conflicting entity definitions.** The home page says "Example Growth Co.", the footer markup says "Example Growth LLC", and the article publisher says "ExampleGrowth". Pick one canonical name and reference it.
- **Plugin overlap.** Two SEO plugins, a theme and a review widget each output their own Organization block. Audit the rendered page and keep one source of truth.
- **Stale facts.** Prices, hours and availability that drift out of date are worse than no markup, because they hand AI systems a confident wrong answer.
- **Fake or self-serving reviews.** Self-serving review markup on your own Organization or LocalBusiness is not eligible for review rich results, and fabricated reviews create real risk.
- **Over-relying on sameAs.** Listing every directory you have ever touched dilutes the signal. Link the profiles that are authoritative and genuinely yours.
- **Treating validation as the finish line.** Valid markup can still be useless if it describes a thin page. Schema amplifies content quality; it does not create it.

## How to measure whether schema is working

Measuring schema's impact is indirect, because no tool reports "cited because of JSON-LD." What you can measure is coverage, validity and the downstream visibility of the pages you marked up.

- **Coverage and errors:** Search Console's enhancement reports show which templates are being detected and where errors or warnings appear.
- **Rich result performance:** The Search appearance filter in the Performance report shows impressions and clicks for eligible rich result types.
- **Entity consistency:** Search your brand name in Google and in several AI assistants and note whether facts like founding date, location and leadership match your markup.
- **AI citations:** Track whether your marked-up pages appear as cited sources for your priority questions over time. The methodology is in [How to Measure AI Search Visibility and LLM Traffic](/blog/measuring-ai-search-visibility).

Treat these as directional signals. If a template goes from zero valid items to full coverage and those pages begin appearing more often in AI answers, that is a reasonable pattern to note, not proof of causation.

## How to start with schema markup this week

You can make meaningful progress on schema markup in a single week by focusing on your entity foundation and your highest-traffic template. Here is a practical plan.

1. **Day 1:** Run your home page, one article and one product or service page through the Rich Results Test. Note every type currently detected and every error.
2. **Day 2:** Write your canonical entity facts in a shared document: official name, logo, founding date, key people, and the profiles you control.
3. **Day 3:** Implement or fix the Organization, Person and WebSite graph on the home page using stable `@id` values.
4. **Day 4:** Update your article template so `author` and `publisher` reference those entities and `dateModified` reflects real edits.
5. **Day 5:** Remove duplicate schema output from overlapping plugins, then re-validate and request indexing for the key URLs in Search Console.

After that, move to Product, LocalBusiness or Service templates depending on your business model, and schedule a quarterly schema audit.

## The bottom line on schema for AI search

Schema markup is not a shortcut into AI answers, and anyone selling it that way is overselling. What it does well is make your entities, facts and page purpose explicit, consistent and machine-readable, which is exactly what systems need before they trust and quote a source. Pair it with content that answers questions clearly and a site that crawls cleanly, and it becomes one of the most durable investments in your technical stack.

If you want a second set of eyes on your structured data or a full AI search visibility plan, you can work with me through [McGrath Marketing Group](https://mcgrathmarketinggroup.com).
