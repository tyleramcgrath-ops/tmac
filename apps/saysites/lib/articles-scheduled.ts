// Articles written ahead, one per day. Each stays hidden until its
// `published` day (publishedArticles filters by date), so a week goes out
// one a day with a single deploy. Same rules as lib/articles: every outside
// fact links to its source, no invented numbers, no promises of rankings,
// no competitors named. Byline "SaySites".

import type { Article } from './articles'

const LOCAL_RANKING = 'https://support.google.com/business/answer/7091'
const REVIEW_TIPS = 'https://support.google.com/business/answer/3474122'
const MAPS_POLICY = 'https://support.google.com/contributionpolicy/answer/7400114'
const SERVICE_AREAS = 'https://support.google.com/business/answer/9157481'
const GBP_GUIDELINES = 'https://support.google.com/business/answer/3038177'
const TITLE_LINKS = 'https://developers.google.com/search/docs/appearance/title-link'
const SNIPPETS = 'https://developers.google.com/search/docs/appearance/snippet'
const WEB_VITALS = 'https://web.dev/articles/vitals'
const HELPFUL = 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'
const PAGESPEED = 'https://pagespeed.web.dev/'
const SPAM = 'https://developers.google.com/search/docs/essentials/spam-policies'
const HREFLANG = 'https://developers.google.com/search/docs/specialty/international/localized-versions'
const LOCAL_SD = 'https://developers.google.com/search/docs/appearance/structured-data/local-business'
const ADA_WEB = 'https://www.ada.gov/resources/web-guidance/'
const SCHEMA_DENTIST = 'https://schema.org/Dentist'
const FB_FILING = 'https://www.floridabar.org/ethics/etad/advertising-filing-requirements/'
const FB_RULES = 'https://www.floridabar.org/rules/rrtfb/'
const FB_CERT = 'https://www.floridabar.org/about/cert/resources/talking-points-for-promoting-board-certification/'
const CENSUS_MIAMI = 'https://www.census.gov/quickfacts/miamidadecountyflorida'
const CENSUS_HARRIS = 'https://www.census.gov/quickfacts/harriscountytexas'
const TX_NAMES = 'https://www.law.cornell.edu/regulations/texas/22-Tex-Admin-Code-SS-108-52'
const TX_SPECIALTY = 'https://www.law.cornell.edu/regulations/texas/22-Tex-Admin-Code-SS-108-54'
const TX_GENERAL = 'https://www.law.cornell.edu/regulations/texas/22-Tex-Admin-Code-SS-108-55'
const TX_MISLEADING = 'https://www.law.cornell.edu/regulations/texas/22-Tex-Admin-Code-SS-108-57'
const TX_WEBSITE = 'https://www.law.cornell.edu/regulations/texas/22-Tex-Admin-Code-SS-108-59'
const TX_RECORDS = 'https://www.law.cornell.edu/regulations/texas/22-Tex-Admin-Code-SS-108-60'

const NY_ORDER = 'https://www.nycourts.gov/LegacyPDFS/RULES/jointappellate/Signed%20Letter%20to%20DOS-Joint%20Order.pdf'
const NY_75 = 'https://www.nycourts.gov/LegacyPDFS/RULES/jointappellate/Joint%20Order%20Rule%207.5.pdf'
const NYSBA_AMEND = 'https://nysba.org/amendments-adopted-to-advertising-rules/'
const NYSBA_PDF = 'https://nysba.org/wp-content/uploads/2026/08/The-Amendments-to-the-Advertising-Rules.pdf'
const NY_CIVIL = 'https://www.nycourts.gov/new-york-city-civil-court/nyc-civil-courts-county'
const NY_COURTS = 'https://www.nycourts.gov/CTAPPs/outline.htm'
const CENSUS_NYC = 'https://www.census.gov/quickfacts/fact/table/newyorkcitynewyork/PST045225'
const GOOGLE_AI = 'https://developers.google.com/search/docs/appearance/ai-features'
const ARS_1124 = 'https://www.azleg.gov/ars/32/01124.htm'
const ROC_ADS = 'https://roc.az.gov/news/changes-arizona-law-regarding-advertising-requirements-contractors'
const ROC_HOME = 'https://roc.az.gov/'
const AZ_RES = 'https://www.law.cornell.edu/regulations/arizona/Ariz-Admin-Code-SS-R4-9-103'
const AZ_COM = 'https://www.law.cornell.edu/regulations/arizona/Ariz-Admin-Code-SS-R4-9-102'
const AZ_DUAL = 'https://www.law.cornell.edu/regulations/arizona/Ariz-Admin-Code-SS-R4-9-104'
const NWS_PHX = 'https://www.weather.gov/psr/ExtremeTemps'
const CENSUS_PHX = 'https://www.census.gov/quickfacts/fact/table/phoenixcityarizona,maricopacountyarizona/PST045225'
const PHX_COOLING = 'https://www.phoenix.gov/content/dam/phoenix/heatsite/documents/6-3-22%20Cooling%20Ordinance%20Flyer%20English%20and%20Spanish_-combined.pdf'
const SCHEMA_HVAC = 'https://schema.org/HVACBusiness'

export const SCHEDULED_ARTICLES: Article[] = [
  {
    slug: 'new-york-law-firm-website-rules',
    title: 'New York Law Firm Websites After the 2026 Ad Rule Changes',
    description: 'New York rewrote its lawyer ad rules on June 1, 2026. What a NYC law firm website must still show, what it can drop, and how to build one that gets calls.',
    kind: 'guide',
    summary: [
      'Since June 1, 2026, New York’s Rule 7.1 is short: no false or misleading statements, and every communication names a responsible lawyer or firm with contact information.',
      'The “Attorney Advertising” home page label, the 90-day website archive and the required “Prior results” disclaimer are gone from the rule text.',
      'Calling yourself a certified specialist still requires an approved certifier, named on the page. Rule 7.5 still bans misleading firm, trade and domain names.',
      'In New York City, clients search by borough and often in a language other than English, so the site should be built around how they actually look for help.',
    ],
    hero: { src: 'https://images.unsplash.com/photo-1688166871073-9550aeef89e5?auto=format&fit=crop&w=1600&h=1067&q=75', alt: 'Columned neoclassical courthouse facing a paved plaza in New York, with a tall tower behind it under a blue sky' },
    body: `A New York law firm website in 2026 has fewer mandatory parts than it did a year ago. Since June 1, 2026, New York’s advertising rule asks for two things above all: never make a false or misleading statement about your firm, and include the name and contact information of at least one lawyer or firm responsible for the content. The old requirements to label your home page “Attorney Advertising”, to save a copy of your site every 90 days and to attach a fixed disclaimer to past results are no longer in the rule. What hasn’t changed is what wins clients in New York City: pages that speak to the borough, the court and the language your clients actually use.

This guide walks through what the new rules say, what to keep anyway, and how to plan a site for a firm practicing in the five boroughs. It is general information for marketing decisions, not legal advice. For a question about your own content, ask your ethics counsel or the [NYSBA ethics resources](${NYSBA_AMEND}).

## What changed in New York’s attorney advertising rules on June 1, 2026?

The four Departments of the Appellate Division signed a Joint Order on May 27, 2026, that replaced Rules 7.1 and 7.3 of the Rules of Professional Conduct, removed Rule 7.4 and deleted the definitions of “advertisement” and “computer-accessed communication” from Rule 1.0, all effective June 1, 2026 ([Joint Order of the Appellate Division](${NY_ORDER})). The New York State Bar Association describes the new rules as essentially adopting the American Bar Association’s 2018 model advertising rules and comments, while keeping New York’s own Rule 7.5 on firm names ([NYSBA: Amendments adopted to advertising rules](${NYSBA_AMEND})).

For a website, these are the changes that matter most:

- **One standard for everything you say.** The new Rule 7.1(a) bars any false or misleading communication about a lawyer or the lawyer’s services. A statement is misleading if it misstates a material fact or law, or leaves out a fact needed to keep the whole statement from being materially misleading.
- **No home page label.** The old Rule 7.1(f) required most advertisements, including a firm’s website, to carry the words “Attorney Advertising”, on the home page for a site. That paragraph was deleted.
- **No 90-day archive.** The old Rule 7.1(k) required firms to preserve a copy of their website at launch, at each major redesign and at least every 90 days. That paragraph was deleted too.
- **No mandatory results disclaimer.** Results, comparisons and client testimonials used to need the line “Prior results do not guarantee a similar outcome”. The new rule doesn’t require it.
- **A simpler contact rule.** The old rule wanted the name, principal office address and phone number on every ad. New Rule 7.1(d) asks for the name and contact information of at least one responsible lawyer or firm.
- **Specialty claims moved.** The subject of old Rule 7.4 now sits in Rule 7.1(c).

## What does a New York law firm website still have to get right?

Fewer checkboxes doesn’t mean fewer risks. A short rule built around “false or misleading” puts more weight on judgment, and that judgment is applied to every page, every bio and every result you publish.

### Truthful statements, page by page

Rule 7.1(a) covers the whole site: the home page headline, practice area pages, attorney bios, blog posts and even the text of your Google ads that point to it. Watch for statements that are literally true but leave a false impression. A settlement figure shown without saying it was split among many plaintiffs, or a “recovered millions” banner from a firm whose results came mostly from one lawyer who has since left, are the kind of omissions the rule now targets directly.

### A responsible lawyer or firm, with a way to reach them

Under Rule 7.1(d), any communication about your services must name at least one responsible lawyer or firm, with contact information. According to NYSBA’s summary of the amendments, Comment [10] says contact information should always include a telephone number or a physical office address, and may add a website or email ([NYSBA: The amendments to the advertising rules](${NYSBA_PDF})). On a website the simplest way to meet this everywhere is a footer on every page with the firm name, a phone number and an office address.

### Certified specialist claims

Rule 7.1(c) says you may not state or imply that a lawyer is certified as a specialist unless the certifying organization is approved by an appropriate state authority or accredited by the ABA, and the organization is clearly named in the communication ([Joint Order](${NY_ORDER})). NYSBA’s summary adds that the comments now allow a lawyer to say they concentrate in, specialize in or are a specialist in a field based on experience, training or education, so long as the claim isn’t false or misleading ([NYSBA](${NYSBA_PDF})). In practice: “Board certified in civil trial advocacy by [the named organization]” needs the organization on the page. “Focused on landlord-tenant cases since 2011” needs to be true.

### Firm names and domain names

New York kept Rule 7.5. Since its 2020 amendment, a firm in private practice may not use a false, deceptive or misleading trade name or domain name, may not put “non-profit” or “not-for-profit” in a firm name, trade name or domain name unless the firm qualifies, and may not include a nonlawyer’s name in the firm name ([Joint Order amending Rule 7.5](${NY_75})). A domain like a borough name plus “injury help” can be fine; one that suggests a guaranteed outcome, a government office or a legal aid organization invites trouble.

### Solicitation is a separate question

New Rule 7.3 bars soliciting professional employment by live person-to-person contact for pecuniary gain, with exceptions for other lawyers, people with a family, close personal or prior professional relationship, and people who routinely use that type of legal service for business ([Joint Order](${NY_ORDER})). A website that people find on their own is generally not solicitation. Outbound messages to specific people about a specific matter are, so check them against Rule 7.3 before they go out.

## Should you keep the old labels and disclaimers anyway?

Mostly, yes, as a judgment call rather than a rule. Here is how we would think about each one:

1. **“Attorney Advertising” on the home page.** No longer required by New York’s rule. If your firm also advertises to clients in other states, check those states’ own rules before removing it, because each state sets its own requirements.
2. **“Prior results do not guarantee a similar outcome.”** NYSBA’s summary suggests lawyers may still want to use it, to avoid a charge that results are misleading because every case’s facts differ ([NYSBA](${NYSBA_PDF})). A short line next to each result costs nothing and gives readers context they deserve.
3. **Archiving your site.** The 90-day rule is gone, but a dated copy of what your site said is still the best answer if a former client or a grievance committee ever questions a page. A monthly export or a saved copy at every redesign is cheap insurance.
4. **Testimonials from clients with open matters.** The old rule required written informed consent for those. Even without that line in the rule, get permission in writing before quoting any client, and never edit their words into something they didn’t say.

If you’re not sure your current site was updated after June 1, now is a good moment to look. You can [send it to us for a free redesign](/redesign) and compare it page by page against this list.

![Manhattan street lined with cast-iron buildings and fire escapes, seen from a crosswalk with traffic in the distance](https://images.unsplash.com/photo-1750635323790-74b727343a77?auto=format&fit=crop&w=1200&q=75)

## How do New Yorkers search for a lawyer?

A firm in Manhattan and a firm in Queens might practice the same law and still need very different websites, because their clients look for help differently.

### By borough, and by county name

New York City is five counties, and the courts are organized by them. The Civil Court and Housing Court have branches in the Bronx, Kings County (Brooklyn), New York County (Manhattan), Queens and Richmond County (Staten Island) ([NYC Civil Courts by county](${NY_CIVIL})). Clients search with the name they use day to day, like “Brooklyn landlord tenant lawyer”, while court papers say “Kings County”. A good practice area page uses both, naturally: where the case will be heard, by its official name, and the neighborhood words clients recognize.

### With confusion about which court is which

In New York, the Supreme Court is a trial court that sits statewide, and the Court of Appeals is the state’s highest court ([New York court system outline](${NY_COURTS})). Almost every new client from outside the legal world assumes the opposite. A page that explains, in two sentences, which court their divorce, injury case or estate will be in, and what happens there first, answers a real question and is exactly the kind of passage an AI answer can quote.

### In more than one language

Census Bureau figures for New York City show 47.7% of residents age 5 and older speak a language other than English at home, and 36.6% were born outside the United States (2020 to 2024 estimates) ([Census QuickFacts, New York City](${CENSUS_NYC})). If your intake team takes calls in Spanish, Chinese, Russian or Haitian Creole, the site should say so plainly, with real translated pages for your main practice areas, reviewed by a fluent speaker. Google explains how to link language versions of a page so the right one appears for each searcher ([localized versions](${HREFLANG})). Only list a language if someone at the firm can actually serve a client in it.

## Google Business Profile for New York City firms

Your Business Profile often shows before your website does, so it has to match the site and follow Google’s rules. Three of those rules come up constantly in New York:

- **Shared offices and coworking.** Google says a business can’t list an office at a coworking space unless the office has clear signage, receives customers there during business hours and is staffed by your staff during those hours ([Business Profile guidelines](${GBP_GUIDELINES})). Many solo and small firms in Manhattan rent shared space, so check this before creating a profile for it.
- **Individual lawyers.** Google allows profiles for individual practitioners. If several lawyers practice at one office, the firm gets its own profile for that location, and each lawyer’s profile uses only the lawyer’s name ([same guidelines](${GBP_GUIDELINES})). A lawyer shouldn’t have several profiles for different practice areas.
- **Your real name only.** The profile name is your firm’s real name, without extra keywords like “Best Brooklyn Divorce Lawyer”.

Google also lists relevance, distance and prominence as the main factors for local results ([how Google ranks local results](${LOCAL_RANKING})). Distance matters a lot in a city this dense, which is one more reason to describe each real office honestly rather than pretending to be everywhere. We explain the rest of that system in [how Google decides which local businesses to show](/blog/how-google-picks-local-businesses).

## Which pages should a NYC law firm website have?

Build around how a worried person moves through the site. For most small and mid-size New York firms that means:

- **A home page** that says in one sentence what you do, where and for whom, with a phone number one tap away.
- **One page per practice area,** each answering the questions you hear on intake calls: what it costs, how long it takes, which court, what to bring.
- **One page per real office,** with its address, the courts nearby and how to get there by subway or car. Not a page for every neighborhood you would like to rank in.
- **Attorney bios** with admissions, education, languages and the kinds of matters each lawyer handles, plus any certification with the certifier named.
- **Results and testimonials,** only ones you can support, with context and client permission.
- **A consultation request** on every page that tells people not to send confidential details yet.

That office rule deserves emphasis. Google’s spam policies list “multiple domain names or pages targeted at specific regions or cities that funnel users to one page” as doorway abuse ([spam policies](${SPAM})). Thirty near-identical pages for thirty neighborhoods is the pattern they describe. One strong page for your Brooklyn office, with real detail about the cases you handle there, is worth more than all of them.

![Man in a gray suit and glasses writing at an office desk while a colleague stands in the background](https://images.unsplash.com/photo-1787532378729-fe4241197405?auto=format&fit=crop&w=1200&q=75)

## Writing for AI answers without changing your ethics

AI Overviews and AI assistants now answer many legal questions before anyone clicks. Google says its AI features draw on the same index as regular search, with no special markup needed ([AI features and your website](${GOOGLE_AI})). For a New York firm that means the same habits that satisfy Rule 7.1 also make pages quotable: plain answers, specific facts, and nothing exaggerated. A sentence like “In New York, divorces are decided in Supreme Court, the state’s main trial court, not in Family Court” is useful to a reader and easy to cite, as long as every such statement is accurate and current. A paragraph of adjectives isn’t. Our guide to [Google AI Overviews for law firms](/blog/google-ai-overviews-for-law-firms) goes deeper.

Two cautions specific to the new rule. First, if your marketing team uses AI tools to draft pages, a lawyer still has to read every claim, because a confident made-up statistic is exactly the material misrepresentation Rule 7.1(a) prohibits. Second, keep structured data (the code that describes your firm to search engines) limited to what the page actually shows. Google’s own guidelines require that, and it matches the rule’s spirit.

![Rows of numbered red and black law reporter volumes behind glass in a wooden bookcase, with a fern in front](https://images.unsplash.com/photo-1769092992534-f2d0210162b9?auto=format&fit=crop&w=1200&q=75)

## A checklist for your New York site after June 1, 2026

Work through this with whoever approves your marketing. It usually takes an afternoon.

1. Every page shows the firm name and at least one responsible lawyer or the firm, with a phone number or office address.
2. Every result, ranking, award and comparison can be supported today, with context about what made the case different.
3. Testimonials are real, unpaid or disclosed as paid, and approved in writing by the client.
4. Any “certified specialist” wording names the certifying organization. Other specialty wording is accurate.
5. The firm name, trade name and domain name aren’t misleading and don’t suggest a nonprofit or government office.
6. You’ve decided, deliberately, whether to keep the “Attorney Advertising” label and the results disclaimer, and checked the rules of any other state you advertise in.
7. Practice area pages name the right court and county and explain the first steps plainly.
8. Translated pages exist only for languages your team actually serves, and each links to its English version.
9. Each office page matches its Google Business Profile exactly, and shared space meets Google’s staffing rules.
10. No near-duplicate neighborhood pages.
11. A dated copy of the site is saved before and after every major change.

## Where SaySites fits

SaySites builds law firm sites around this structure: a page for each practice area, attorney profiles, a consultation request on every page, and intake questions that include the other party’s name for a conflict check. Each firm is described to search engines as a LegalService, each attorney and practice area gets its own structured data, and every page has to pass a 95+ speed check before it can go live. Nothing is invented. Results, reviews and credentials appear only if you give them to us, and you can change any of it by describing the change in plain words.

The Law Firm Starter plan is $79 a month ([law firm websites](/websites-for/law-firms), [all plans and pricing](/pricing)). If your site still has pre-June wording or simply looks dated, [get a free redesign](/redesign) of your current site and see it rebuilt for 2026. Or [start a 7-day free trial](/signup) and build your own. If your firm also practices in Florida, read our guide to [Florida law firm websites and the Bar’s rules](/blog/law-firm-website-design-florida), and for a look at what top-ranking firm sites get wrong, see [what we found testing 105 of them](/blog/we-tested-top-ranking-law-firm-websites).`,
    faq: [
      { q: 'Does a New York law firm website still need the “Attorney Advertising” label?', a: 'Not under New York’s rule. The old Rule 7.1(f), which required the label on a website’s home page, was deleted when the amendments took effect on June 1, 2026. Some firms keep it anyway, and firms that advertise to clients in other states should check those states’ rules first, since each state sets its own requirements.' },
      { q: 'Do I still have to archive my website every 90 days in New York?', a: 'No. The old Rule 7.1(k) required a saved copy at launch, after major redesigns and at least every 90 days, and that paragraph was removed effective June 1, 2026. Keeping a dated copy whenever the site changes is still sensible, because it shows exactly what you published if a page is ever questioned.' },
      { q: 'Can I post case results on my New York law firm website?', a: 'Yes, as long as they aren’t false or misleading under the new Rule 7.1(a). A result can mislead if it leaves out important context, such as a recovery shared by many clients or a case with unusual facts. NYSBA’s summary suggests considering the line “Prior results do not guarantee a similar outcome” even though the rule no longer requires it.' },
      { q: 'Can a New York lawyer call themselves a specialist online?', a: 'Claiming to be certified as a specialist requires certification by an organization approved by a state authority or accredited by the ABA, and the organization must be named. NYSBA’s summary of the comments says uncertified lawyers may describe a specialty or concentration based on experience, training or education, as long as the claim is accurate.' },
      { q: 'What contact details must a New York law firm website show?', a: 'New Rule 7.1(d) requires the name and contact information of at least one lawyer or firm responsible for the content. According to NYSBA’s summary, the comments say this should always include a phone number or a physical office address. A footer on every page with the firm name, phone and address covers it.' },
      { q: 'Should a NYC law firm have a page for every borough?', a: 'Only for boroughs where you have a real office or a real, distinct practice. Google’s spam policies treat many near-identical city or area pages that funnel visitors to one place as doorway abuse. One detailed page per real office, naming the local courts and how clients reach you, serves people better than thin copies.' },
      { q: 'Can my New York firm list a coworking office on Google?', a: 'Google allows it only if the office has clear signage, receives clients there during business hours and is staffed by your own staff during those hours. If you only use the space occasionally or for mail, it doesn’t qualify. Your website and your Business Profile should show the same real office details.' },
    ],
    about: ['New York Rules of Professional Conduct', 'Attorney advertising', 'Law firm websites', 'New York City'],
    published: '2026-10-12',
    status: 'published',
  },
  {
    slug: 'phoenix-hvac-website-design',
    title: 'Phoenix HVAC Website Design: ROC Rules to Heat-Season Calls',
    description: 'What an HVAC company website in Phoenix must show under Arizona ROC rules, and how to build one that answers no-cool calls, renters and Spanish speakers.',
    kind: 'guide',
    summary: [
      'Arizona law puts your ROC license number on your advertising; online ads can skip it only if they link to a home page that shows your name and license number prominently, and not just in the footer.',
      'Phoenix averages 111 days a year at 100°F or hotter (1991 to 2020), so the site has to work for someone on a phone with a dead AC, day or night, well into October.',
      'Renters are a real audience: Phoenix requires rental air conditioning to cool to 82°F, or 86°F with an evaporative cooler.',
      'Real Spanish pages, honest service-area pages and HVACBusiness structured data round out a site built for the Valley.',
    ],
    hero: { src: 'https://images.unsplash.com/photo-1729041534038-fdc1f9cf3d3a?auto=format&fit=crop&w=1600&q=75', alt: 'Aerial view of downtown Phoenix high-rises glowing at sunset, with a long avenue and distant desert mountains' },
    body: `An HVAC company website in Phoenix has one legal must and one practical must. The legal one: Arizona requires your ROC license number on your advertising, and your online ads can leave it out only if they link to a website whose home page shows your business name and license number prominently, not tucked into the footer. The practical one: when it is 112°F and the air conditioner stops, a homeowner or renter picks up a phone and calls whoever makes it easiest. Everything else on the site, from service pages to Spanish translations, should serve that call.

This guide covers both, with the Arizona rules and the local facts linked to their sources, and a checklist at the end. It is general information, not legal advice; for a question about your own license or ads, the Registrar of Contractors is the authority.

## What does Arizona law require on an HVAC contractor’s website?

Arizona Revised Statutes section 32-1124 says the license number must be preceded by the letters “ROC” and must appear in specific places: at any job site, on all written bids and estimates, on published advertising, letterheads and documents you use with customers, and on broadcast, internet or billboard advertising ([A.R.S. § 32-1124](${ARS_1124})).

That last item has an exception that matters for your website. Broadcast, internet and billboard ads can leave the number off if they include a web address that links directly to a site that prominently displays your name and license number. The Registrar explained the change when it took effect on September 29, 2021, and spelled out what “prominently displayed” means ([Arizona ROC on the advertising change](${ROC_ADS})):

- the web address in the ad links directly to your home page;
- your name and ROC license number appear directly on the home page;
- they are clearly visible, not hidden behind graphics, photos or other obstructions;
- they are in an appropriately sized font; and
- they are **not in the website’s footer.**

That last point catches a lot of contractor sites, where the license number lives in small print at the bottom of the page. If your truck wraps, radio spots, search ads or billboards show your web address without the number, the home page has to carry it near the top, in readable type. A short line under your phone number, like “ROC 123456, licensed, bonded and insured”, does the job (with your real number, and only the claims that are true).

The Registrar’s notice adds two reminders. Bids, contracts, estimates and documents sent to customers still need the license number, whatever your ads do. And an unlicensed business must include the exact phrase “Not a Licensed Contractor” in all of its advertising ([Arizona ROC](${ROC_ADS})).

## Which license classifications should the site name?

Customers can’t tell an R-39 from a C-39, but naming yours accurately helps them, and it keeps you honest about the work you take on. Arizona’s rules define the residential air conditioning classification, R-39, as allowing installation and repair of comfort air conditioning, including refrigeration, evaporative cooling, ventilation and heating ([A.A.C. R4-9-103](${AZ_RES})). The commercial C-39 classification covers refrigeration and evaporative cooling systems, heating systems and ventilation, including duct work and controls ([A.A.C. R4-9-102](${AZ_COM})). Dual licenses that cover both are described in a separate rule ([A.A.C. R4-9-104](${AZ_DUAL})).

On the site, a simple “Licenses” line on the about page works: each license number, its classification in plain words (“residential heating and air”) and a link to the Registrar’s site, where anyone can look a contractor up ([roc.az.gov](${ROC_HOME})). The Registrar itself tells homeowners to check a license before hiring, so making that check easy is a small trust signal that costs nothing.

![Outdoor air conditioner condenser unit on the ground beside a teal metal shutter, with palm-leaf shadows in sunlight](https://images.unsplash.com/photo-1724488751821-1415f5cf4960?auto=format&fit=crop&w=1200&q=75)

## Why HVAC searches in Phoenix are different

Most HVAC websites are written for a market with two busy seasons. Phoenix has one very long one. National Weather Service records for Phoenix show ([NWS Phoenix extreme temperatures](${NWS_PHX})):

- an average of 111 days a year at 100°F or hotter over 1991 to 2020;
- a record 70 days at 110°F or hotter in 2024;
- the longest run of 100°F days on record, 113 days from May 27 to September 16, 2024;
- and the latest 110°F day on record, October 7, 2024.

For a website, that translates into a few concrete choices:

1. **The phone number is the main feature.** Put it at the top of every page as a tap-to-call link, and repeat it after each section of a service page. Someone sweating in a 95°F living room won’t hunt for it.
2. **Say when you answer.** If you take after-hours or weekend calls, say so near the top, with the hours. If you don’t, say that too, and tell people what happens to a message left overnight.
3. **Answer the first questions on the page.** Is there a service call fee? How soon can someone come out? What can they check before calling, like the thermostat setting, the breaker or a clogged filter? Clear answers reduce wasted trips and build trust.
4. **Load fast on a phone.** A page that takes ten seconds over a weak signal loses the caller to the next result. Google’s Core Web Vitals give you a way to measure this, and [PageSpeed Insights](${PAGESPEED}) will test any page.
5. **Keep the season going into fall.** Since 110°F days have reached into October, pages promoting tune-ups or replacements shouldn’t switch to heating talk on September 1.

## Renters and landlords: a real Phoenix audience

A large share of Phoenix calls come from people who don’t own the system. Census Bureau figures put the owner-occupied rate in Phoenix at 57.3% for 2020 to 2024, which leaves a lot of renters in the city ([Census QuickFacts, Phoenix](${CENSUS_PHX})). And Phoenix has a rule that shapes those calls.

The City of Phoenix cooling ordinance, in City Code Chapter 39-5, requires every rental unit with cooling installed to be able to cool habitable rooms and bathrooms to no more than 82°F with air conditioning, or 86°F with evaporative cooling, measured three feet above the floor in the center of the room ([City of Phoenix cooling ordinance flyer](${PHX_COOLING})). The city publishes the flyer in English and Spanish and runs a landlord and tenant program for questions.

That gives an HVAC company two useful pages to write:

- **For property managers and landlords:** how you handle rental calls, who you bill, how you coordinate access with tenants, and maintenance plans for multiple units.
- **For renters:** what to tell the landlord, that the landlord usually arranges the repair, and a link to the city’s own explanation rather than your interpretation of it. You’re not giving legal advice, just pointing people to the source.

On your request form, ask whether the person owns or rents the property. It saves a phone call and routes the job to the right person from the start.

## Do you need Spanish pages for a Phoenix HVAC site?

For most Phoenix contractors, yes, if someone on your team can take the call. The Census Bureau counts 42.0% of Phoenix residents as Hispanic or Latino, and 35.9% of residents age 5 and older speak a language other than English at home (2020 to 2024 estimates) ([Census QuickFacts, Phoenix](${CENSUS_PHX})). In Maricopa County as a whole, 26.0% speak a language other than English at home.

A good Spanish section is not a translation widget. It’s a few real pages, starting with the home page, AC repair and contact, written or reviewed by a fluent speaker, with the same ROC license line and the same honest claims as the English pages. Link each Spanish page to its English version so Google can show the right one to each searcher ([localized versions](${HREFLANG})). And only say “Hablamos español” if a Spanish speaker actually answers the phone or calls back.

![Aerial view of a sprawling Phoenix suburban neighborhood of tile-roofed homes and trees, mountains on the horizon](https://images.unsplash.com/photo-1785183086929-61e343715643?auto=format&fit=crop&w=1200&q=75)

## How do you cover the whole Valley without doorway pages?

Maricopa County had an estimated 4,689,558 residents in July 2025, spread across Phoenix and many neighboring cities ([Census QuickFacts](${CENSUS_PHX})). It’s tempting to make a page for every one of them, with the city name swapped in. Google’s spam policies describe exactly that as doorway abuse: “multiple domain names or pages targeted at specific regions or cities that funnel users to one page” ([spam policies](${SPAM})).

A better structure:

- **One service-area page** that lists the cities and neighborhoods you really cover, with a map or plain description of the boundaries and any trip charge for distant areas.
- **A separate city page only when there’s something real to say:** a second shop, a crew based there, or genuinely different conditions you can describe.
- **A Google Business Profile set up as a service-area business** if customers don’t come to your shop. Google lets you hide your address and list the areas you serve instead ([service areas on Google](${SERVICE_AREAS})). We cover that setup step by step in [how to show Google where you work](/blog/service-area-business-google).

## Which pages should a Phoenix HVAC website have?

Each page should match a different kind of search. For a typical Valley contractor:

- **Home:** what you do, the areas you serve, the phone number and the ROC license line at the top.
- **AC repair:** the emergency page. Hours, how fast you usually respond, the fee for a service call if you publish one, and what to check first.
- **AC replacement and installation:** how you size a system, the brands or equipment types you install, financing if you offer it, and how long an install takes.
- **Heat pumps:** many Valley homes heat and cool with one, so it deserves its own page.
- **Evaporative coolers:** if you service them, say so. Both Arizona classifications above include evaporative cooling, and plenty of homeowners still search for it.
- **Maintenance plans:** what a spring tune-up includes before the heat, what a fall visit includes, and how to sign up.
- **Rental and property management:** see the section above.
- **About and licenses:** owners, years in business, license numbers, the crew if they agree to appear.
- **Reviews:** link to your Google reviews, and quote real customers only with their permission. Our guide on [asking for Google reviews the right way](/blog/ask-for-google-reviews-the-right-way) explains what Google allows.
- **Contact and request form:** short, with how soon they need you, the ZIP code and whether they own or rent.

Utility rebates and manufacturer promotions can go on the replacement page, but only with current details and a link to the program’s own page. An expired rebate on your site is worse than none.

![White digital thermostat with a gray display screen mounted on a beige interior wall](https://images.unsplash.com/photo-1619140099965-06d74aaf51fa?auto=format&fit=crop&w=1200&q=75)

## Structured data for an HVAC company

Structured data is code that describes your business to search engines in a standard format. Schema.org has a specific type for heating and air contractors, HVACBusiness ([schema.org/HVACBusiness](${SCHEMA_HVAC})), and Google’s local business documentation lists the properties it reads, like name, address, phone, hours and areas served ([local business structured data](${LOCAL_SD})). Keep it identical to what the page shows and to your Business Profile. If the markup says you open at 7 and the page says 8, you’ve given search engines two answers.

## A checklist before your Phoenix HVAC site goes live

1. Business name and “ROC” license number on the home page, near the top, readable, not only in the footer.
2. License numbers and classifications listed on the about page, with a link to the Registrar’s lookup.
3. Tap-to-call phone number at the top of every page, with the hours you answer.
4. AC repair page that answers fees, response time and quick checks in plain words.
5. Separate pages for repair, replacement, heat pumps, evaporative coolers and maintenance plans, as they apply to you.
6. A page for landlords and property managers, and a request form that asks own or rent.
7. Spanish pages only if your team serves Spanish speakers, each linked to its English version.
8. One honest service-area page; city pages only where you have something real to say.
9. Business Profile set up correctly as a storefront or service-area business, matching the site exactly.
10. HVACBusiness structured data that matches the page.
11. Every rebate, financing offer and review on the site is current and real.
12. The home page passes a mobile speed test.

## Where SaySites fits

SaySites builds HVAC websites with this structure from the start: a page for each service, a service-area page, a tap-to-call number and a request form on every page. Each site is described to search engines as an HVACBusiness, and every page must pass a 95+ speed check before it goes live. The job request form can ask how soon the customer needs you, the ZIP code of the job and whether they own or rent, and every request lands in a leads pipeline where you can call, text, take notes and track it to a booked job. You make changes by saying them in plain words, like “put our ROC number under the phone number on the home page”, and see each one as a draft before it goes live.

The Site plan is $15 a month, with hosting and your own domain included ([websites for HVAC companies](/websites-for/hvac-companies), [pricing](/pricing)). Want to see your current site rebuilt first? [Get a free redesign](/redesign). Or [start a 7-day free trial](/signup) and build it yourself before the next heat wave. For more on getting found locally, read [how Google decides which local businesses to show](/blog/how-google-picks-local-businesses).`,
    faq: [
      { q: 'Does my ROC license number have to be on my HVAC website?', a: 'If your internet, radio, TV, vehicle or billboard ads show your web address instead of your license number, yes. Arizona lets those ads skip the number only when they link directly to a home page that prominently shows your business name and ROC number. Showing it on the home page is the simplest way to stay covered.' },
      { q: 'Can the ROC license number go in my website footer?', a: 'Not if you rely on the website exception for your ads. The Registrar of Contractors says the name and license number must appear directly on the home page, be clearly visible, use an appropriately sized font and not be placed in the footer. A line near your phone number at the top of the page works well.' },
      { q: 'What should a Phoenix AC repair page include?', a: 'Your phone number at the top, the hours you answer, how quickly you usually respond, any service call fee you’re comfortable publishing, and a few checks people can try first, such as the thermostat, breaker and filter. Add the areas you cover and your ROC license number, and keep the page fast on a phone.' },
      { q: 'Do Phoenix landlords have to fix broken air conditioning?', a: 'The City of Phoenix cooling ordinance requires rental units with cooling installed to cool rooms to no more than 82°F with air conditioning or 86°F with evaporative cooling. An HVAC website can link to the city’s explanation and its landlord and tenant program, but shouldn’t give tenants legal advice of its own.' },
      { q: 'Should my Phoenix HVAC company have a Spanish website?', a: 'If someone on your team can serve customers in Spanish, real Spanish pages are worth it. Census figures show 42.0% of Phoenix residents are Hispanic or Latino and 35.9% speak a language other than English at home. Start with the home, AC repair and contact pages, reviewed by a fluent speaker.' },
      { q: 'Should I make a separate page for every Valley city I serve?', a: 'Usually not. Google treats many near-identical city pages that funnel visitors to one place as doorway abuse. One service-area page listing the cities you cover is better, with separate city pages only where you have a real local office, crew or something genuinely different to explain.' },
      { q: 'How much does an HVAC website cost with SaySites?', a: 'The Site plan is $15 a month, with hosting, your domain, a leads pipeline and SEO included, and a 7-day free trial to start. You can also send us your current website for a free redesign preview, so you can see the new version before you decide anything.' },
    ],
    about: ['HVAC contractor websites', 'Arizona Registrar of Contractors', 'Phoenix, Arizona'],
    published: '2026-10-12',
    status: 'published',
  },
  {
    slug: 'law-firm-website-design-florida',
    title: 'Law Firm Website Design in Florida: Bar Rules and SEO',
    description: 'What a Florida law firm website must say, what the Bar’s advertising rules forbid, and how to build a Miami or statewide firm site that ranks and gets calls.',
    kind: 'guide',
    hero: { src: 'https://images.unsplash.com/photo-1602792384159-e0f1e8ed0062?auto=format&fit=crop&w=1600&q=75', alt: 'Downtown Miami towers seen across the water from Brickell Key on a clear day' },
    summary: [
      'Florida law firm websites don’t have to be filed with the Bar, but every advertising rule in Subchapter 4-7 still applies to them.',
      'Each site must name a responsible lawyer or firm and the city, town or county of at least one real office.',
      'Past results, testimonials, “expert” claims and comparisons are where most Florida firm sites get into trouble.',
      'In Miami-Dade, most residents speak a language other than English at home, so a real Spanish version can matter as much as any ranking tactic.',
      'A site that ranks in Florida is one page per practice area, clear local details, fast on phones and honest about what the firm has done.',
    ],
    body: `A Florida law firm website has two jobs at once. It has to persuade a stressed person on a phone to call you instead of the next firm, and it has to do that inside some of the most detailed lawyer advertising rules in the country. Get the first part wrong and the phone doesn’t ring. Get the second part wrong and the phone call you get is from The Florida Bar.

The short answer: your website is exempt from the Bar’s filing requirement, but it is not exempt from the rules. Build it around plain facts you can prove, one page for each kind of case you handle, accurate local details and a fast, simple way to get in touch. That combination is also what Google rewards.

This guide walks through both halves for firms in Miami, Fort Lauderdale, West Palm Beach, Tampa, Orlando, Jacksonville and everywhere else in the state. It’s practical guidance, not legal advice. When a specific line on your site is a close call, the Bar’s Ethics and Advertising Department is the place to ask.

## Does a Florida law firm website have to be filed with the Bar?

No. The Bar’s own filing page says lawyer and law firm websites are exempt from filing under Rule 4-7.20(g), and that includes pop-ups on your own site ([Florida Bar advertising filing requirements](${FB_FILING})). Television, radio, print and internet ads generally do have to be filed at least 20 days before first use unless they contain only the “safe harbor” information in Rule 4-7.16, and the Bar lists a fee for each filing.

The same page makes the important point in plain terms: being exempt from filing does not exempt you from the rest of Subchapter 4-7. Your website is still lawyer advertising. The full text of the rules lives in Chapter 4 of the Rules Regulating The Florida Bar ([Rules Regulating The Florida Bar](${FB_RULES})).

That distinction matters for how firms market themselves. A paid search ad or social ad that sends people to your site may need its own filing even though the site it lands on does not. If your marketing person runs ads, make sure someone owns that question.

## What every Florida firm website has to include

The Bar’s filing page summarizes two requirements that apply to every advertisement, websites included: you must name at least one lawyer, firm or qualifying provider responsible for the content, and you must give the city, town or county of at least one bona fide office where the advertised services are actually performed ([Florida Bar advertising filing requirements](${FB_FILING})).

In practice, put both somewhere people and search engines will find them on every page, usually the footer:

- **The firm’s name and the responsible lawyer.** “Smith & Garcia, P.A.” plus a named attorney.
- **A real office location.** A street address if clients visit, or at minimum the city or county of a real office. A virtual mailbox in a city where no one works is the kind of thing this rule is aimed at.
- **The same details everywhere.** Your Google Business Profile, your site and your directory listings should match exactly. Google’s guidelines for Business Profiles also ask for a real address and accurate information ([Guidelines for representing your business on Google](${GBP_GUIDELINES})).

## The Florida rules that trip up law firm websites most

Rule 4-7.13 lists what Florida treats as deceptive or inherently misleading. Most website problems come from a handful of its categories. Here they are in plain English, with how to handle each one.

### Past results and verdicts

Florida allows past results only when they are objectively verifiable. The rule’s comment adds that results can be misleading if they’re not typical of similar cases, if they leave out that a judgment was uncontested or by default, or if they leave out that the amount was far below the client’s actual damages. Advertising a client’s result also requires that client’s informed consent, even if the case is public record ([Rules Regulating The Florida Bar](${FB_RULES})).

What that means for your site:

1. Only list results you can document with the file.
2. Get written consent from each client before their result goes up.
3. Add the context the rule asks for: was it a default, a settlement, a verdict?
4. Don’t let a “Results” page of your three biggest numbers imply that’s what every case is worth.

A results page built this way is also more persuasive. Specific, documented outcomes read as honest; a wall of large round numbers reads as advertising.

### Testimonials and reviews

Florida permits testimonials with conditions. Under the rule, a testimonial is a problem if the person isn’t qualified to judge what they’re praising, if it isn’t their actual experience, if it doesn’t reflect what the firm’s clients generally experience, if the lawyer wrote it, if it was given in exchange for something of value, or if it lacks a disclaimer that the reader may not get the same or similar results ([Rules Regulating The Florida Bar](${FB_RULES})). The comment notes that honest testimonials about things like courtesy, promptness and demeanor are fine when they come from real experience.

So: real clients, their own words, nothing paid, and a clear results disclaimer next to them. Never write or edit a review “for” a client. On Google, the same instinct keeps you on the right side of the platform’s review policies as well.

### “Expert,” “specialist” and comparisons

Rule 4-7.13 treats comparisons and characterizations of skill, experience or reputation as misleading when they can’t be objectively verified. “The best car accident lawyer in Miami” is the classic example. Statements about character, such as being honest or responsive, are allowed.

Specialization has its own path in Florida. The Bar runs a board certification program with 27 certification areas, and certified lawyers may use “Board Certified Specialist” or the letters B.C.S. with their area ([Florida Bar board certification](${FB_CERT})). If a lawyer at your firm is certified, say so on their profile and the relevant practice page, with the area named. If no one is, describe what you do and how long you’ve done it instead of reaching for “expert.”

### Guarantees, Bar approval and titles

Three smaller rules catch firms regularly:

- **No promises.** Predictions or guarantees of a result, the kind a reader could take as a promise, are prohibited. “We’ll get you the money you deserve” is close to the line. “We’ll review your case and tell you honestly what we think” is not.
- **No implied Bar endorsement.** You can say you’re licensed in Florida. You can’t suggest the Bar approved your ad or vouches for you.
- **Titles.** A former judge can mention that service after their name with a word like “former” or “retired,” not as a title in front of it.

### Search ads and look-alike contact details

One part of Rule 4-7.13 speaks directly to online marketing. It bars implying an affiliation with another lawyer or firm that doesn’t exist, including through ads triggered by a search for someone else or contact details that could steer a searcher to the wrong firm. If anyone bids on a competitor’s name for you, have that conversation now.

![An empty conference room with a long table and chairs, ready for a first consultation](https://images.unsplash.com/photo-1755551636128-2385f552d7ec?auto=format&fit=crop&w=1200&q=75)

## How Florida clients actually look for a lawyer

Rules are half the picture. The other half is how people in Florida search, and that varies more by region than most national advice admits.

### A real Spanish version, not a translate button

In Miami-Dade County, the Census Bureau reports that roughly three in four residents age 5 and over speak a language other than English at home, based on its 2020 to 2024 survey data ([U.S. Census Bureau QuickFacts, Miami-Dade County](${CENSUS_MIAMI})). For an immigration, family, personal injury or criminal defense practice in South Florida, a Spanish-speaking client who finds only English pages is a client who keeps scrolling.

If you serve Spanish-speaking clients, give them real pages: separate, properly written Spanish versions of your key practice pages, linked to their English counterparts. Google’s documentation explains how to tell it about language versions of a page so the right one shows to the right searcher ([Tell Google about localized versions of your page](${HREFLANG})). Two cautions. Only say “se habla español” if someone who answers the phone actually does. And remember the Bar’s rules apply to your Spanish pages exactly as they apply to your English ones.

### Searches are local and specific

People rarely search “lawyer.” They search “slip and fall attorney Hialeah,” “DUI lawyer Fort Lauderdale” or “divorce lawyer near me.” Google says local results come down mainly to relevance, distance and prominence ([How Google ranks local results](${LOCAL_RANKING})). Distance you can’t change. Relevance and prominence are where your website does its work:

- **One page per practice area.** A single “Practice Areas” page that lists twelve kinds of law gives Google nothing specific to rank. A full page on Florida car accident claims, with what to do after a crash and how your firm handles them, does.
- **Honest location pages.** If you have offices in Miami and Boca Raton, give each its own page with its real address, hours and directions. Don’t create pages for cities where you have no office and say nothing specific about them; Google’s spam policies call that out as doorway pages ([Google Search spam policies](${SPAM})).
- **A complete, accurate Business Profile.** Same name, address and phone as your site, the right primary category and real hours.

### Most of them are on a phone, in a hurry

Someone looking for a lawyer is often having one of the worst days of their year. They’re on a phone, maybe at a hospital or outside a courthouse. A page that takes several seconds to show anything, or hides the phone number below a slider, loses them. Google’s Core Web Vitals are a reasonable way to measure this: how fast the main content shows, how quickly the page responds and whether things jump around while it loads ([Web Vitals](${WEB_VITALS})).

## What a high-converting Florida law firm website looks like

Put the rules and the search behavior together and the shape of a good Florida firm site is fairly clear.

### The home page answers three questions in five seconds

What kind of cases do you handle, where, and how do I reach you? A headline like “Personal injury and wrongful death lawyers in Miami-Dade and Broward” beats a slogan every time. Put a tap-to-call button and a short consultation form above the fold on mobile.

### Practice area pages that actually explain things

Each page should answer the questions a client asks in a first call: Do I have a case? What happens next? How do fees work? How long does it take in Florida? Write from your real experience, link to official sources where a law or deadline matters, and keep claims inside Rule 4-7.13. Google’s guidance on helpful content asks the same questions a careful client would: is this written by someone with real expertise, and does it leave the reader better informed ([Creating helpful, reliable, people-first content](${HELPFUL})).

### Attorney profiles that build trust honestly

Photo, bar admission, education, board certification if any, the kind of cases they handle and something human. These pages are where character statements (“returns every call the same day”) belong, because those are allowed and they’re what clients care about.

### A consultation form that respects the client

Keep it short: name, phone, email, a few words about what happened. Make it clear that sending the form doesn’t create an attorney-client relationship and that they shouldn’t include confidential details yet. If you do conflict checks, ask for the other party’s name.

### Markup that tells Google what you are

Structured data describes your firm in a format search engines read: a LegalService with your name, address, phone, hours and areas served. Google’s local business documentation explains the properties it uses ([Local business structured data](${LOCAL_SD})). The rule is simple: mark up only what the page actually shows.

### Accessibility

A site people can’t use with a screen reader or keyboard loses clients and creates risk. The Department of Justice has published guidance on web accessibility under the ADA that is worth a read before you launch ([Guidance on web accessibility and the ADA](${ADA_WEB})).

![A person typing on a laptop at a desk, drafting a page for a firm website](https://images.unsplash.com/photo-1749648329134-75ed14f7dae5?auto=format&fit=crop&w=1200&q=75)

## A pre-launch checklist for Florida firms

Before a new or redesigned site goes live, walk through this list. It takes an hour and saves a lot of trouble.

1. Every page shows the firm name, a responsible lawyer and the city or county of a real office.
2. Every result on the site is documented, typical context is explained, and each client gave informed consent.
3. Every testimonial is a real client’s own words, unpaid, with a disclaimer that results vary.
4. No “best,” “top,” “#1” or “expert” claims that can’t be objectively verified. Board certification is named correctly where it exists.
5. No guarantees or promises of results, and nothing suggesting Bar approval.
6. Spanish pages, if you have them, are real translations reviewed by a fluent speaker and follow the same rules.
7. One page per practice area and per real office. No pages for cities you don’t serve from a real office.
8. Name, address and phone match your Google Business Profile exactly.
9. The site loads fast on a phone and the phone number is one tap away on every page.
10. Structured data matches what’s on the page, and the site works with a keyboard and screen reader.
11. Someone at the firm is responsible for checking whether ads pointing to the site need to be filed.

## What changes if you’re outside Miami?

The rules are statewide, so everything above applies from Pensacola to Key West. What changes is who calls you, and your site should be written for them. Look at your last fifty intake calls and ask a few questions:

- **Where do your clients live?** If many are visitors hurt while on vacation in Orlando or Tampa, your pages should explain what happens when you go home to another state before the case is over.
- **Who is making the call?** In estate planning and probate, the person searching is often an adult child, sometimes out of state. Explain the Florida process for someone who has never been through it.
- **Which language do they use?** If a third of your calls are in Spanish or Haitian Creole, your site should be too.
- **What do they ask first?** Fees, timing and whether they have a case come up in almost every first call. Answer them on the page.

The firms that do well online are usually the ones whose website sounds like their best intake call.

## Where SaySites fits

SaySites builds law firm sites around exactly this structure: a separate page for each practice area, attorney profiles, a consultation request on every page, intake questions with a conflict check and room for the attorney advertising notices your state requires. Each firm is described to Google as a LegalService, every page has to pass a speed check before it goes live, and nothing is ever invented: no results, reviews or credentials you didn’t give us. The Law Firm Starter plan is $79 a month ([see law firm plans](/websites-for/law-firms) and [pricing](/pricing)).

You stay responsible for what your site says, and that’s how it should be. What changes is that updating a bio, adding a result your client approved or fixing a disclaimer takes a sentence instead of a support ticket.

If your current site is slow, thin or out of step with the rules above, [send it to us for a free redesign](/redesign) and see what it could look like. Or [start a 7-day free trial](/signup) and build your own. For more on how search engines and AI answers pick which firms to show, read [Google AI Overviews: what law firms should know](/blog/google-ai-overviews-for-law-firms) and [what we found testing 105 top-ranking law firm websites](/blog/we-tested-top-ranking-law-firm-websites).`,
    faq: [
      { q: 'Do I have to file my law firm website with The Florida Bar?', a: 'No. Lawyer and law firm websites are exempt from the Bar’s filing requirement under Rule 4-7.20(g), including pop-ups on your own site. The exemption covers filing only. Everything else in Subchapter 4-7 still applies, so the content on your site has to follow the same advertising rules as any other lawyer advertisement in Florida.' },
      { q: 'Can I put case results on my Florida law firm website?', a: 'Yes, if they are objectively verifiable and you have the client’s informed consent, even when the case is public record. The rules also treat results as misleading if they are atypical, leave out that a judgment was a default or uncontested, or omit that it was far below actual damages. Document each result and add that context.' },
      { q: 'Are client testimonials allowed on Florida lawyer websites?', a: 'They are allowed with conditions. A testimonial must be the client’s real experience in their own words, about something they can judge, not paid for, not written by the lawyer, typical of what clients experience, and paired with a disclaimer that results may differ. Testimonials about courtesy, promptness and demeanor are specifically recognized as acceptable.' },
      { q: 'Can a Florida lawyer call themselves an expert or specialist online?', a: 'Unverifiable claims about skill or reputation are treated as misleading. Florida offers board certification in 27 areas, and certified lawyers may use “Board Certified Specialist” or B.C.S. with their area named. If no one at the firm is certified, describe your experience and the cases you handle in factual terms instead.' },
      { q: 'Does my Florida law firm need a Spanish website?', a: 'It depends on who you serve, but in Miami-Dade most residents speak a language other than English at home, according to Census Bureau data. If Spanish-speaking clients call you, real Spanish pages linked to their English versions help them and help Google show the right page. Only advertise Spanish service if someone at the firm can provide it.' },
      { q: 'What should be in the footer of a Florida law firm website?', a: 'At minimum, the firm’s name, a responsible lawyer and the city, town or county of at least one real office where the services are performed. Most firms also add the full address, phone number, hours, links to attorney profiles and any disclaimers, such as a note that contacting the firm through the site doesn’t create an attorney-client relationship.' },
      { q: 'How much does a Florida law firm website cost?', a: 'Costs range widely, from a monthly subscription to custom builds with ongoing agency fees and long contracts. SaySites’ Law Firm Starter plan is $79 a month and includes practice area pages, attorney profiles, consultation requests and intake questions. Whatever you choose, budget time for keeping results, bios and disclaimers accurate.' },
    ],
    published: '2026-10-10',
    status: 'published',
  },
  {
    slug: 'houston-dental-practice-website-texas-rules',
    title: 'Houston Dental Websites: What Texas Rules Require',
    description: 'A plain-English guide to the Texas dental board’s advertising rules for websites, and how a Houston practice can build a site that patients trust and Google ranks.',
    kind: 'guide',
    hero: { src: 'https://images.unsplash.com/photo-1686840007773-67280673ca0b?auto=format&fit=crop&w=1600&q=75', alt: 'Aerial view of downtown Houston’s office towers and freeways on a sunny day' },
    summary: [
      'Texas has its own dental advertising rules, and Section 108.59 sets out what a practice website has to disclose.',
      'General dentists who list specialty services such as implants or orthodontics must label themselves “General Dentist” right after their name.',
      'Testimonials, before and after photos, “painless” claims and “free” offers each have specific Texas rules.',
      'Close to half of Harris County residents speak a language other than English at home, so a real Spanish version of key pages is worth weighing.',
      'The sites that win new patients answer the practical questions first: insurance, new patients, location, hours and who the dentists are.',
    ],
    body: `If you run a dental practice in Houston, your website is often the first place a new patient meets you. They found you on a map, tapped through, and now they’re deciding in a few seconds whether to book. At the same time, Texas regulates dental advertising closely, and the rules reach your website as much as a billboard on the Katy Freeway.

The short version: a Texas dental website has to say who owns it, what you offer, where you are and what your dentists are licensed and qualified to do. If you’re a general dentist, you can’t let it read like you’re a specialist. And every claim, review and photo has to be true and verifiable. Build the site around those facts and it does double duty, because the same clarity is what patients and Google both look for.

This is practical guidance based on the board’s published rules, not legal advice. For a close call, check the rule text or ask the Texas State Board of Dental Examiners.

## What Texas requires a dental website to disclose

The Texas Administrative Code has a section written specifically about practice websites. Section 108.59 asks a dental website to disclose who owns the site, the services the practice offers, its office locations and contact details, and the licensing and qualifications of its dentists and associated providers ([22 Tex. Admin. Code § 108.59](${TX_WEBSITE})).

A neighboring rule fills in the details about names. Under Section 108.52, dentists practicing under a trade name have to disclose their full name as it appears on their license or their commonly used name, ads under a trade name must prominently name the owner and at least one practicing dentist at each advertised location, and each owner or principal named in an ad shares responsibility for what it says ([22 Tex. Admin. Code § 108.52](${TX_NAMES})). The same section says professional communications should include each dentist’s degree and either “general dentist” or their recognized specialty.

Turned into a page plan, that looks like this:

- **An owner and team page** that names the owner dentist and every dentist practicing there, with degrees and whether each is a general dentist or a specialist.
- **A services section** that lists what you actually do.
- **A location page for each office** with the address, phone, hours and a map.
- **A clear site owner** in the footer, usually the practice’s legal name.

If you practice under a trade name, the owner’s name and at least one practicing dentist need to be easy to find on the site, not buried in a privacy policy.

## General dentist or specialist: the rule most sites get wrong

This is where Houston practice websites most often drift out of line, usually by accident.

### Who can say “specialist”

Section 108.54 limits the word “specialist” and the terms “specialty” or “board certified” to dentists who qualify in a recognized specialty. It lists twelve, including endodontics, oral and maxillofacial surgery, orthodontics and dentofacial orthopedics, pediatric dentistry, periodontics and prosthodontics. A dentist can qualify through an accredited specialty program of two or more years or through certification by a recognized board, and a specialist is expected to limit practice to the advertised area ([22 Tex. Admin. Code § 108.54](${TX_SPECIALTY})). The section also puts the burden on the practice owner to avoid any implication that the general dentists in the practice are specialists.

### What a general dentist has to add

Plenty of general dentists place implants, do clear aligner cases or handle root canals, and they’re allowed to advertise those services. Section 108.55 says how. When a general dentist advertises specific services, the words “General Dentist” or “General Dentistry” must appear right after the dentist’s name, and that designation must be at least as large as the largest font used for the advertised services ([22 Tex. Admin. Code § 108.55](${TX_GENERAL})). A list of services is fine as long as it doesn’t imply specialization and is clearly separate from that designation.

On a website, the easy places to slip are the hero banner and the services menu. A banner that shouts “IMPLANTS AND ORTHODONTICS” in huge type with the dentist’s name in a small line underneath is exactly the pattern the font-size rule is aimed at. Fix it once in the site design, so every page that names a dentist carries the designation automatically.

![A modern dental operatory with an orange patient chair and overhead light](https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=1200&q=75)

## Claims, reviews and photos: what Texas treats as misleading

Section 108.57 is the board’s list of what makes dental advertising false, misleading or deceptive ([22 Tex. Admin. Code § 108.57](${TX_MISLEADING})). The parts that matter most for a website:

### No “painless,” no guarantees, no unsupported “best”

Under the rule, claiming that dental work will be free of pain or discomfort is misleading. So is implying your materials or services are better than other providers’ without factual support, or predicting or guaranteeing satisfaction or success. A promise to refund a fee if a patient is unhappy is specifically allowed.

That rules out a lot of familiar dental marketing lines. “Pain-free dentistry” and “Houston’s best dentist” are both risky. What works instead is describing what you actually do: the comfort options you offer, how you explain treatment before you start, how you handle anxious patients. Those are true, specific and more convincing.

### Testimonials have to be real and identifiable

The rule treats testimonials as misleading if they come from someone who isn’t a current patient, contain false or misleading statements, can’t be verified, or leave out the person’s identity. In practice: real current patients, with their permission and their name, in their own words. Never write reviews for patients, and don’t pay for them.

### Before and after photos need consent and a caveat

Photos of actual patients are allowed. The rule requires written consent before you disclose anything that could identify a patient, and an ad with that kind of result should include the statement that actual results may vary ([22 Tex. Admin. Code § 108.57](${TX_MISLEADING})). On a smile gallery page, put that line next to the photos, not only in the footer.

### “Free” and “discount” offers have to be real

The same section treats it as misleading to call a service free or discounted when its cost is built into a companion procedure the patient is charged for. If your new-patient special includes a “free” exam, the exam has to actually be free.

### Keep your old pages

Section 108.60 asks dentists to keep copies of print, broadcast and electronic advertisements for four years after they last appear, along with records of any corrections ([22 Tex. Admin. Code § 108.60](${TX_RECORDS})). Whether that reaches every website version isn’t spelled out, so the cautious move is to keep dated copies of your site when it changes. A website platform that saves every version makes this effortless.

## How Houston patients find a dentist

Getting the rules right keeps you safe. Getting found and chosen is the other half.

### Local search is about the map and the details

Most new patients search something like “dentist near me,” “emergency dentist Houston” or “pediatric dentist Katy.” Google says local results mainly come down to relevance, distance and prominence ([How Google ranks local results](${LOCAL_RANKING})). In a metro area as spread out as Houston, distance does a lot of the sorting, which is why a separate, complete page for each office matters: Sugar Land patients want the Sugar Land address, parking and hours, not a list of four locations.

Keep your name, address and phone identical on your website and your Google Business Profile, choose the category that describes your core practice, and keep hours current, including holidays ([Guidelines for representing your business on Google](${GBP_GUIDELINES})).

### Spanish matters in Harris County

The Census Bureau reports that about 45% of Harris County residents age 5 and over speak a language other than English at home, based on 2020 to 2024 survey data ([U.S. Census Bureau QuickFacts, Harris County](${CENSUS_HARRIS})). If Spanish-speaking patients call your office, real Spanish versions of your key pages, written well and linked to their English versions, help them choose you and help Google show the right language ([Tell Google about localized versions of your page](${HREFLANG})). Only say “hablamos español” if someone at the front desk does. And the Texas advertising rules apply to Spanish pages exactly as they do to English ones, including the “General Dentist” designation.

### Patients decide on practical details

When people compare dental offices, the deciding questions are rarely about technology. They’re about whether you take their insurance, whether you’re accepting new patients, whether you can see them soon and where to park. A site that answers those in the first screen gets more calls than one that opens with a mission statement.

![A dentist examining a patient in a bright treatment room](https://images.unsplash.com/photo-1662837625421-5fd8ed6131a0?auto=format&fit=crop&w=1200&q=75)

## What a strong Houston dental website includes

Put it together and the pages almost write themselves.

### A home page that answers the first questions

Lead with what you are and where: “Family and cosmetic dentistry in the Heights, accepting new patients.” Then a tap-to-call button, a request-an-appointment button, your hours and a short insurance line. On a phone, all of that should be visible without scrolling far.

### A page for each service you want to be found for

Cleanings and exams, emergency visits, crowns, implants, clear aligners, children’s dentistry: each is its own search, so each deserves its own page. Explain what the treatment is, who it’s for, what a visit looks like, and how cost and insurance usually work at your office. If a general dentist provides the service, the designation goes next to their name on that page too.

### Dentist and team profiles

Photo, degree, school, whether they’re a general dentist or which specialty they qualify in, and something personal. Patients choose a person. These pages also carry the license and qualification information Section 108.59 asks for.

### Insurance and payment, in plain words

List the plans you’re in network with, say what you do if a patient’s plan isn’t on the list, and explain any membership or payment options. Keep it current; an outdated insurance list frustrates patients more than a missing one.

### A simple appointment request

Name, phone, email, preferred time and a few words about what they need. Don’t ask for health history on the website form; that belongs in your intake system. Reply quickly, because a patient who requested an appointment from three offices usually books with the first one that calls back.

### Markup, speed and accessibility

Describe each office to Google with structured data as a Dentist, with its name, address, phone and hours ([Local business structured data](${LOCAL_SD}); [schema.org Dentist](${SCHEMA_DENTIST})). Make sure pages load quickly on phones, which Google’s Core Web Vitals help you measure ([Web Vitals](${WEB_VITALS})). And make the site usable with a keyboard and screen reader; the Department of Justice has published guidance on web accessibility under the ADA ([Guidance on web accessibility and the ADA](${ADA_WEB})).

## A Texas dental website checklist

Run through this before launch or your next redesign.

1. The site names its owner, and the owner dentist and at least one practicing dentist are clearly named for each location.
2. Every dentist shows a degree and either “General Dentist” or a recognized specialty they qualify for.
3. Wherever a general dentist is named alongside specific services, “General Dentist” appears right after the name, at least as large as the service names.
4. No “painless,” “guaranteed” or unsupported “best” claims.
5. Testimonials come from real current patients, with their identity and permission.
6. Before and after photos have written consent and an “actual results may vary” note beside them.
7. Any “free” or discounted offer is genuinely free or discounted.
8. Each office has its own page with address, phone, hours and parking, matching your Google Business Profile.
9. Spanish pages, if any, are real translations and follow the same rules.
10. You keep dated copies of the site when it changes.

## Where SaySites fits

SaySites builds practice websites around this structure: a page for each service, provider profiles with real bios and credentials, location details Google can read, structured data that describes your practice, and a speed check every page has to pass before it goes live. SaySites never invents reviews, credentials, results or before and after photos; everything on your site comes from you. Changes are made by saying them in plain words, and every version is saved, so keeping an advertising record is automatic. Plans start at $15 a month ([see dental practice websites](/websites-for/dentists) and [pricing](/pricing)).

You remain responsible for what your site says under the Texas rules. What gets easier is keeping it right: adding a new associate with the right designation, updating your insurance list or adding a consented case to your gallery takes a sentence.

If your current site is slow, vague about who your dentists are or heavy on claims you’d rather not defend, [send it to us for a free redesign](/redesign). Or [start a 7-day free trial](/signup) and build your own. For more on getting chosen in local results, read [how Google decides which local businesses to show](/blog/how-google-picks-local-businesses) and [how to ask for Google reviews without breaking the rules](/blog/ask-for-google-reviews-the-right-way).`,
    faq: [
      { q: 'What does Texas require a dental practice website to disclose?', a: 'Section 108.59 of the Texas Administrative Code asks a dental website to disclose who owns the site, the services offered, office locations and contact details, and the licensing and qualifications of the dentists and associated providers. Related rules ask that each dentist’s degree and either “general dentist” or a recognized specialty appear in professional communications.' },
      { q: 'Can a general dentist in Texas advertise implants or orthodontics?', a: 'Yes. A general dentist can advertise specific services but must place “General Dentist” or “General Dentistry” directly after their name, in type at least as large as the largest service name in the ad. The list of services must not imply that the dentist is a specialist, and it should be clearly separate from that designation.' },
      { q: 'Who can call themselves a dental specialist in Texas?', a: 'Only dentists who qualify in one of the recognized specialties, such as endodontics, orthodontics, pediatric dentistry, periodontics or oral surgery. They qualify through an accredited specialty program of two or more years or through certification by a recognized board, and they should limit their practice to the specialty they advertise.' },
      { q: 'Are patient reviews and testimonials allowed on Texas dental websites?', a: 'Yes, with care. Texas treats testimonials as misleading if they come from someone who isn’t a current patient, can’t be verified, contain false statements or leave out the person’s identity. Use real current patients, with their permission and name, in their own words, and never write or pay for reviews.' },
      { q: 'Can I show before and after photos on my dental website in Texas?', a: 'You can show photos of actual patients. Get written consent before showing anything that could identify a patient, and include the statement that actual results may vary next to the photos. Use only your own patients’ real results, and don’t edit images in a way that changes what the treatment achieved.' },
      { q: 'Should my Houston dental website be in Spanish?', a: 'If Spanish-speaking patients call your office, it is worth considering. Census Bureau data shows about 45% of Harris County residents speak a language other than English at home. Real, well-written Spanish pages linked to their English versions help those patients choose you. Only advertise Spanish service if your team can provide it.' },
      { q: 'Can I say “painless dentistry” on my website?', a: 'Texas treats a claim that dental work will be free of pain or discomfort as misleading, so it is best avoided. Describe what you actually offer instead, such as the comfort and sedation options available, how you explain treatment first and how your team works with nervous patients. Specific, true details are more convincing anyway.' },
    ],
    published: '2026-10-10',
    status: 'published',
  },

  {
    slug: 'how-google-picks-local-businesses',
    title: 'How Google decides which local businesses to show',
    description: 'Relevance, distance and prominence: what Google says it looks at for local results, and what a small business can actually do about each one.',
    kind: 'guide',
    summary: [
      'Google says local results mainly come down to relevance, distance and prominence.',
      'You can’t pay for a better local ranking, and distance is out of your hands.',
      'Complete, accurate business details, real reviews and a website that explains what you do are the parts you control.',
    ],
    body: `When someone near you searches for “plumber” or “nail salon” on their phone, Google shows a short list of nearby businesses on the map and in the results. A lot of advice about getting into that list is guesswork. Google’s own help page is short and specific, so it’s the best place to start ([Tips to improve your local ranking on Google](${LOCAL_RANKING})).

## The three things Google names

Google says local results are “mainly based on relevance, distance, and popularity”, and describes them as:

- **Relevance:** how well your Business Profile matches what someone searched for. Google’s advice is to give complete and detailed business information so it can match you to the right searches.
- **Distance:** how far you are from the person searching. If they don’t share their location, Google uses what it knows about where they are.
- **Prominence:** how well known your business is. Google says this is partly based on information like how many websites link to you and how many reviews you have, and that more reviews and positive ratings can help.

It also says plainly that there’s no way to request or pay for a better local ranking. Anyone who promises you the top spot is promising something Google says can’t be bought.

## What you can’t change: distance

You can’t move closer to every customer. What you can do is be accurate about where you are and where you work, so you show up for the people you can actually serve. If you go to customers rather than having them come to you, that means setting a service area instead of a street address.

## What you can change: relevance

Relevance is mostly about being clear. Google lists the details that help: your full address if customers visit you, your hours (including special hours), the category that describes your business, and other details such as parking or Wi-Fi.

Two habits make a real difference:

1. **Pick the category that describes your core business.** Google’s guidelines ask you to choose the fewest categories it takes to describe your overall business ([Guidelines for representing your business on Google](${GBP_GUIDELINES})). More isn’t better.
2. **Say what you do in plain words, everywhere.** Your Business Profile description and your website should both name the services you offer the way customers say them: “water heater repair”, not “thermal solutions”.

## What you can change slowly: prominence

Prominence is earned. Google names reviews and links from other websites. The honest ways to build it are the boring ones: do good work, ask happy customers for a review, and be part of your town (a local association, a sponsorship, a supplier who lists you). Never buy reviews or links; Google’s policies forbid paid reviews outright ([Maps content policy](${MAPS_POLICY})).

## Where your website fits

Your website is where the detail lives. Your profile can only say so much; a page for each service, in your own words, tells Google and customers exactly what you do and where. That supports relevance directly.

## A short checklist

- Verify your Business Profile and keep it up to date.
- Use one accurate category, plus others only if they describe your core business.
- Keep your hours current, including holidays.
- Ask every happy customer for a review, and reply to the reviews you get.
- Give each main service its own page on your website, in your own words.

Every SaySites site lists your services in plain words and tells Google your business details in the format it reads. Your reviews, your profile and your work are still yours to look after.`,
    published: '2026-10-09',
    status: 'published',
  },
  {
    slug: 'ask-for-google-reviews-the-right-way',
    title: 'How to ask for Google reviews without breaking the rules',
    description: 'Google wants more reviews to come from real customers, and it bans incentives. Here’s how to ask often, ask well and stay within the rules.',
    kind: 'guide',
    summary: [
      'Asking customers for a review is encouraged; Google even gives you a link and a QR code for it.',
      'Offering anything in return for a review, including a discount, is against Google’s rules.',
      'Reply to reviews, good and bad, briefly and personally.',
    ],
    body: `Reviews show next to your business on Google Maps and Search, and Google names them as one of the things that help a business stand out ([Tips to get more reviews](${REVIEW_TIPS})). Most small businesses have far fewer reviews than happy customers, simply because they never ask. Here’s how to ask without getting into trouble.

## What Google allows

Google’s own advice is to remind customers to leave reviews. It gives every business a link and a QR code for exactly this, inside your Business Profile. Asking is fine. Asking everyone is fine.

## What Google forbids

Google’s policy is direct: offering incentives, “like free or discounted goods or services”, in exchange for posting a review, changing one or removing a negative one is considered fake and misleading content and is strictly prohibited ([Tips to get more reviews](${REVIEW_TIPS})).

The Maps content policy adds more you shouldn’t do ([Prohibited & restricted content](${MAPS_POLICY})):

- Pay for reviews, directly or in kind.
- Post reviews from several accounts, or ask one person to.
- Ask employees, family or anyone with a conflict of interest to review you.
- Post on a competitor’s listing to hurt them.

That rules out “10% off your next visit for a review” and “enter our prize draw when you review us”. It also rules out asking only the customers you know loved you and quietly skipping the rest, because the policy forbids soliciting content that doesn’t reflect a genuine experience.

## How to ask well

- **Ask at the right moment.** Right after a job is finished and the customer is pleased, not weeks later.
- **Make it one tap.** Send your review link by text or email, or show the QR code at the counter. Google notes customers need to be signed in to a Google Account to leave a review.
- **Ask in your own words.** “If you were happy with the work, a short review on Google helps other people in town find us” is plenty.
- **Ask everyone.** A mix of reviews reads as more believable; Google itself says a mix of positive and negative feedback often feels more trustworthy.

## Reply to what you get

Google suggests replying to reviews, keeping replies short, polite and specific, and not using them to advertise. For a negative review, reply calmly with what you’ll do about it. Future customers read your reply as much as the review.

If a review breaks Google’s policies (for example, it’s clearly not from a customer), you can flag it for Google to look at. You can’t remove a review yourself just because you disagree with it.

## A simple routine

1. Get your review link or QR code from your Business Profile.
2. Send it to every customer when the work is done.
3. Reply to each new review within a few days.

On SaySites, once you add your Google review link, your site gets a short /review address that forwards to it, and you can turn on one review request email after you mark a lead as won. Every customer gets the same request, with nothing offered in return.`,
    published: '2026-10-10',
    status: 'published',
  },
  {
    slug: 'service-area-business-google',
    title: 'No storefront? How to show Google where you work',
    description: 'Plumbers, cleaners and other businesses that go to their customers should set a service area, not a street address. Here’s what Google’s rules say.',
    kind: 'guide',
    summary: [
      'If customers don’t come to your address, Google asks you to remove it from your Business Profile and set a service area instead.',
      'You can list up to 20 service areas by city or postal code; Google says the whole area shouldn’t be more than about two hours’ drive from your base.',
      'Your website should name the places you serve, honestly.',
    ],
    body: `Many small businesses don’t have a shop. A plumber, a mobile dog groomer or a cleaning company goes to the customer. Google treats these as service-area businesses, and it has specific rules for them ([Manage your service areas](${SERVICE_AREAS})).

## Are you a service-area business?

Google describes three kinds:

- **Storefront:** customers come to you, at an address with permanent signage.
- **Service-area business:** you visit or deliver to customers and don’t serve them at your address. Google gives cleaning services and plumbers as examples.
- **Hybrid:** you do both, like a restaurant that also delivers.

Google also says that if your business doesn’t have permanent on-site signage, it isn’t eligible as a storefront and should be listed as a service-area business.

## Hide your address if customers don’t visit

This is the rule people miss. Google says that if you don’t serve customers at your business address, you should remove the address from your Business Profile. Working from home doesn’t mean you’re invisible on Google; it means you show a service area instead of a pin.

## Setting your service area

In your Business Profile, under Edit profile and Location, you can add service areas. Google’s rules:

- Up to 20 service areas, set by city, postal code or a similar area.
- No radius around your base (older radius settings can’t be edited).
- The whole area shouldn’t be more than about two hours of driving time from where you’re based.
- A service-area business can have only one profile for the whole area it serves.

Pick the places you genuinely want work from. Listing far-off towns you’d never drive to doesn’t help anyone.

## What to put on your website

Your website should agree with your profile:

- Say where you’re based and which towns or neighborhoods you serve, in a sentence a person would write.
- Don’t create a near-identical page for every town with only the name swapped. Google’s guidance on helpful content warns against pages made mainly to attract search visits rather than to help people ([Creating helpful, reliable, people-first content](${HELPFUL})).
- If you do write about a particular town, write something true and specific to it: the jobs you do there, how quickly you can get there, local details customers care about.

## Stay consistent

Google’s guidelines ask you to represent your business the way it’s known in the real world, with an accurate and precise address or service area ([Guidelines for representing your business on Google](${GBP_GUIDELINES})). Use the same name and phone number on your profile, your website and anywhere else you’re listed.

SaySites sites tell Google the area you serve in their business details, and your site never shows a street address unless you give us one.`,
    published: '2026-10-11',
    status: 'published',
  },
  {
    slug: 'page-titles-and-descriptions-that-get-clicks',
    title: 'Page titles and descriptions that people actually click',
    description: 'The title and short description under it are often all a searcher sees. What Google’s guidance says about writing them, with examples for local businesses.',
    kind: 'guide',
    summary: [
      'Every page needs its own clear title; avoid vague ones like “Home” and repeated boilerplate.',
      'Google writes the description under your result mostly from the page itself, and sometimes uses your meta description.',
      'Write for the person searching: what you do, where, and why they should pick you.',
    ],
    body: `In a list of search results, your page gets a title and a line or two of description. That’s often all someone reads before deciding whether to tap. Google has clear guidance on both, and following it is one of the cheapest improvements a small business can make.

## Titles: what Google asks for

Google calls the clickable headline a “title link” and builds it mainly from your page’s title ([Influencing your title links](${TITLE_LINKS})). Its advice:

- **Every page should have a title.**
- **Be descriptive and concise.** Avoid vague titles like “Home”.
- **Don’t stuff keywords.** Repeating “plumber, plumbing, plumbers” can look spammy to Google and to people.
- **Avoid repeated boilerplate.** Each page should have distinct text that describes that page.
- **Brand concisely.** Your business name can go in the title, but it shouldn’t crowd out what the page is about.

Google also notes there’s no fixed length limit, but long titles get cut off to fit the screen.

## Good and bad examples

- Weak: “Home”
- Weak: “Plumber Plumbing Plumbers Best Plumber Tampa”
- Better: “Rivera Plumbing | Plumber in Tampa, FL”
- For a service page: “Water Heater Repair in Tampa | Rivera Plumbing”

The better versions say what the page is, where, and who you are, once each.

## Descriptions: what Google actually shows

The text under your title is called a snippet. Google says snippets are created primarily from the page content itself, and that it sometimes uses your meta description if that describes the page more accurately ([Control your snippets](${SNIPPETS})). It may also show different snippets for different searches.

So two things matter:

1. **Your page should explain itself early.** The first paragraph of a service page should say what you do, for whom, and where.
2. **Your meta description should be a real summary.** Google describes a good one as a short, relevant pitch that tells people the page is exactly what they’re looking for. Like titles, there’s no length limit, but long ones are cut to fit.

## Write it for a person

A useful test: read your title and description as if you were the customer, on a phone, comparing three businesses. Would you know what this page offers? Would you know the business is near you? Is there a reason to choose it, stated plainly and truthfully, such as “Free estimates” if you really give them, or “Open Saturdays” if you are?

Don’t promise what you can’t back up. “Best in Florida” is a claim; “Family-run since 2009” is a fact, if it’s true.

## Check yours today

Search for your business name and your main service plus your town. Look at what Google shows for your pages. If a title says “Home” or every page has the same one, fix those first.

SaySites gives every page its own title and description when your site is built, flags duplicates or short ones in the SEO tab, and lets you fix them in one click.`,
    published: '2026-10-12',
    status: 'published',
  },
  {
    slug: 'is-your-website-fast-enough',
    title: 'Is your website fast enough? Core Web Vitals in plain English',
    description: 'Google measures how fast your pages load, react and settle. What the three Core Web Vitals mean, the targets Google sets, and how to check your own site free.',
    kind: 'guide',
    summary: [
      'Core Web Vitals measure loading (LCP), responsiveness (INP) and visual stability (CLS).',
      'Google’s targets: main content within 2.5 seconds, a response within 200 milliseconds, and a layout shift score of 0.1 or less.',
      'You can check any page free with PageSpeed Insights.',
    ],
    body: `Most of your customers will see your website on a phone, often on a patchy connection. If it’s slow, some of them leave before it loads. Google measures this with three numbers it calls Core Web Vitals, and explains them in detail on web.dev ([Web Vitals](${WEB_VITALS})).

## The three numbers

**Largest Contentful Paint (LCP): how fast it loads.** The time until the biggest thing on the screen, usually your main photo or headline, appears. Google’s target is within 2.5 seconds of the page starting to load.

**Interaction to Next Paint (INP): how fast it reacts.** When someone taps a button or opens a menu, how long until the page responds. The target is 200 milliseconds or less.

**Cumulative Layout Shift (CLS): how steady it is.** Whether things jump around while the page loads, like a button moving just as you tap it. The target is a score of 0.1 or less.

Google suggests judging a site by the 75th percentile of visits, on both phones and computers: in other words, most of your visitors should get a good experience, not just the ones on fast Wi-Fi.

## Why it matters for a small business

A slow page costs you the impatient visitor, and on a phone that’s a lot of visitors. Google also says its core ranking systems look to reward content that gives a good page experience ([Creating helpful, reliable, people-first content](${HELPFUL})). Speed won’t make up for a page that doesn’t answer the question, but it removes a reason for people to give up.

## Check your own site in two minutes

1. Open [PageSpeed Insights](${PAGESPEED}).
2. Paste your home page address and run it.
3. Look at the phone results first.

If your site has enough visitors, you’ll see real-world numbers from Chrome users at the top. Below that is a lab test, a simulated load on a mid-range phone, with a score out of 100 and a list of what’s slowing the page down.

## Don’t chase the score alone

The lab score changes a little every time you run it, and a perfect 100 isn’t the goal. What matters is that real visitors on real phones see your page quickly and can use it straight away. If the real-world numbers at the top are good, small swings in the lab score aren’t worth worrying about. If there aren’t enough visitors for real-world numbers yet, use the lab test as your guide and re-check after every big change, like a new photo gallery or a booking widget.

## The usual culprits

- **Huge photos.** A photo straight from a camera can be many times larger than the screen needs.
- **Too many add-ons.** Chat widgets, pop-ups, trackers and tag managers each load their own code.
- **Fonts and sliders.** Several custom fonts and auto-playing carousels add weight and cause jumps.
- **Cheap or overloaded hosting.** Slow servers delay everything.

Fixing these usually means removing things rather than adding them. Ask of every add-on: does this bring in customers, or just weight?

SaySites sites send no JavaScript to visitors, size every photo for the screen, and every page has to pass our speed check (a mobile score of 95 or more) before it can go live.`,
    published: '2026-10-13',
    status: 'published',
  },
  {
    slug: 'what-to-put-on-your-home-page',
    title: 'What to put on your home page so visitors get in touch',
    description: 'A small business home page has one job: help the right visitor decide to call or send a message. A practical, section-by-section guide.',
    kind: 'guide',
    summary: [
      'Say what you do and where in the first screen, in plain words.',
      'Make calling and sending a message easy from anywhere on the page.',
      'Show proof that’s real: your own photos, real reviews, real details. Never invent any.',
    ],
    body: `A visitor lands on your home page with a question: can this business help me, and can I trust them? Everything on the page should help them answer it quickly. Here’s a simple order that works for most local businesses. It isn’t a formula from Google; it’s plain good sense, and it lines up with Google’s advice to make pages for people first ([Creating helpful, reliable, people-first content](${HELPFUL})).

## 1. The first screen: what, where, how to reach you

Before anyone scrolls, they should know:

- **What you do,** in the words customers use. “Emergency plumbing and water heaters”, not “Solutions for your home”.
- **Where.** Your town or the area you serve.
- **How to get in touch.** A phone number they can tap and a button to send a message.

One clear headline, one sentence under it, and two buttons is enough. A strong photo of your real work, team or premises helps more than a stock image.

## 2. Your main services

List your main services with a line each about what’s included, and link each to its own page with the detail. Visitors scan for their problem; let them find it in seconds.

## 3. Why you

This is where most sites say “quality service at affordable prices”, which says nothing. Say something specific and true instead:

- How you work (“We give you a written price before we start”).
- How long you’ve been doing it, if it’s worth saying.
- Licences, certifications or memberships you really hold.
- The area you cover and when you’re available.

## 4. Proof

Real reviews from real customers, quoted word for word. Photos of jobs you’ve actually done. Never invent a testimonial, a number of happy customers or an award; it’s dishonest, and fake reviews break Google’s policies ([Maps content policy](${MAPS_POLICY})).

## 5. Answers to the questions people ask

Three to five short questions and answers: which areas you cover, how pricing works, how soon you can help, what happens first. These save you phone calls and help visitors decide.

## 6. One more way to get in touch

End the page with a short form and your phone number again. Someone who has read this far is ready; don’t make them scroll back up.

## What to leave out

- Pop-ups that cover the page on a phone.
- Auto-playing sliders that rotate before people can read them.
- Long paragraphs about your mission before you’ve said what you do.

## Check it on a phone

Open your home page on your phone and give yourself five seconds. Do you know what the business does, where, and how to call? If not, fix the first screen first.

SaySites builds every new site in this order, with a call button that stays on screen on phones and a request form on the home page. You change any of it by saying what you want.`,
    published: '2026-10-14',
    status: 'published',
  },
  {
    slug: 'google-business-profile-or-website',
    title: 'Google Business Profile or a website: do you need both?',
    description: 'A free Business Profile puts you on Google Maps. A website is the part you own and control. What each does well, and why most small businesses need both.',
    kind: 'guide',
    summary: [
      'Your Business Profile is how you appear on Google Maps and in local results; it’s free and worth setting up today.',
      'Your website holds the detail a profile can’t: a page per service, your story, your answers.',
      'Google lists links from other sites among the things that help local ranking, and your website is what they link to.',
    ],
    body: `If you have a Google Business Profile with good reviews, it’s fair to ask whether you need a website at all. The short answer for most small businesses is yes. They do different jobs, and each makes the other work better.

## What your Business Profile does

Your Business Profile is the panel and map pin people see when they search for you or for businesses like yours nearby. You can add your hours, category, photos, services and a description, and you can collect reviews. It’s free. If you haven’t claimed yours, do it first ([Add or claim your Business Profile](https://support.google.com/business/answer/2911778)).

Google lists keeping that information complete and accurate as one of the main ways to improve your local ranking ([Tips to improve your local ranking](${LOCAL_RANKING})).

## What a profile can’t do

- **Room for detail.** A profile gives you a description field and a services list. It can’t hold a full page about each service, your prices, your process or answers to the questions customers ask.
- **Ownership.** The profile lives on Google’s platform under Google’s rules ([Guidelines for representing your business](${GBP_GUIDELINES})). Your website is yours: your words, your design, your address on the web.
- **Searches beyond the map.** Many searches show ordinary web results as well as the map. Pages on your website can appear there for the specific questions people ask.

## How they help each other

Google says prominence, one of the three main local ranking factors, is partly based on information like how many websites link to your business ([Tips to improve your local ranking](${LOCAL_RANKING})). Links point to websites. A local association, a supplier or a newspaper can link to your site; it’s much harder for them to link meaningfully to a map pin.

And your profile has a website field. Someone who finds you on Maps and wants to know more taps through to your site. If there’s nothing there, or an outdated page, you lose them at the point they were most interested.

## What your website needs, at minimum

- A clear home page: what you do, where, and how to get in touch.
- A page for each main service.
- The same name, phone number and address (or service area) as your profile.
- A way to send a message, so customers can reach you outside opening hours.

## Keep them in step

Whenever something changes, like new hours, a new service or a new phone number, update both on the same day. Customers notice when the two disagree, and a wrong phone number on either one is a lost call.

## The bottom line

Set up your Business Profile today; it’s free and it’s how you show up on the map. Then make sure the website it points to is fast, clear and yours.

SaySites puts your business name, phone number and area into your site’s details for Google, so your website and your profile tell the same story.`,
    published: '2026-10-15',
    status: 'published',
  },
]
