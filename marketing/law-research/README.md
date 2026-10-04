# Top-ranking law firm websites: what they're built with (October 4, 2026)

Internal research for SaySites. The public article
(saysites.com/blog/we-tested-top-ranking-law-firm-websites) uses only the
aggregate numbers below. It never names a firm or a vendor.

## How the sample was built

- 25 Google searches of the form "<practice> lawyer <city>", covering 10 practice areas and 20 US metros.
- Directories (Super Lawyers, Justia and FindLaw listings, Avvo, Yelp, Martindale) and duplicate domains were dropped. That left 135 firms.
- 105 homepages were fetched and fingerprinted. 30 were blocked by bot protection and are recorded as failures.
- Everything comes from the raw HTML and headers. Tools loaded later through a tag manager aren't seen, so the chat and call-tracking numbers are lower bounds.
- 10 sites were run through mobile Lighthouse.

Files: `firms.json`, `results.json` (per-site evidence), `stats.json`, `lighthouse.json`, `pricing.json`, plus the scripts used.

## Key numbers (n=105)

**Platform and vendors**
- WordPress: 78%.
- One legal directory company's own platform: 10%.
- Everything else: under 2% each.
- Only 40% credit any marketing vendor. Apart from the directory company, no single vendor appears on more than 5%.

**Page weight and tracking**
- HTML: median 201 KB. Script tags: median 45, and 35% have 50 or more.
- Google Tag Manager: 64%.
- Retired Universal Analytics tags still present: 16%.
- Call tracking visible in the HTML: 25%.
- Chat visible in the HTML: 10%.

**Structured data**
- Any structured data: 96%.
- Broken JSON-LD: 8 sites.
- Attorney markup: 7%. FAQPage: 14%.
- No legal or local business type at all: 32%.

**Lead capture and on-page basics**
- Contact form in the HTML: 74%.
- No form, no chat and no script-loaded form: 19%.
- Click-to-call link: 92%.
- Missing image alt text: 22% of sites.
- Not exactly one H1: 17% (6% have none, 11% have several).

**Lighthouse, mobile (n=10)**
- Median performance score: 52.
- Median main content shown (LCP): 9.6 s. Over 2.5 s on 9 of 10 sites, over 4 s on 8 of 10.
- Median Total Blocking Time: 571 ms.
- Median page weight: 2.2 MB.
- Colour contrast failures: 7 of 10.

**SaySites, same Lighthouse mobile test**
- Example law sites Calder & Vane and Ashgrove Defense: performance 100, LCP 1.2 s, 83–105 KB.
- These were run on our own test server, not over the internet, so they aren't a perfect like-for-like.

## Published pricing (from each vendor's own site, October 4, 2026)

- One directory company: law firm websites "starting at $82.50/month" when paid annually.
- One agency: "Simple Websites start at $2,950", "Guided $7,500", "Custom $17,500".
- Most large vendors don't publish website prices.

See `pricing.json` for the URLs and quotes.

## Not done on purpose

**Review markup for a firm's own testimonials.** Google treats reviews a business hosts about itself as "self-serving" and doesn't show review rich results for LocalBusiness or Organization. So SaySites shows testimonials as text and doesn't mark them up.
