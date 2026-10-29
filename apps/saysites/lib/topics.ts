// saysites.com's evergreen sections: one hub per kind of business SaySites
// concentrates on, plus the two subjects every one of them needs (local
// search and AI answers). Each hub is a guide that stays true (no dates, no
// news), a checklist, common questions, the industry page it belongs to and
// every blog article on the subject, so search engines and readers find the
// whole body of work in one place.
//
// The blog's writing rules apply: no invented numbers, studies or quotes; an
// outside fact links to its source; never promise rankings or leads; never
// name a competitor. Bodies use the blog's Markdown subset (renderBody).

import type { Article } from './articles'

export interface Topic {
  slug: string
  // Short name, for menus and breadcrumbs.
  name: string
  // The page's title and description in search results.
  title: string
  description: string
  // The opening line under the heading.
  lede: string
  hero: { src: string; alt: string }
  body: string
  checklist: string[]
  faq: { q: string; a: string }[]
  // The industry pages (/websites-for/…) this subject belongs to.
  industries: string[]
  // Which blog articles belong here.
  match: RegExp
}

const img = (id: string, alt: string) => ({ src: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=70&w=1600`, alt })

const GOOGLE_HELPFUL = 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'
const GOOGLE_AI = 'https://developers.google.com/search/docs/appearance/ai-features'
const GOOGLE_LOCAL_SD = 'https://developers.google.com/search/docs/appearance/structured-data/local-business'
const GBP_RANKING = 'https://support.google.com/business/answer/7091'
const GBP_GUIDELINES = 'https://support.google.com/business/answer/3038177'
const ABA_RULES = 'https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/model_rules_of_professional_conduct_table_of_contents/'
const HHS_HIPAA = 'https://www.hhs.gov/hipaa/for-professionals/index.html'
const FTC_ENDORSE = 'https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides'
const FTC_HEALTH = 'https://www.ftc.gov/business-guidance/resources/health-products-compliance-guidance'
const GOOGLE_PRODUCT_SD = 'https://developers.google.com/search/docs/appearance/structured-data/product'
const MERCHANT = 'https://support.google.com/merchants/answer/188494'
const CWV = 'https://developers.google.com/search/docs/appearance/core-web-vitals'
const GOOGLE_SNIPPETS = 'https://developers.google.com/search/docs/appearance/snippet'

export const TOPICS: Topic[] = [
  {
    slug: 'law-firms',
    name: 'Law firms',
    title: 'Law Firm Website and SEO Guide: Pages, Ethics Rules, Search',
    description: 'How a law firm website earns calls: practice area pages that answer real questions, attorney advertising rules, local search and AI answers.',
    lede: 'Everything a law firm’s website needs to do: answer the questions people ask before they call, follow your state’s advertising rules, and show up when someone searches for your kind of case nearby.',
    hero: img('1589994965851-a8f479c573a9', 'Statue of Lady Justice holding scales'),
    industries: ['law-firms'],
    match: /law-firm|for-law-firms|lawyer|attorney|practice-area/i,
    body: `## What a law firm website is for

Someone looking for a lawyer is usually worried about something specific: an arrest, an injury, a divorce, an estate. They search for it, read a page or two, and decide who to call. A firm’s website does its job when that person finds a page about their exact problem, believes the firm handles it, and can reach someone without effort.

That means the most important pages on a law firm site are rarely the home page. They are the practice area pages: one page for each kind of case, written for the person who has that problem, in plain words.

## Practice area pages that answer the question

A good practice area page starts with the situation, not the firm. "Charged with DUI in Phoenix?" tells a reader they are in the right place; "Our firm has decades of combined experience" does not. Then it walks through what usually happens next, what decisions the reader faces, what the firm does at each step, and how to get in touch.

- One page per case type, not one page listing everything you do.
- The real questions clients ask in consultations, answered on the page.
- Local details that are true: the courts you appear in, the counties you cover.
- A clear next step on every screen: a phone number that can be tapped and a short form.

Google’s own guidance asks whether content is written for people first and shows first-hand expertise ([Google: creating helpful content](${GOOGLE_HELPFUL})). A page written from the questions your clients actually ask is the most direct way to meet that bar.

## Advertising rules apply to your website

In every state, a lawyer’s website is lawyer advertising. The American Bar Association’s Model Rules (Rules 7.1 to 7.3) are the starting point most states adapt, and they cover things a website does every day: claims about results, testimonials, specialist titles and how you contact prospective clients ([ABA Model Rules of Professional Conduct](${ABA_RULES})). States differ in the details: some require disclaimers next to past results, some restrict the word "specialist," some require a responsible attorney’s name and office address.

Our state-by-state articles below cover the rules for particular states. The general habits that keep a site safe are simple: never call results typical, say "past results do not guarantee a similar outcome" wherever results appear, only use testimonials that are real and permitted in your state, and check any "best" or "expert" language with your bar’s rules.

## Getting found in your area

Most people search for a lawyer with a place in mind ("near me", a city, a county). Google’s local results draw on three things it names itself: relevance, distance and prominence ([Google Business Profile: how local ranking works](${GBP_RANKING})). Your website feeds all three when each practice area page names the places you serve, your name, address and phone number match your Google Business Profile exactly, and your site tells Google what kind of business you are in structured data ([Google: local business structured data](${GOOGLE_LOCAL_SD})).

## AI answers and law firms

People increasingly ask AI tools and Google’s AI Overviews about legal problems before they search for a firm. These answers quote and link pages that state things clearly. A practice area page that answers "what happens after a first DUI arrest in Arizona" in a few direct sentences, followed by the detail, is the kind of page those answers can use ([Google: AI features and your website](${GOOGLE_AI})).

## Speed, phones and trust

Most legal searches happen on phones, often in stressful moments. A page that loads quickly, shows the phone number without hunting, and has a form short enough to finish with one thumb will turn more of the visitors you already have into calls. Every SaySites law design is built to load fast and to keep the call button in reach.`,
    checklist: [
      'A separate page for each practice area, written around the client’s situation',
      'Real client questions answered on each practice area page',
      'Your state’s required disclaimers next to any results or testimonials',
      'Attorney bios with bar admissions and the courts you appear in',
      'Name, address and phone number identical to your Google Business Profile',
      'LegalService structured data on the home page',
      'A tap-to-call number visible on every phone screen',
      'A short contact form that says not to send confidential details',
      'Pages that load fast on a phone',
    ],
    faq: [
      { q: 'Does a law firm website count as advertising?', a: 'Yes. Every state treats a lawyer’s website as advertising under its version of the ABA Model Rules 7.1 to 7.3, so claims, results, testimonials and titles on it must follow your state’s rules.' },
      { q: 'What pages should a law firm website have?', a: 'A home page, one page for each practice area, attorney bios, a contact page with your address and hours, and pages that answer common client questions. Practice area pages usually matter most for search.' },
      { q: 'Can a law firm show case results on its website?', a: 'Most states allow it with conditions, such as a disclaimer that past results do not guarantee a similar outcome. Check your state bar’s rules before publishing results.' },
      { q: 'How long does it take a law firm website to show up in Google?', a: 'Google decides that, and no one can promise a ranking or a date. A site that answers real questions, loads fast and matches your Google Business Profile gives Google what it asks for.' },
    ],
  },
  {
    slug: 'medical-and-dental',
    name: 'Medical & dental',
    title: 'Medical and Dental Practice Website Guide: Patients, Rules, SEO',
    description: 'What a medical or dental practice website needs: pages patients can act on, health advertising and privacy rules, and being found locally.',
    lede: 'How a medical or dental practice website helps patients choose you and book: clear service pages, insurance and hours up front, careful health claims, and local search done right.',
    hero: img('1631217868264-e5b90bb7e133', 'Doctor talking with a patient in an exam room'),
    industries: ['medical-practices', 'dentists'],
    match: /medical|dental|dentist|doctor|clinic|practice-website/i,
    body: `## What patients look for first

A patient choosing a practice usually wants to know a handful of things quickly: do you treat my problem, do you take my insurance, are you near me, are you open when I can come, and can I book. A practice website that answers those questions on the first screen of a phone does most of its work before anyone reads a paragraph.

## Service pages patients can act on

Each treatment or service deserves its own page: what it is, who it is for, what a visit involves, how to prepare, and how to book. Plain language matters more here than anywhere. Write for a patient who has never heard the clinical term, then add the term so they can find it again.

- One page per service or treatment, not a single list.
- What to expect at the visit, step by step.
- Insurance, payment options and new-patient forms easy to find.
- Hours, parking and accessibility on the contact page.
- Providers’ bios with credentials and the services each one offers.

## Health claims and testimonials

Health advertising has rules that general marketing does not. The Federal Trade Commission expects health claims to be backed by competent and reliable scientific evidence ([FTC: health products compliance guidance](${FTC_HEALTH})), and testimonials must reflect honest experiences and not imply results are typical when they aren’t ([FTC: endorsement guides](${FTC_ENDORSE})). States add their own rules for physicians and dentists, which our city articles below cover.

The safe habits: describe what a treatment is and does, not miracle outcomes; show real reviews and only with the patient’s permission; avoid before-and-after photos unless they are genuine and permitted where you practice.

## Privacy on a practice website

A contact form is not a patient portal. HIPAA protects patients’ health information held by practices and their vendors ([HHS: HIPAA for professionals](${HHS_HIPAA})). Keep website forms for appointment requests and general questions, say on the form not to include medical details, and use your patient portal or EHR for anything clinical.

## Local search for practices

Patients search with a place in mind. Google’s local results weigh relevance, distance and prominence ([Google Business Profile: how local ranking works](${GBP_RANKING})). Keep your name, address, phone number and hours identical on your website and Google Business Profile, give each location its own page if you have several, and mark the practice up with structured data so Google knows exactly what you are ([Google: local business structured data](${GOOGLE_LOCAL_SD})).

## Speed and accessibility

Patients include people with low vision, older patients and people on slow connections. Large readable text, strong contrast, buttons big enough to tap and pages that load quickly help every patient, and they are the same qualities search engines measure ([Google: Core Web Vitals](${CWV})).`,
    checklist: [
      'A page for each service or treatment, in plain language',
      'Insurance accepted and payment options easy to find',
      'Hours, address, parking and accessibility details',
      'Provider bios with credentials',
      'A booking or request form that asks for no medical details',
      'Health claims you can back up, and no "typical results" testimonials',
      'Name, address and phone identical to your Google Business Profile',
      'MedicalBusiness or Dentist structured data',
      'Readable text and large tap targets on phones',
    ],
    faq: [
      { q: 'Can a medical practice website have a contact form?', a: 'Yes, for appointment requests and general questions. Ask patients not to include medical details and keep clinical communication in your patient portal, since website forms are not built for protected health information.' },
      { q: 'Can a practice post patient testimonials?', a: 'With the patient’s permission and if they reflect honest experiences. The FTC’s endorsement guides say testimonials must not imply results are typical when they are not, and some states add rules for health professionals.' },
      { q: 'What should be on a dental practice home page?', a: 'The services you offer, insurance you take, your location and hours, a way to book, and a few words about your dentists. Patients look for these before anything else.' },
      { q: 'Should each location have its own page?', a: 'Yes. A page per location with its own address, hours, phone and directions helps patients and lets Google match each office to nearby searches.' },
    ],
  },
  {
    slug: 'med-spas',
    name: 'Med spas',
    title: 'Med Spa Website Guide: Treatments, Claims, Booking and SEO',
    description: 'How a med spa website books clients: treatment pages, who performs what, careful results claims and photos, booking and local search.',
    lede: 'A med spa website sells trust as much as treatments: who performs each service, what results are realistic, how booking works, and how clients nearby find you.',
    hero: img('1570172619644-dfd03ed5d881', 'Facial treatment at a spa'),
    industries: ['med-spas'],
    match: /med-spa|medspa|aesthetic/i,
    body: `## What clients want to know

People considering an aesthetic treatment want to know what it is, whether it suits them, who will perform it, what it costs, what recovery looks like and how to book. A med spa site that answers those questions plainly feels safer than one that leads with glossy promises.

## Treatment pages

Give each treatment its own page: what it does, who it suits and who it doesn’t, how many sessions are usual, what to expect afterwards, and who on your team performs it. Clients researching injectables or lasers often compare several providers, so specifics win.

- One page per treatment, written for someone new to it.
- Who performs each treatment and their credentials.
- Downtime, aftercare and when results usually appear.
- Pricing or "from" prices if you publish them, and how consultations work.

## Claims, photos and reviews

Aesthetic medicine is health care, and the advertising rules follow. Health claims need evidence ([FTC: health products compliance guidance](${FTC_HEALTH})), and testimonials or reviews you feature must be genuine and must not suggest unusual results are typical ([FTC: endorsement guides](${FTC_ENDORSE})). Many states also regulate who may perform or supervise treatments and how that is described, which our state articles below cover.

Before-and-after photos should be real, unretouched, of your own clients, shown with their consent and with a note that results vary.

## Booking

Most med spa clients book on a phone. Put the booking button on every treatment page, keep the number of steps small, and show consultation availability clearly. If you use a booking platform, link to it directly from each treatment.

## Local search

Clients look for treatments near them. Keep your name, address, phone and hours identical on your site and Google Business Profile, name the neighborhoods and towns you serve on your pages, and add structured data so Google knows you are a medical spa and where you are ([Google: local business structured data](${GOOGLE_LOCAL_SD})).`,
    checklist: [
      'A page for each treatment, including who it suits and who it doesn’t',
      'Who performs each treatment, with credentials',
      'Downtime, aftercare and realistic timelines',
      'Genuine before-and-after photos, with consent and a results-vary note',
      'A booking button on every treatment page',
      'No "guaranteed" or "permanent" claims you can’t support',
      'Name, address and phone identical to your Google Business Profile',
      'MedicalBusiness structured data',
    ],
    faq: [
      { q: 'Can a med spa post before-and-after photos?', a: 'Genuine photos of your own clients, shared with their consent and without retouching, are generally allowed. Add a note that results vary, and check your state’s rules for health advertising.' },
      { q: 'Should a med spa publish prices?', a: 'Many do, as "from" prices or ranges, because clients compare. If prices depend on a consultation, say so and explain how consultations work.' },
      { q: 'Do I need to say who performs treatments?', a: 'Clients want to know, and several states regulate who may perform or supervise aesthetic treatments. Naming your providers and their credentials builds trust and keeps descriptions accurate.' },
    ],
  },
  {
    slug: 'home-services',
    name: 'Home services',
    title: 'Plumber, HVAC, Electrician and Roofer Website Guide for Calls',
    description: 'How a plumbing, HVAC, electrical or roofing website gets calls: service and area pages, license numbers, emergency calls, reviews and local search.',
    lede: 'For plumbers, HVAC companies, electricians and roofers: a website that turns an urgent search into a phone call, shows you’re licensed, and covers every town you serve.',
    hero: img('1749532125405-70950966b0e5', 'Plumber repairing plumbing in a bathroom'),
    industries: ['plumbers', 'hvac-companies', 'electricians', 'roofers'],
    match: /plumb|hvac|electric|roof|contractor/i,
    body: `## Urgent searches, fast decisions

A burst pipe, a dead furnace or a leaking roof sends people to their phones with one goal: get someone out today. The site that wins is the one that loads fast, shows a phone number immediately, says clearly that you handle this problem in this area, and makes calling one tap.

## Service pages

Give each main service its own page: water heaters, drain cleaning, AC repair, panel upgrades, roof replacement. Say what the problem looks like, what you do about it, whether you offer emergency service and how to book. People search for the problem ("no hot water", "AC blowing warm air"), so name problems as well as services.

- One page per main service, named the way customers describe the problem.
- Emergency availability stated plainly if you offer it.
- What happens when they call: who answers, how quickly you schedule.
- Photos of your own team, trucks and work rather than stock.

## Your license, on the page

Most states require contractors to hold a license, and many require the license number to appear in advertising. Showing it on every page and in the footer is both a legal habit and a trust signal. Our city articles below cover the rules in particular states.

## Area pages

Home service businesses travel to customers, and Google treats them as service-area businesses ([Google Business Profile guidelines](${GBP_GUIDELINES})). On your website, list the towns you serve and, where you do real work in a town, give it a page that says what you do there. Never create pages for places you don’t serve or copy the same text across dozens of towns; Google’s guidance warns against pages made for search engines rather than people ([Google: creating helpful content](${GOOGLE_HELPFUL})).

## Reviews

Reviews are part of how Google judges prominence in local results ([Google Business Profile: how local ranking works](${GBP_RANKING})). Ask every happy customer, make it easy with a direct link, never offer anything in exchange and never filter for positive reviews only. Show a few real reviews on your site with the customer’s permission.

## Speed on a phone

Most of these searches happen on phones, sometimes with weak signal in a basement or attic. A light, fast page with the call button at the top beats a heavy one with a video background ([Google: Core Web Vitals](${CWV})).`,
    checklist: [
      'A tap-to-call phone number at the top of every page',
      'A page for each main service, named the way customers describe problems',
      'Emergency service stated plainly (if you offer it)',
      'Your license number on every page',
      'The towns you serve, with real pages only where you work',
      'Photos of your own team and work',
      'A steady flow of honest Google reviews',
      'Name and phone identical to your Google Business Profile',
      'Plumber, HVACBusiness, Electrician or RoofingContractor structured data',
    ],
    faq: [
      { q: 'Do I need to show my contractor license number on my website?', a: 'Many states require it in advertising, and it is a strong trust signal everywhere. Put it in the footer of every page.' },
      { q: 'Should I make a page for every town I serve?', a: 'Only for towns where you really work, and only with useful, specific content. Copies of the same page with the town name swapped help no one and go against Google’s guidance.' },
      { q: 'Can I offer a discount for Google reviews?', a: 'No. Google’s policies prohibit incentives for reviews. Ask every customer, make it easy with a link, and accept whatever they write.' },
      { q: 'What matters most on a home service website?', a: 'Being reachable: a phone number visible immediately, pages that load fast on a phone, and a clear statement that you fix this problem in this area.' },
    ],
  },
  {
    slug: 'online-shops',
    name: 'Online shops',
    title: 'Small Online Shop Guide: Product Pages, Google, Policies',
    description: 'For small shops selling online: product pages that convert, free listings on Google, product structured data, and shipping and return policies.',
    lede: 'Selling online as a small shop: product pages people trust, getting your products into Google for free, and the policies that shoppers and Google both look for.',
    hero: img('1546213290-e1b492ab3eee', 'Customer browsing inside a small shop'),
    industries: ['shops', 'bakeries-and-cafes'],
    match: /shop|product|shipping|store|merchant|e-?commerce/i,
    body: `## Product pages that sell

A shopper deciding whether to buy from a small shop they don’t know needs the same things they get from a big one: clear photos, an honest description, the price, whether it’s in stock, how it ships and what happens if it’s wrong. Each missing piece is a reason to leave.

- Several real photos, including scale and detail.
- A description that answers the questions customers ask in person.
- Price, availability and variants that are always current.
- Shipping cost and timing stated before checkout.
- A link to your return policy on every product page.

## Free listings on Google

Google shows products from shops in its Shopping results and other surfaces, and listing them can be free through Google Merchant Center ([Google: free listings](${MERCHANT})). Your product data needs to match your website exactly: same price, same availability, same title.

## Product structured data

Product markup tells Google a page’s product, price, availability and shipping in a form it reads directly, which can make your listing eligible for richer results ([Google: product structured data](${GOOGLE_PRODUCT_SD})). Every SaySites shop adds it automatically and keeps it in step with your stock.

## Policies shoppers check

Shoppers look for shipping and return policies before buying from a shop they don’t know, and Google lets merchants show return and shipping information too. Write them in plain words: what it costs, how long it takes, what can come back and who pays.

## A local shop online

If you also have a storefront, say so everywhere: your address, hours and whether people can pick up in store. Local shoppers often check online before visiting, and local business structured data tells Google where your shop is and when it is open ([Google: local business structured data](${GOOGLE_LOCAL_SD})).`,
    checklist: [
      'Several real photos on every product',
      'Price and stock that are always current',
      'Shipping cost and timing shown before checkout',
      'A clear return policy linked from every product',
      'Product structured data on every product page',
      'A Google Merchant Center account with free listings turned on',
      'Store address, hours and pickup details if you have a storefront',
    ],
    faq: [
      { q: 'Can a small shop list products on Google for free?', a: 'Yes. Google Merchant Center offers free listings, and your product information needs to match your website.' },
      { q: 'What is product structured data?', a: 'Code on a product page that tells Google the product’s name, price, availability and more, so it can understand and show the product accurately.' },
      { q: 'Do I need a return policy?', a: 'Shoppers look for one before buying from a shop they don’t know, and it should be easy to find from every product page.' },
    ],
  },
  {
    slug: 'local-seo',
    name: 'Local search',
    title: 'Local SEO for Small Businesses: A Plain-English Guide',
    description: 'How local businesses show up in Google: Business Profile, reviews, service areas, page titles, structured data and fast pages, from Google’s own guidance.',
    lede: 'How Google decides which local businesses to show, and the practical things any business can do about it, explained from Google’s own documentation.',
    hero: img('1758274251589-fb70a3654a1b', 'Customers with shopping bags on a sidewalk'),
    industries: [],
    match: /google-business|local|reviews|service-area|structured-data|titles|fast-enough|home-page|google-picks/i,
    body: `## How local results work

Google says its local results are based mainly on three things: relevance (how well a business matches the search), distance (how far it is from the searcher or the place they named) and prominence (how well known it is, including reviews and links) ([Google Business Profile: how local ranking works](${GBP_RANKING})). There is no way to pay for a better local ranking, and no one can guarantee one.

## Your Google Business Profile

The profile is often the first thing a local searcher sees. Choose the most specific category that fits, fill in hours, services and attributes, add real photos, and keep everything current. Google’s guidelines are strict about the business name: use your real name, without added keywords or locations ([Google Business Profile guidelines](${GBP_GUIDELINES})).

## Your website supports the profile

Your website is where Google and customers confirm what the profile says. Use the same name, address and phone number everywhere. Give each service its own page. Mark the business up with local business structured data so Google reads your details directly ([Google: local business structured data](${GOOGLE_LOCAL_SD})).

## Reviews

Reviews feed prominence. Ask every customer, make it easy with a direct link, reply to reviews (including critical ones) calmly, and never offer incentives or ask only happy customers.

## Titles and descriptions

The page title and description are often what people see in results. Google writes its own snippet sometimes, but a clear title that names the service and place, and a description that says what the page offers, give it the best material ([Google: title links and snippets](${GOOGLE_SNIPPETS})).

## Speed and phones

Local searches happen on phones. Google measures how real visitors experience your pages with Core Web Vitals ([Google: Core Web Vitals](${CWV})). Fast, simple pages help both rankings and the person waiting for them to load.`,
    checklist: [
      'A complete Google Business Profile with the most specific category',
      'Your real business name, with no added keywords',
      'Name, address and phone identical on your site and profile',
      'A page for each service you offer',
      'Local business structured data on your site',
      'A habit of asking every customer for a review',
      'Clear page titles that name the service and place',
      'Pages that load fast on a phone',
    ],
    faq: [
      { q: 'How does Google rank local businesses?', a: 'Google says local results are based mainly on relevance, distance and prominence. You can improve relevance and prominence; distance depends on where the searcher is.' },
      { q: 'Can I pay Google to rank higher in local results?', a: 'No. Ads appear separately and are labeled. Local rankings can’t be bought.' },
      { q: 'Should I add keywords to my business name?', a: 'No. Google’s guidelines require your real business name, and adding keywords can get a profile suspended.' },
      { q: 'Do I need a website if I have a Google Business Profile?', a: 'A website gives Google and customers a fuller picture: your services in detail, your story and a place to contact you that you control. Most businesses benefit from both.' },
    ],
  },
  {
    slug: 'ai-search',
    name: 'AI search',
    title: 'AI Search for Businesses: Being Found in AI Answers',
    description: 'How AI Overviews and AI assistants choose which businesses and pages to mention, and how to write pages they can understand and quote.',
    lede: 'People now ask AI tools and Google’s AI Overviews before they search. Here is what those answers draw on, and how to write pages they can use.',
    hero: img('1677442136019-21780ecad995', 'Abstract illustration of artificial intelligence'),
    industries: [],
    match: /\bai\b|ai-|answers/i,
    body: `## What changed

Google’s AI Overviews and AI assistants answer questions directly, often naming businesses and linking to pages. Google says AI features draw on the same core ranking systems as search, and that there is no special markup or trick needed to appear in them ([Google: AI features and your website](${GOOGLE_AI})).

## What these answers can use

An AI answer is assembled from pages that state things clearly. A page that answers a question directly, near the top, in plain sentences, is easier to understand and quote than one where the answer is buried in marketing language.

- Answer the question in the first sentences, then give the detail.
- Use headings that match the questions people ask.
- State facts plainly: what you do, where, for whom, how to reach you.
- Keep your business details identical everywhere they appear.

## Helpful content still decides

Google’s guidance on helpful content applies to AI features too: content written for people, showing real expertise and first-hand experience ([Google: creating helpful content](${GOOGLE_HELPFUL})). Pages produced at scale to catch searches, without adding anything useful, are the kind Google says it works to show less.

## Structured data helps machines read you

Structured data tells search engines exactly what your business is, where it is and what each page is about. It is not a shortcut into AI answers, but it removes guesswork about your details ([Google: local business structured data](${GOOGLE_LOCAL_SD})).

## Measuring where you stand

You can’t control which businesses an AI answer mentions, but you can see whether your pages answer the questions people ask. SaySites shows each page’s readiness for AI answers in your dashboard, and our free redesign builds every page to answer first.`,
    checklist: [
      'Each page answers its main question in the first sentences',
      'Headings that match the questions people ask',
      'Plain statements of what you do, where and for whom',
      'Business details identical across your site and profiles',
      'Structured data describing your business',
      'Content written from real experience, not produced to catch searches',
    ],
    faq: [
      { q: 'Is there special markup to appear in Google’s AI Overviews?', a: 'No. Google says AI features use the same core systems as search and require no special markup. Clear, helpful pages are what they draw on.' },
      { q: 'Can I pay to be mentioned in AI answers?', a: 'No one can sell a guaranteed mention in an AI answer. What you can control is whether your pages clearly answer the questions people ask.' },
      { q: 'Does structured data help with AI answers?', a: 'It helps search engines read your details accurately. It is not a guarantee of being mentioned, but it removes guesswork about who you are and what you do.' },
    ],
  },
]

export function topic(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug)
}

// The topics an article belongs to, by what it's about (its address and
// title). Industry topics come before the general ones.
export function topicsOf(a: Pick<Article, 'slug' | 'title'>): Topic[] {
  return TOPICS.filter((t) => t.match.test(a.slug) || t.match.test(a.title))
}

export function articlesFor<T extends Pick<Article, 'slug' | 'title'>>(t: Topic, all: T[]): T[] {
  return all.filter((a) => topicsOf(a).some((x) => x.slug === t.slug))
}
