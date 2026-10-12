// The daily blog run (the owner's request, October 10, 2026): two new
// articles every day, each at least 2,000 words, written fresh around sources
// checked on the day they go live. Same rules as lib/articles: every outside
// fact links to its source, no invented numbers, no promises of rankings or
// leads, no competitors named, byline "SaySites". Each article carries a
// hero photo, two or three photos in the body and five to eight questions in
// its FAQ. The duplicate guard in lib/articles checks these with the rest.

import type { Article } from './articles'

// Google, checked October 12, 2026
const HELPFUL = 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'
const SPAM = 'https://developers.google.com/search/docs/essentials/spam-policies'
const LOCAL_RANKING = 'https://support.google.com/business/answer/7091'
const GBP_GUIDELINES = 'https://support.google.com/business/answer/3038177'
const MULTI_REGIONAL = 'https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites'
const HREFLANG = 'https://developers.google.com/search/docs/specialty/international/localized-versions'


// California, checked October 12, 2026
const CA_RULES = 'https://www.calbar.ca.gov/legal-professionals/rules/rules-professional-conduct/current-rules-professional-conduct/chapter-7-information-about-legal-services'
const CA_BPC = 'https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?lawCode=BPC&division=3.&title=&part=&chapter=4.&article=9.5.'
const CA_OP_WEBSITES = 'https://www.calbar.org/ethics/Opinions/2001-155.htm'
const CA_OP_BLOGS = 'https://www.calbar.ca.gov/sites/default/files/portals/0/documents/ethics/Opinions/CAL-2016-196-%5B12-0006%5D-Blogging.pdf'
const CA_OP_SOCIAL = 'https://www.calbar.ca.gov/sites/default/files/2025-11/CAL%202012-186%20%2812-21-12%29.pdf'
const LA_COURT_STUDY = 'https://courts.ca.gov/facilities/los-angeles-county-los-angeles-superior-court-long-range-planning-study'
const LA_INTERPRETERS = 'https://www.lacourt.ca.gov/page/SC0105'
const CA_SMALL_CLAIMS = 'https://selfhelp.courts.ca.gov/small-claims/before-you-start'
const CENSUS_LA = 'https://www.census.gov/quickfacts/fact/table/losangelescountycalifornia,losangelescitycalifornia/RHI725224'

export const DAILY_ARTICLES: Article[] = [
  {
    slug: 'los-angeles-law-firm-website-sb-37',
    title: 'Website for Lawyers in Los Angeles: SB 37 and Bar Rules',
    description: 'California’s SB 37 changed lawyer advertising law in 2026. A page-by-page guide to a Los Angeles law firm website that follows the rules and earns calls.',
    kind: 'guide',
    about: ['Law firm website design', 'California Business and Professions Code', 'Attorney advertising', 'Los Angeles'],
    hero: { src: 'https://images.unsplash.com/photo-1600621895391-0a5ac353d1b6?auto=format&fit=crop&w=1600&q=75', alt: 'The white tower of Los Angeles City Hall under a blue sky with scattered clouds, seen from a sunny plaza with palm trees and a few people walking' },
    summary: [
      'California treats a law firm website as an advertisement, so both the Rules of Professional Conduct and the Business and Professions Code apply to it.',
      'SB 37, in effect since January 1, 2026, added limits on award badges, a required office location disclosure and a path for misled consumers to sue.',
      'Stock photos that look like your clients or your lawyers, “no fee” promises without a costs statement and unexplained case results are the riskiest parts of most LA firm sites.',
      'If your site says you serve clients in Spanish, California requires that a lawyer can actually do so, or that the page names the job title of the person who speaks it.',
      'Keep a true copy of every advertisement for at least a year; for a website, that means dated copies of your pages.',
    ],
    body: `A Los Angeles law firm website answers to two rulebooks. One is the State Bar’s Rules of Professional Conduct, Rules 7.1 to 7.5. The other is the Legal Advertising article of the Business and Professions Code, sections 6157 to 6159.2, which the Legislature amended with SB 37, effective January 1, 2026. Most firm websites in the county were built before that date, and many carry exactly the things the new law targets: rows of award badges, stock photos of smiling “clients” and “no win, no fee” banners.

The short answer: build your site so that every claim is true and provable, every page names the firm and a real office location, award badges come only from organizations that don’t charge for them, any “no fee” statement explains who pays costs, and any Spanish-language promise is backed by a real person. Then make it fast and simple for someone on a phone in Boyle Heights or Van Nuys to call you.

This is practical guidance from a website company, not legal advice. When something on your site is a close call, ask an ethics lawyer or the State Bar before you publish it.

## Is a law firm website an advertisement in California?

Yes. The Business and Professions Code defines “electronic medium” to include “television, radio, or computer networks,” and defines an advertisement broadly as any communication that gives information about a lawyer’s services to encourage people to hire them ([Cal. Bus. & Prof. Code, Article 9.5](${CA_BPC})).

The State Bar’s ethics committee reached the same conclusion about websites years ago. Formal Opinion 2001-155 holds that a firm website offering information about the lawyer’s availability for employment is a “communication” under the professional rules and an “advertisement” under sections 6157 to 6158.3 ([State Bar Formal Opinion 2001-155](${CA_OP_WEBSITES})). A later opinion extends the point to blogs: a blog that is an integrated part of a firm’s website is subject to the advertising rules “to the same extent as the website of which it is a part” ([Formal Opinion 2016-196](${CA_OP_BLOGS})). Social media posts can be covered too, and the State Bar has said the rules “are not relaxed merely because such compliance might be more difficult or awkward in a social media setting” ([Formal Opinion 2012-186](${CA_OP_SOCIAL})).

So the useful mental model is simple. Everything with your firm’s name on it, from the home page to a blog post to an Instagram caption, is held to the same standard.

## What did SB 37 change for law firm advertising?

SB 37 (Statutes of 2025, Chapter 645) amended the Legal Advertising article effective January 1, 2026. Three changes matter most for a website.

**Awards and recognitions.** Section 6157.2(a)(6) now bars references to recognition or awards from an organization unless the recognition is not conferred just for being a member, and the organization “does not charge or solicit a fee, cost, or payment for the recognition or award.”

**Who you are and where you are.** Section 6157.2(b) requires an advertisement to display the name of at least one California lawyer or the firm, and the city, town or county of at least one real office location, or the address of record on file with the State Bar.

**Consumers can sue.** Section 6157.2(c) lets a consumer who was misled by an advertisement that violates the section bring a civil action, after filing a complaint with the State Bar, the Bar finding substantial evidence of a violation, and the advertiser not withdrawing the ad. Statutory damages run from $5,000 up to $100,000 “per each unique advertisement,” or three times actual damages if larger, plus attorney’s fees.

The same section continues to bar guarantees of success, statements that a lawyer can generally get “immediate cash or quick settlements,” and “misleading, deceptive, or false statements, words, or phrases regarding a lawyer’s or law firm’s skills, experience, or record.”

The private right of action is the part that changes the stakes. A misleading line on a website used to be a matter between you and the State Bar. Now it can also be one between you and a former prospective client.

## A page-by-page review of a Los Angeles firm website

The quickest way to apply all of this is to walk through a typical site from top to bottom. Here is what to check in each part.

### The header and home page: badges and superlatives

Many LA firm home pages open with a strip of logos from rating sites, “top lawyer” lists and award programs. Under section 6157.2(a)(6), each badge now needs a question answered: did the organization charge, or ask for, any payment for this recognition, and is it more than a membership perk? If the answer is yes, or you don’t know, take it down until you can confirm.

Superlatives get the same treatment. “LA’s most aggressive injury lawyers” is a statement about skill that you would have to prove. A headline that says what you do and where (“Car accident and wrongful death cases across Los Angeles County”) is safer and, for a searcher, more useful.

### Photos: stock “clients” and stock “lawyers”

This is the most overlooked risk on law firm sites. Section 6157.2(a)(3) prohibits impersonating the photograph or image of any person purporting to be a client, or presenting a dramatization, “unless disclosure of the impersonation or dramatization is made in the advertisement.” It separately prohibits using the image of anyone other than the lawyer in a way that purports to be a lawyer.

In practice:

- A stock photo of a family captioned “We helped the Garcias rebuild” implies a real client. Either use real clients with their written consent, or don’t caption stock photos as clients.
- A stock photo of a model in a suit next to the words “Meet your attorney” implies a lawyer who doesn’t work at your firm. Use real photos of your lawyers.
- Photos of the city, your office, your team or the courthouse steps carry none of this risk.

![Close-up of a person’s hands holding a smartphone sideways and typing on the on-screen keyboard](https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=1200&q=75)

### Fee statements: “no fee unless we win”

Contingency messaging is everywhere in Los Angeles personal injury marketing, and California has two overlapping rules on it.

Section 6157.2(a)(4) bars a statement that you work on a contingent basis “unless the statement also advises whether a client will be held responsible for any costs advanced by the licensee when no recovery is obtained.” If clients won’t be responsible for costs, no disclosure is required.

The professional rules say much the same. Comment [3] to Rule 7.1 treats any communication that “states or implies ‘no fee without recovery’” as misleading unless it “also expressly discloses whether or not the client will be liable for costs” ([California Rules of Professional Conduct, Chapter 7](${CA_RULES})).

So the banner that says “No fee unless we win” needs a companion sentence right next to it, such as “If we don’t recover money for you, you won’t owe us for case costs either,” if that’s your policy, or a plain statement of what clients do owe if it isn’t.

### Case results and testimonials

Comment [4] to Rule 7.1 warns that truthful results and testimonials “may be misleading if presented so as to lead a reasonable person to form an unjustified expectation that the same results could be obtained for other clients,” and notes that “an appropriate disclaimer or qualifying language often avoids creating unjustified expectations.”

The statute is more specific when results are portrayed. Section 6158.3 asks for a statement that the result portrayed “was dependent on the facts of that case, and that the results will differ if based on different facts,” unless the facts are disclosed.

A results page that holds up under both:

1. Lists results you can document from the file, with the type of case and whether it was a settlement or a verdict.
2. Carries the section 6158.3 statement near the results, not buried in a footer link.
3. Uses testimonials only from real clients, in their own words, with a short qualifying note.
4. Avoids implying that the largest number on the page is what a typical case brings.

### Specialist claims

Rule 7.4(a) lets a lawyer say they are a certified specialist only if certified by the State Bar’s Board of Legal Specialization or another entity the Bar accredits, and “the name of the certifying organization is clearly identified in the communication.” Rule 7.4(b) allows a lawyer to say the practice “specializes in, is limited to, or is concentrated in a particular field of law,” subject to Rule 7.1. Put certifications on the lawyer’s profile with the certifier named; describe everyone else’s focus in factual terms.

### The footer: name, office and a copy for the file

Rule 7.2 requires every advertisement to “include the name and address of at least one lawyer or law firm responsible for its content.” SB 37’s section 6157.2(b) adds the firm or lawyer name and the city, town or county of at least one real office, or the State Bar address of record. A footer on every page with the firm name, a responsible lawyer, the street address and a phone number covers both.

Section 6159.1 adds a record-keeping duty: “A true and correct copy of any advertisement made by a person or licensee shall be retained for one year” by whoever paid for it. For a website that changes over time, the practical answer is a dated copy of each page whenever it changes, kept for at least a year.

> If your site was built before 2026 and you’d like to see it rebuilt to these rules, [send it to us for a free redesign](/redesign). Every page keeps its address, so you don’t lose what you’ve built up in search.

## Spanish-language pages: what California requires

Los Angeles is one of the clearest cases in the country for a real Spanish-language website. The Census Bureau’s QuickFacts reports that 55.1% of Los Angeles County residents age 5 and over speak a language other than English at home, based on 2020 to 2024 survey data, and that 49.3% of county residents are Hispanic or Latino ([U.S. Census Bureau QuickFacts, Los Angeles County and city](${CENSUS_LA})). The Superior Court reflects the same reality: it provides interpreters free, and says Spanish interpreters are available at each courthouse for many common case types without an advance request ([Los Angeles Superior Court interpreter services](${LA_INTERPRETERS})).

California has a rule written for exactly this. Comment [5] to Rule 7.1 prohibits a communication that “states or implies that the lawyer is able to provide legal services in a language other than English unless the lawyer can actually provide legal services in that language or the communication also states in the language of the communication the employment title of the person who speaks such language.”

That gives you two honest options for a Spanish page:

- **A lawyer at the firm practices in Spanish.** Say so, and name them.
- **Someone else on the team speaks Spanish.** Say so on the Spanish page, in Spanish, with their job title: for example, that the case manager or the receptionist speaks Spanish.

Immigration practices have one more requirement. Section 6157.5 requires immigration and naturalization advertising to state that the lawyer is an active licensee of the State Bar, and if the ad is in another language, that statement must appear “in the same language as the advertisement.”

On the technical side, Google’s documentation is clear about how to build language versions so the right one shows to the right person ([Managing multi-regional and multilingual sites](${MULTI_REGIONAL})):

- Use a separate address for each language version of a page, rather than switching language with cookies or browser settings.
- Don’t automatically redirect visitors to a language based on what you guess they speak; let them choose, with a link to the other version on each page.
- Use one language for the content and navigation of each page, and avoid side-by-side translations.
- Tell Google which pages are translations of each other, with each version listing itself and the others ([Tell Google about localized versions of your page](${HREFLANG})).

One more rule applies off your website. Google’s Business Profile guidelines list “Repeated Bilingual Names” among the business names that aren’t acceptable, even if your sign shows both ([Guidelines for representing your business on Google](${GBP_GUIDELINES})). Use your firm’s real name once; let your website carry the Spanish.

## How do Los Angeles clients find a lawyer?

Los Angeles County is home to about 9.7 million people, by the Census Bureau’s July 2025 estimate, across dozens of cities and neighborhoods ([U.S. Census Bureau QuickFacts](${CENSUS_LA})). That spread shapes how people search and what makes them call.

### By neighborhood and by commute

Google says local results depend mainly on relevance, distance and prominence ([How Google ranks local results](${LOCAL_RANKING})). In Los Angeles, distance is felt as traffic. A client in Long Beach may not want to drive to Century City for every meeting, and they’ll search accordingly.

The answer isn’t a page for each of the county’s cities with the same paragraph and a new name. Google’s spam policies call that doorway pages ([Google Search spam policies](${SPAM})). Instead:

- Give each real office its own page, with its address, parking and transit notes, and the courthouses you appear in from there.
- If you meet clients by video or at their home, say so plainly. That is a real answer to “how far is this firm from me?”
- Put the areas you actually serve in your Google Business Profile and on your contact page, accurately.

### By the court they’re facing

The Judicial Council describes the Los Angeles Superior Court as the largest unified superior court in the United States, with 36 courthouses in its long-range planning study, and the Stanley Mosk Courthouse and Clara Shortridge Foltz Criminal Justice Center as the largest single civil, family and probate, and criminal courthouses in the nation ([Judicial Council: Los Angeles long-range planning study](${LA_COURT_STUDY})). For a client, that scale is intimidating. A page that explains what to expect at the courthouse where their case will be heard, written by someone who goes there every week, is the kind of content no generic site can copy.

It also helps to be honest about what doesn’t need a lawyer. California’s self-help site explains that, in general, an individual can sue for up to $12,500 in small claims ([California Courts: small claims, before you start](${CA_SMALL_CLAIMS})). A firm that tells a reader when a dispute is small enough to handle themselves earns trust, and often a referral for the case that does need a lawyer.

### On a phone, often in a hurry

Most first visits to a law firm site happen on a phone, frequently right after something has gone wrong. The page has to show what you do and how to reach you before anything else loads. Our [test of 105 top-ranking law firm websites](/blog/we-tested-top-ranking-law-firm-websites) found that most were slow on a phone, usually because of the scripts loaded on top of the design.

![A man and a woman talking across a round white table with notebooks, a tablet and phones in a bright office](https://images.unsplash.com/photo-1653669486653-5f13827ea0ca?auto=format&fit=crop&w=1200&q=75)

## What should a Los Angeles law firm website include?

Put the rules and the clients together and a strong LA firm site comes down to a short list:

1. **A home page that says what, where and how to reach you**, with a tap-to-call button and a short request form visible right away on a phone.
2. **One page per practice area**, answering the questions people ask on the first call: do I have a case, what happens next, what does it cost, how long does it take in California.
3. **Attorney profiles with real photos**, bar admission, certifications with the certifier named, and the languages each person actually speaks.
4. **A results page with context and the section 6158.3 statement**, and testimonials from real clients only.
5. **Fee language that explains costs** wherever a contingency fee is mentioned.
6. **Spanish pages that are real pages**, at their own addresses, written or reviewed by a fluent speaker, naming who on the team speaks Spanish.
7. **A footer on every page** with the firm name, a responsible lawyer, a real office address and a phone number.
8. **Dated copies of every page**, kept for at least a year.
9. **Content written by someone who knows the work.** Google’s guidance on helpful content asks whether a page shows first-hand expertise and leaves the reader having learned enough to reach their goal ([Creating helpful, reliable, people-first content](${HELPFUL})). For a legal page, that goal is usually deciding whether to call.

## How SaySites helps Los Angeles firms

SaySites law firm sites are built around that list. Each firm gets a page per practice area, attorney profiles, a consultation request on every page, and a footer on every page with your firm name, address and phone plus a footer note for the notices you need, such as the name of the responsible lawyer. Practice areas and attorneys are described to search engines in structured data, every page has to pass a speed check before it goes live, and SaySites never invents results, reviews, awards or credentials: what’s on the site is what you said.

Want your site in Spanish? Ask Sofie, and she rewrites every page, the menu, the buttons and the form labels in Spanish. One honest limit today: the built-in intake question sets, such as the personal injury set with its conflict-check question, work on English sites only for now.

You stay in charge of every word, which matters under a law that now lets a misled consumer sue. Taking down a badge, adding a costs sentence next to “no fee” or fixing a bio is a sentence to Sofie or a quick edit, not a ticket to an agency.

The Law Firm Starter plan is $79 a month, or $790 a year, with a 7-day free trial ([how SaySites works for law firms](/websites-for/law-firms), [all plans](/pricing)).

See your own site rebuilt first with a [free redesign](/redesign), or [start your 7-day free trial](/signup) and build it yourself. To understand how AI answers pick which firms to mention, read [how AI search decides which businesses to mention](/blog/how-ai-search-chooses-who-to-recommend). If you also practice in New York, our guide to [New York law firm websites after the 2026 rule changes](/blog/new-york-law-firm-website-rules) covers that state’s new rules.`,
    faq: [
      { q: 'Is my law firm website considered advertising in California?', a: 'Yes. The Business and Professions Code defines electronic media to include computer networks, and State Bar Formal Opinion 2001-155 treats a firm website as both a communication under the professional rules and an advertisement under sections 6157 to 6158.3. A blog that is part of your website is covered in the same way, according to Formal Opinion 2016-196.' },
      { q: 'What did SB 37 change for California lawyer advertising?', a: 'Effective January 1, 2026, SB 37 barred references to awards from organizations that charge or ask for payment, or that give them just for membership. It also required ads to show a California lawyer or firm name and the city, town or county of a real office, and created a civil action for misled consumers, with statutory damages of $5,000 to $100,000 per unique ad.' },
      { q: 'Can I put award badges on my Los Angeles law firm website?', a: 'Only if each award meets section 6157.2(a)(6): it must not be given simply for being a member, and the organization must not charge or ask for a fee, cost or payment for it. Check each badge on your site against both conditions. If you can’t confirm them, it is safer to remove the badge until you can.' },
      { q: 'Can my website say “no fee unless we win”?', a: 'Yes, with a companion statement. California law and Rule 7.1’s comments treat a no-fee-without-recovery statement as misleading unless it also says whether the client will owe the costs the firm advanced if there is no recovery. If clients won’t owe costs, the statute requires no extra disclosure, but saying so plainly is clearer for readers.' },
      { q: 'Can my firm advertise that we speak Spanish if no lawyer does?', a: 'Yes, if you are clear about who does. Comment [5] to Rule 7.1 allows it when the communication states, in Spanish, the job title of the person who speaks it, such as a case manager. If a lawyer practices in Spanish, you can say that directly. Immigration ads in Spanish must also state the lawyer’s active State Bar license in Spanish.' },
      { q: 'How long do I need to keep copies of my law firm’s website in California?', a: 'Section 6159.1 requires a true and correct copy of any advertisement to be kept for one year by whoever paid for it. Because a website changes over time, the practical approach is to save a dated copy of each page whenever it changes and keep each copy for at least a year.' },
      { q: 'Can I use stock photos on a California law firm website?', a: 'Yes, with care. Photos of the city, offices or courthouses are fine. Section 6157.2 bars images that purport to be your clients, or dramatizations, unless the ad discloses it, and bars images of anyone other than the lawyer presented as a lawyer. Use real photos of your attorneys and never caption stock photos as clients.' },
    ],
    published: '2026-10-13',
    status: 'published',
  },
]
