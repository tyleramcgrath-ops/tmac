# SaySites: rules for anyone building here

Read `README.md` first. Two rules there are non-negotiable:

1. **Search guidelines.** Every site follows Google Search Essentials and
   Google's spam policies. Win on merit, never with tricks.
   The list lives in `lib/guidelines.ts`: when Google changes a guideline,
   update that entry, its check and `GUIDELINES_REVIEWED` together (review
   quarterly and at every core or spam update). Never promise rankings.
2. **Pricing rule.** Free when it costs us nothing; charge when it costs us
   money (AI tokens, paid APIs such as SerpApi, any metered service), priced
   above cost. Build everything to spend as little as possible: plain code
   first, AI only where it's genuinely needed, cached and rate-limited.

Also:
- Every page must pass the 95+ speed check before it can go live.
- Design: calm colours (nothing bright), no bold-plus-cursive font pairings,
  nothing that looks AI-built.
- Sofie never invents facts, reviews, results or credentials.
- Photos: a photo appears once per site unless the owner asks for it again,
  and a stock photo belongs to one customer's site (`lib/photo-rules.ts`,
  table `ss_photos`). Owners' own uploads are exempt.

## Money check (the owner asked for this, permanently)

Before building anything new, ask: will this help get or keep paying
customers soon? If not, say so plainly and point back to what does:
- Selling first: law firms (the owner's network), using the free redesign
  preview as the pitch. Goal: 10 paying firms, then trades.
- Proof: track those firms' rankings for 60–90 days and turn real results
  into case studies.
- Reliability of what exists beats new features.
Nice-to-haves (games, extra styles, clever extras) wait until customers ask.

## Talking to the owner

When the owner has to do something on another site (Vercel, Unsplash, a
registrar), give numbered steps, one click per step, with the direct link.
If they ask again, make the steps even simpler and ask for a screenshot.

## North star (the owner's goal, permanent)

Every customer should feel "damn, I built this whole website myself," and
their site should bring them at least one phone call a month (the exact
number is still to be decided). Build and write everything toward that.

- **The owner is in control.** SaySites and Sofie are their tools, not an AI
  that does it for them. Copy says "you build / you change / your site",
  never "AI builds it for you". Show what the owner did and what it earned
  them (calls, messages, visitors, rankings).
- **Permanent tagline: "Your site. Your say."**
- Say "SEO fully optimized", not "Google-ready".
- Nothing that looks AI-built, on SaySites or on any customer site, ever:
  no "early access" / "beta" / "free while we build" pills with a glowing
  dot, no "Live" or "New" tag stamped on every card, no sparkle icons, no
  gradient text. Tags only where they carry real information (a plan
  label, an unread count). Pricing copy says "7-day free trial".
- The brand colour is the SaySites blue `#1E9BB7` (`--say`), used for the
  logo mark and nothing else.
- Never mention the founder's name in the product or marketing. Only the
  birthday page speaks in the first person about the founder's years of
  experience with websites and search.
