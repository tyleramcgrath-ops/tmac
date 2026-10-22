// The web and SEO glossary at /guides/glossary: plain-English definitions of
// the words small business owners meet when they deal with websites, Google
// and AI answers. Same rules as the blog: no invented numbers, outside facts
// link to their source, nothing promises rankings, and no em dashes.

export type GlossaryTerm = {
  slug: string
  term: string
  group: GlossaryGroup
  // One to three plain sentences.
  def: string
  // The official page an outside fact comes from.
  source?: [label: string, url: string]
  // Where on saysites.com to read more.
  more?: [label: string, path: string]
}

export const GLOSSARY_GROUPS = ['Search basics', 'Local search', 'AI search', 'Speed and quality', 'Structured data', 'Website basics', 'Rules and trust'] as const
export type GlossaryGroup = (typeof GLOSSARY_GROUPS)[number]

const CWV = 'https://developers.google.com/search/docs/appearance/core-web-vitals'
const GOOGLE_AI = 'https://developers.google.com/search/docs/appearance/ai-features'
const SNIPPETS = 'https://developers.google.com/search/docs/appearance/snippet'
const TITLE_LINKS = 'https://developers.google.com/search/docs/appearance/title-link'
const SPAM = 'https://developers.google.com/search/docs/essentials/spam-policies'
const HELPFUL = 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'
const SD_INTRO = 'https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data'
const LOCAL_SD = 'https://developers.google.com/search/docs/appearance/structured-data/local-business'
const GBP_RANKING = 'https://support.google.com/business/answer/7091'
const GBP_GUIDELINES = 'https://support.google.com/business/answer/3038177'
const SERVICE_AREAS = 'https://support.google.com/business/answer/9157481'
const REVIEW_TIPS = 'https://support.google.com/business/answer/3474122'
const ROBOTS = 'https://developers.google.com/search/docs/crawling-indexing/robots/intro'
const SITEMAPS = 'https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview'
const CANONICAL = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'
const HOW_SEARCH = 'https://developers.google.com/search/docs/fundamentals/how-search-works'
const SEARCH_CONSOLE = 'https://support.google.com/webmasters/answer/9128668'
const MOBILE_FIRST = 'https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing'
const PAGE_EXPERIENCE = 'https://developers.google.com/search/docs/appearance/page-experience'
const OPENAI_BOTS = 'https://developers.openai.com/api/docs/bots'
const ADA_WEB = 'https://www.ada.gov/resources/web-guidance/'
const WCAG = 'https://www.w3.org/WAI/standards-guidelines/wcag/'
const HHS_HIPAA = 'https://www.hhs.gov/hipaa/for-professionals/index.html'
const FTC_ENDORSE = 'https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides'
const ABA_RULES = 'https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/model_rules_of_professional_conduct_table_of_contents/'

export const GLOSSARY: GlossaryTerm[] = [
  // Search basics
  { slug: 'seo', term: 'SEO (search engine optimization)', group: 'Search basics', def: 'The work of making a website easy for search engines to find, understand and show to the right people. Good SEO is mostly good websites: clear pages about real topics, fast loading, and accurate details.', source: ['Google: how Search works', HOW_SEARCH], more: ['Local SEO guide', '/guides/local-seo'] },
  { slug: 'crawling', term: 'Crawling', group: 'Search basics', def: 'How a search engine discovers pages: an automated program, called a crawler or bot, follows links and fetches pages. A page that cannot be crawled cannot be shown in results.', source: ['Google: how Search works', HOW_SEARCH] },
  { slug: 'indexing', term: 'Indexing', group: 'Search basics', def: 'After crawling a page, a search engine analyses it and may store it in its index, the giant library it searches when someone types a query. Only indexed pages can appear in results, including AI answers built from the index.', source: ['Google: how Search works', HOW_SEARCH] },
  { slug: 'serp', term: 'SERP (search results page)', group: 'Search basics', def: 'The page you see after searching. Today it often mixes ordinary links with a map and local listings, ads, questions people also ask, and sometimes an AI-written summary at the top.' },
  { slug: 'title-link', term: 'Title link', group: 'Search basics', def: 'The clickable headline for a page in Google’s results. Google usually builds it from the page’s title tag and main heading, so each page needs a clear, unique title that says what the page is.', source: ['Google: title links', TITLE_LINKS] },
  { slug: 'meta-description', term: 'Meta description', group: 'Search basics', def: 'A short summary written into a page’s code. Google may show it as the snippet under the title link, though it often writes its own from the page text. A good description helps people decide to click.', source: ['Google: snippets', SNIPPETS] },
  { slug: 'snippet', term: 'Snippet', group: 'Search basics', def: 'The short text under a result’s title link that previews the page. Google generates it mainly from the page content, which is why answering a question plainly near the top of a page matters.', source: ['Google: snippets', SNIPPETS] },
  { slug: 'keyword', term: 'Keyword', group: 'Search basics', def: 'The words people type or say when they search, such as “emergency plumber near me”. The useful question is not which keywords to repeat, but which questions your customers ask and whether a page answers each one.' },
  { slug: 'canonical-url', term: 'Canonical URL', group: 'Search basics', def: 'When the same content is reachable at several addresses, the canonical is the one you tell search engines is the main version. It stops duplicate copies from competing with each other.', source: ['Google: duplicate URLs', CANONICAL] },
  { slug: 'xml-sitemap', term: 'XML sitemap', group: 'Search basics', def: 'A file that lists the pages on a website so search engines can find them, along with when they last changed. It helps discovery, though it does not guarantee a page will be indexed or ranked.', source: ['Google: sitemaps', SITEMAPS] },
  { slug: 'robots-txt', term: 'robots.txt', group: 'Search basics', def: 'A small text file at the root of a website that tells crawlers which parts they may fetch. A mistake in it can hide a whole site from search, so it is worth checking after any website change.', source: ['Google: robots.txt', ROBOTS] },
  { slug: 'search-console', term: 'Google Search Console', group: 'Search basics', def: 'A free Google tool that shows how your site performs in Google Search: the searches that show your pages, clicks and impressions, indexing problems and more. It is the most reliable view of your own search traffic.', source: ['Google: Search Console', SEARCH_CONSOLE] },
  { slug: 'backlink', term: 'Backlink', group: 'Search basics', def: 'A link to your website from another website. Links help search engines discover pages and understand how they relate. Buying links or trading them to manipulate rankings is against Google’s spam policies.', source: ['Google: spam policies', SPAM] },
  { slug: 'spam-policies', term: 'Spam policies', group: 'Search basics', def: 'Google’s published rules on tactics that can get pages demoted or removed, such as hidden text, keyword stuffing, link schemes and mass-produced pages made only to rank. Every shortcut that promises fast rankings should be checked against them.', source: ['Google: spam policies', SPAM] },
  { slug: 'helpful-content', term: 'Helpful, people-first content', group: 'Search basics', def: 'Google’s description of content made mainly to help people rather than to attract search visits. Its guidance asks whether a page shows real expertise, answers the question fully and leaves the reader satisfied.', source: ['Google: helpful content', HELPFUL] },

  // Local search
  { slug: 'local-seo', term: 'Local SEO', group: 'Local search', def: 'SEO for businesses that serve customers in a place: your Google Business Profile, your reviews, consistent contact details and service pages that name the areas you serve.', more: ['Local SEO guide', '/guides/local-seo'] },
  { slug: 'google-business-profile', term: 'Google Business Profile', group: 'Local search', def: 'The free listing that shows your business on Google Maps and in local results, with your hours, phone, photos and reviews. Google sets guidelines for what a profile may contain, including the business name.', source: ['Google: profile guidelines', GBP_GUIDELINES], more: ['How to connect it', '/connect/google-business-profile'] },
  { slug: 'local-pack', term: 'Local pack', group: 'Local search', def: 'The map and short list of nearby businesses Google shows for searches with local intent, such as “dentist near me”. Google says relevance, distance and prominence decide which businesses appear.', source: ['Google: local ranking', GBP_RANKING] },
  { slug: 'nap', term: 'NAP (name, address, phone)', group: 'Local search', def: 'Your business name, address and phone number. Keeping them identical on your website, Google profile and directory listings helps search engines and AI answers trust that they all describe the same business.' },
  { slug: 'service-area-business', term: 'Service area business', group: 'Local search', def: 'A business that visits customers rather than serving them at its own address, such as a plumber or mobile groomer. Google lets these businesses hide their address and list the areas they serve instead.', source: ['Google: service areas', SERVICE_AREAS], more: ['Home services guide', '/guides/home-services'] },
  { slug: 'reviews', term: 'Reviews', group: 'Local search', def: 'Ratings and comments customers leave on your profile. Google recommends asking customers for reviews and replying to them. Honest reviews, answered politely, also tell future customers how you treat people.', source: ['Google: review tips', REVIEW_TIPS] },

  // AI search
  { slug: 'ai-overview', term: 'AI Overview', group: 'AI search', def: 'A written summary Google shows above some search results, with links to the pages it drew on. Google says pages need only be indexed and eligible for a snippet to be used; there is no special markup to get in.', source: ['Google: AI features', GOOGLE_AI], more: ['AI search guide', '/guides/ai-search'] },
  { slug: 'ai-mode', term: 'AI Mode', group: 'AI search', def: 'A Google Search experience where people ask longer questions and get a conversational, AI-written answer with links. Google’s guidance for appearing in it is the same as for AI Overviews.', source: ['Google: AI features', GOOGLE_AI] },
  { slug: 'answer-engine', term: 'Answer engine', group: 'AI search', def: 'A search tool that replies with a written answer rather than a list of links, such as an AI assistant with web search. The sources it cites are the new version of a top result.', more: ['How AI search chooses', '/blog/how-ai-search-chooses-who-to-recommend'] },
  { slug: 'citation', term: 'Citation (in an AI answer)', group: 'AI search', def: 'A link to a source shown with an AI-written answer. Being cited puts your business in front of someone at the moment they are deciding, and it is the main way AI answers send visitors to websites.' },
  { slug: 'ai-crawler', term: 'AI crawler', group: 'AI search', def: 'A bot an AI company uses to fetch web pages. Some find pages for search answers and others gather data for training. OpenAI, for example, documents separate bots for each, controlled independently in robots.txt.', source: ['OpenAI: crawlers', OPENAI_BOTS] },
  { slug: 'geo', term: 'GEO (generative engine optimization)', group: 'AI search', def: 'A name for making pages easy for AI answers to understand and cite. In practice it overlaps almost completely with good SEO: indexable pages, clear answers near the top, real specifics and consistent business details.', more: ['Write pages AI can quote', '/blog/write-pages-ai-answers-can-quote'] },

  // Speed and quality
  { slug: 'core-web-vitals', term: 'Core Web Vitals', group: 'Speed and quality', def: 'Three measures Google uses for real visitors’ experience: how fast the main content appears (LCP), how quickly the page responds to taps (INP) and how much the layout jumps around (CLS).', source: ['Google: Core Web Vitals', CWV] },
  { slug: 'lcp', term: 'LCP (Largest Contentful Paint)', group: 'Speed and quality', def: 'How long it takes for the biggest piece of content, usually the main image or heading, to appear. Google suggests it should happen within 2.5 seconds of the page starting to load. Heavy images and slow servers are the usual culprits.', source: ['Google: Core Web Vitals', CWV] },
  { slug: 'inp', term: 'INP (Interaction to Next Paint)', group: 'Speed and quality', def: 'How quickly a page visibly responds when someone taps or clicks. Google suggests keeping it under 200 milliseconds. Too much JavaScript, often from plugins and trackers, is the common cause of slow responses.', source: ['Google: Core Web Vitals', CWV] },
  { slug: 'cls', term: 'CLS (Cumulative Layout Shift)', group: 'Speed and quality', def: 'How much content jumps around while a page loads, such as a button moving just as you tap it. Google suggests a score under 0.1. Images without set sizes and late-loading banners are the usual causes.', source: ['Google: Core Web Vitals', CWV] },
  { slug: 'mobile-first-indexing', term: 'Mobile-first indexing', group: 'Speed and quality', def: 'Google mainly uses the mobile version of a page for indexing and ranking. If something is missing or broken on phones, Google may not see it at all, so the phone version is the real website.', source: ['Google: mobile-first indexing', MOBILE_FIRST] },
  { slug: 'https', term: 'HTTPS', group: 'Speed and quality', def: 'The secure version of the web address, shown with a padlock in the browser. It encrypts what visitors send, such as contact form details, and Google’s page experience guidance asks site owners to serve pages over it.', source: ['Google: page experience', PAGE_EXPERIENCE] },

  // Structured data
  { slug: 'structured-data', term: 'Structured data', group: 'Structured data', def: 'Labels added to a page’s code that state facts in a form machines read reliably: this is a business, here are its hours, this is a product and its price. It can make a page eligible for richer results.', source: ['Google: structured data', SD_INTRO], more: ['Structured data guide', '/blog/structured-data-for-local-businesses'] },
  { slug: 'schema-org', term: 'Schema.org', group: 'Structured data', def: 'The shared vocabulary most structured data uses, maintained by the major search engines together. It defines types such as LocalBusiness, Attorney, Dentist, Product and FAQPage, and the properties each can have.', source: ['Google: structured data', SD_INTRO] },
  { slug: 'json-ld', term: 'JSON-LD', group: 'Structured data', def: 'The format Google recommends for adding structured data: a small block of code in the page that lists the facts, separate from what visitors see. It is easy to keep accurate because it sits in one place.', source: ['Google: structured data', SD_INTRO] },
  { slug: 'local-business-markup', term: 'LocalBusiness markup', group: 'Structured data', def: 'Structured data that describes a local business: name, address, phone, hours, location and more. Google uses it to understand business details, and every fact in it must match what the page shows.', source: ['Google: local business data', LOCAL_SD] },
  { slug: 'rich-result', term: 'Rich result', group: 'Structured data', def: 'A search result with extras beyond the title and snippet, such as star ratings, prices or event dates. Structured data makes a page eligible, but Google decides whether to show one.', source: ['Google: structured data', SD_INTRO] },

  // Website basics
  { slug: 'domain', term: 'Domain', group: 'Website basics', def: 'Your website’s address, such as yourfirm.com. You rent it yearly from a registrar. Make sure it is registered in your business’s name and that you can log in to the account, whoever built your site.', more: ['Connect a domain', '/connect'] },
  { slug: 'dns', term: 'DNS', group: 'Website basics', def: 'The internet’s address book: settings at your domain registrar that point your domain to the server hosting your website and to the service handling your email. Changing one record wrong can take a site or inbox offline.' },
  { slug: 'hosting', term: 'Hosting', group: 'Website basics', def: 'The servers that store your website and send it to visitors. Good hosting is fast, secure, backed up and kept up to date; on SaySites it is included and handled for you.', more: ['Pricing', '/pricing'] },
  { slug: 'cms', term: 'CMS (content management system)', group: 'Website basics', def: 'Software for editing a website without writing code, such as WordPress. Most need plugins, updates and security care; SaySites replaces the editor with plain requests like “add our new hours”.', more: ['Why switch', '/redesign'] },
  { slug: 'landing-page', term: 'Landing page', group: 'Website basics', def: 'A page built for one purpose, such as one service in one town or one offer from an ad. It works best when it answers one question fully and makes the next step, a call or form, obvious.' },
  { slug: 'conversion', term: 'Conversion', group: 'Website basics', def: 'A visitor doing what you hoped, such as calling, booking or sending a form. Traffic only matters if it converts, so measure calls and form requests, not just visits.' },
  { slug: 'call-to-action', term: 'Call to action', group: 'Website basics', def: 'The button or link that asks for the next step: “Book a consultation”, “Call now”, “Get a quote”. One clear action per page, repeated where people finish reading, beats several competing ones.' },

  // Rules and trust
  { slug: 'accessibility', term: 'Website accessibility', group: 'Rules and trust', def: 'Making a site usable by people with disabilities, including those using screen readers or keyboards. The Department of Justice has published guidance on web accessibility under the ADA for businesses open to the public.', source: ['ADA.gov: web guidance', ADA_WEB] },
  { slug: 'wcag', term: 'WCAG', group: 'Rules and trust', def: 'The Web Content Accessibility Guidelines from the W3C, the widely used technical standard for accessible websites. It covers things like text alternatives for images, colour contrast and keyboard use.', source: ['W3C: WCAG', WCAG] },
  { slug: 'hipaa', term: 'HIPAA', group: 'Rules and trust', def: 'The US law protecting health information. For a practice website it matters most for forms and messaging that collect patient details, which need the right safeguards and agreements with the companies that handle them.', source: ['HHS: HIPAA for professionals', HHS_HIPAA], more: ['Medical and dental guide', '/guides/medical-and-dental'] },
  { slug: 'endorsement-guides', term: 'FTC Endorsement Guides', group: 'Rules and trust', def: 'The Federal Trade Commission’s guidance on testimonials and reviews in advertising. It says endorsements must reflect honest experience, and connections such as payments or free services must be disclosed.', source: ['FTC: Endorsement Guides', FTC_ENDORSE] },
  { slug: 'attorney-advertising-rules', term: 'Attorney advertising rules', group: 'Rules and trust', def: 'Rules on how lawyers may market their services, set by each state and largely modelled on the ABA Model Rules. They cover misleading statements, claims about results and specialization. Check your own state’s version.', source: ['ABA: Model Rules', ABA_RULES], more: ['Law firm guide', '/guides/law-firms'] },
]

export const glossaryBy = (group: GlossaryGroup) => GLOSSARY.filter((t) => t.group === group)
