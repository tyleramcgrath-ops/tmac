// Pillar articles: the long, evergreen checklists and how-tos for the
// businesses SaySites concentrates on, each tied to its guide (/guides/…).
// Scheduled one a day like the rest (lib/articles-scheduled), and held to
// the same rules: every outside fact links to its source, no invented
// numbers, no promises of rankings or leads, no competitors named.

import type { Article } from './articles'

const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=70&w=1600`

const ABA_RULES = 'https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/model_rules_of_professional_conduct_table_of_contents/'
const HELPFUL = 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'
const LOCAL_RANKING = 'https://support.google.com/business/answer/7091'
const GBP_GUIDELINES = 'https://support.google.com/business/answer/3038177'
const REVIEW_TIPS = 'https://support.google.com/business/answer/3474122'
const SERVICE_AREAS = 'https://support.google.com/business/answer/9157481'
const LOCAL_SD = 'https://developers.google.com/search/docs/appearance/structured-data/local-business'
const TITLE_LINKS = 'https://developers.google.com/search/docs/appearance/title-link'
const SNIPPETS = 'https://developers.google.com/search/docs/appearance/snippet'
const CWV = 'https://developers.google.com/search/docs/appearance/core-web-vitals'
const PAGESPEED = 'https://pagespeed.web.dev/'
const SPAM = 'https://developers.google.com/search/docs/essentials/spam-policies'
const ADA_WEB = 'https://www.ada.gov/resources/web-guidance/'
const HHS_HIPAA = 'https://www.hhs.gov/hipaa/for-professionals/index.html'
const FTC_ENDORSE = 'https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides'
const FTC_HEALTH = 'https://www.ftc.gov/business-guidance/resources/health-products-compliance-guidance'
const AI_FEATURES = 'https://developers.google.com/search/docs/appearance/ai-features'
const MAPS_POLICY = 'https://support.google.com/contributionpolicy/answer/7400114'

export const PILLAR_ARTICLES: Article[] = [
  {
    slug: 'law-firm-website-checklist',
    title: 'Law Firm Website Checklist: What Every Firm Site Needs',
    description: 'A practical checklist for law firm websites: practice area pages, attorney bios, advertising rules, local search, speed, intake forms and AI answers.',
    kind: 'guide',
    status: 'published',
    published: '2026-10-24',
    about: ['Law firm websites', 'Attorney advertising', 'Local SEO'],
    hero: { src: u('1436450412740-6b988f486c6b'), alt: 'Stone columns at the front of a courthouse' },
    summary: [
      'A law firm site earns calls through practice area pages written around the client’s situation, not the home page.',
      'Your website is lawyer advertising everywhere in the US, so results, testimonials and titles follow your state’s rules.',
      'Local search, a fast phone experience and a short intake form turn the visitors you already have into consultations.',
    ],
    faq: [
      { q: 'What is the most important page on a law firm website?', a: 'Usually the practice area pages. People search for their specific problem, such as a DUI arrest or a contested will, and land on the page about it. A clear page for each kind of case, written around the client’s situation, does more for a firm than a polished home page alone.' },
      { q: 'Do I need a disclaimer on my law firm website?', a: 'Most states require some disclaimers, especially next to case results and testimonials, and many expect a statement that contacting the firm does not create an attorney-client relationship. The exact wording varies by state, so check your bar’s advertising rules or ethics hotline before you publish.' },
      { q: 'Should every attorney have a bio page?', a: 'Yes. People want to know who will handle their case. A bio with bar admissions, the courts the attorney appears in, education and the kinds of matters they handle helps clients choose, and gives Google a clear page about each lawyer at the firm.' },
      { q: 'How should a law firm contact form be worded?', a: 'Keep it short: name, phone, email and a brief description. Say clearly that the form does not create an attorney-client relationship and that people should not send confidential details until the firm has confirmed it can take the matter. That protects both the firm and the person writing in.' },
      { q: 'Does a law firm website need to be fast?', a: 'Yes. Many people search for a lawyer on a phone in a stressful moment. A page that loads quickly and shows a phone number right away keeps them on your site. Google also measures real visitors’ experience through Core Web Vitals, so speed helps both people and search.' },
    ],
    body: `A law firm website has one job: help the right person decide to call you. Most of the people who visit are worried about something specific, read a page or two, and decide within minutes whether your firm handles their problem. This checklist walks through everything that decides that moment, in the order a prospective client meets it. Work through it with your own site open in another tab.

If you only have time for one section, start with practice area pages. They are where most search visitors land, and they are the pages most firm websites underinvest in. For the bigger picture, our [law firm guide](/guides/law-firms) covers how all of this fits together.

## 1. Practice area pages

A practice area page is the page someone lands on after searching for their problem. It should feel like it was written for them.

- [ ] One page for each kind of case you want, not one page listing everything
- [ ] The opening line names the situation in the reader’s words ("Arrested for DUI in Maricopa County?")
- [ ] What usually happens next, step by step, in plain language
- [ ] The decisions the reader faces and what your firm does at each step
- [ ] The real questions you hear in consultations, answered on the page
- [ ] The courts, counties and towns you actually work in
- [ ] A phone number and a short form visible without scrolling far

Google’s guidance on helpful content asks whether a page was written for people first and shows first-hand expertise ([Google: creating helpful content](${HELPFUL})). Nothing demonstrates that better than answering the questions your clients actually ask you, in the order they ask them. We go deeper on structure in our article on [how to write a practice area page that earns calls](/blog/practice-area-page-that-earns-calls).

> **Tip:** Write down the first five questions a new client asks on the phone for each case type. Those five questions, answered well, are the backbone of the page.

![Old law books on a wooden shelf](${u('1479142506502-19b3a3b7ff33')})

## 2. Advertising rules

In every state, a lawyer’s website is lawyer advertising. Most states build their rules on the American Bar Association’s Model Rules 7.1 to 7.3, which cover false or misleading communications, advertising and solicitation ([ABA Model Rules of Professional Conduct](${ABA_RULES})). The details vary a great deal from state to state, which is why our state articles exist. The table below shows the areas that come up on almost every firm website and what to check for each.

| What’s on the page | What to check |
|---|---|
| Case results | Whether your state requires a disclaimer next to results, and its wording |
| Client testimonials | Whether they are allowed, and whether they need consent or disclaimers |
| "Specialist" or "expert" | Whether your state limits these words to certified specialists |
| "Best" or superlatives | Whether comparative claims are allowed and how they must be supported |
| Attorney name and office | Whether a responsible attorney and office address must appear |
| Photos and dramatizations | Whether actors or staged images need to be labeled |

> **Watch out:** Rules change. New York, for example, revised its attorney advertising rules recently, and other states update theirs over time. Check your bar’s current rules rather than relying on what was true when your site was built.

For state-specific detail, read our state articles, such as [New York law firm websites after the 2026 rule changes](/blog/new-york-law-firm-website-rules) and [law firm website design in Florida](/blog/law-firm-website-design-florida).

## 3. Attorney bios

People want to know who will handle their case before they call. A bio page answers that and gives Google a clear page about each lawyer.

- [ ] A recent, professional photo
- [ ] Bar admissions, including federal courts where relevant
- [ ] The kinds of matters the attorney handles, linked to those practice pages
- [ ] Education and any certifications your state allows you to mention
- [ ] A direct way to reach the attorney or their team

## 4. Contact and intake

The contact form is where a visitor becomes a lead. Make it short and safe.

- [ ] Name, phone, email and a brief description: nothing more to start
- [ ] A clear statement that the form does not create an attorney-client relationship
- [ ] A request not to send confidential details until you confirm you can help
- [ ] A tap-to-call phone number on every page, visible on a phone without scrolling
- [ ] Office hours and what happens after someone writes in

![A hand signing a paper contract](${u('1521791055366-0d553872125f')})

## 5. Local search

Most people search for a lawyer with a place in mind. Google says local results depend mainly on relevance, distance and prominence ([Google Business Profile: how local ranking works](${LOCAL_RANKING})). Your website feeds relevance and prominence directly.

- [ ] Your firm’s name, address and phone number identical on your website and your Google Business Profile
- [ ] The towns and counties you serve named on your practice pages, where true
- [ ] LegalService structured data on your home page ([Google: local business structured data](${LOCAL_SD}))
- [ ] A contact page with your address, hours and directions
- [ ] A steady, honest flow of Google reviews from clients who are happy to leave one

Our article on [how Google decides which local businesses to show](/blog/how-google-picks-local-businesses) explains the three factors in more depth.

## 6. Speed and phones

A large share of legal searches happen on phones, often in difficult moments. Google measures how real visitors experience pages through Core Web Vitals ([Google: Core Web Vitals](${CWV})). You can check any page for free with [PageSpeed Insights](${PAGESPEED}).

- [ ] Pages load quickly on a phone, without large videos or sliders at the top
- [ ] Text is readable without zooming
- [ ] Buttons and links are big enough to tap
- [ ] The phone number and the form are easy to reach on every page

## 7. Search results and AI answers

The page title and description are often what someone sees first. Google may rewrite them, but clear ones give it the best material ([Google: title links](${TITLE_LINKS}), [Google: snippets](${SNIPPETS})).

- [ ] Every page has a unique title that names the case type and place
- [ ] Every page has a description that says what the reader will find
- [ ] Each practice page answers its main question in the opening sentences

That last item matters more each year. Google’s AI Overviews and AI assistants quote pages that state things clearly, and Google says no special markup is needed to appear in them ([Google: AI features and your website](${AI_FEATURES})). Our [AI search guide](/guides/ai-search) covers this in detail.

## 8. Accessibility

Accessible pages serve every client, including people with low vision or who use screen readers. The Department of Justice has published guidance on web accessibility under the ADA ([ADA.gov: web guidance](${ADA_WEB})).

- [ ] Every image has a short description (alt text)
- [ ] Headings follow a logical order
- [ ] Text has enough contrast against its background
- [ ] Forms have visible labels

## Common mistakes on law firm websites

These come up again and again when we review firm sites. Each one is easy to fix once you see it.

| Mistake | Why it hurts | The fix |
|---|---|---|
| One page listing every practice area | Nobody searching for a specific problem lands on a page about it | A dedicated page per case type |
| Opening with the firm’s history | The reader wants to know whether you handle their problem | Open with the reader’s situation |
| Results with no disclaimer | Many states require one next to results | Add your state’s required wording beside every result |
| A long intake form | People give up halfway, especially on phones | Ask for name, phone, email and a short description |
| Phone number only in the footer | Stressed visitors won’t hunt for it | Put a tap-to-call number at the top of every page |
| Stock photos of gavels everywhere | Says nothing about your firm | Real photos of your attorneys and office |
| Outdated bios and old staff | Undermines trust the moment it’s noticed | Review the team page whenever someone joins or leaves |

## What happens after the form

A website can only bring the inquiry to your door. What happens next decides whether it becomes a client.

- [ ] Every form submission and call reaches a person who can respond the same day
- [ ] Someone checks the inbox on weekends if you take urgent matters
- [ ] Missed calls are returned, not left to voicemail
- [ ] A short, polite reply goes out when you can’t take a matter, with a referral if you have one
- [ ] You note which practice page each inquiry came from, so you learn which pages work

> **Tip:** Ask every new client how they found you, and write it down. Over a few months, that simple habit tells you more about your website than any report.

## Clients who speak other languages

If your firm serves clients in Spanish or another language, give them real pages in that language, written or reviewed by someone fluent, rather than an automatic translation widget. Translate the practice pages and contact page first, and make sure the phone line or intake staff can respond in that language.

## Measuring what works

You don’t need complicated analytics to see whether your website is doing its job. Three free sources cover most of what a firm needs.

| Source | What it tells you |
|---|---|
| Google Search Console | Which searches show your pages, and which pages people click |
| Your Google Business Profile performance | How many people called, asked for directions or visited your site from the profile |
| Your own intake records | Which pages and searches brought actual consultations |

Look at them once a month. If a practice area page gets visitors but no inquiries, read it as a prospective client would and fix what’s unclear. If it gets no visitors at all, check that its title and opening name the problem the way people search for it.

## Content beyond practice pages

Once practice pages are solid, articles that answer narrower questions can help. A family law firm might publish a page on how custody is decided in its state, or what to bring to a first divorce consultation. Each article should answer one question well, link to the related practice page, and be reviewed when the law changes. Quality matters far more than volume: a handful of genuinely useful articles beats dozens of thin ones.

## Questions to ask before a redesign

If you are considering a new website, these questions protect the firm:

1. Will every current page keep its address, or will old addresses redirect to the new ones?
2. Who owns the domain, the content and the photos when the contract ends?
3. Can attorneys update pages themselves without paying for every change?
4. How fast will pages load on a phone, and how is that measured?
5. Is there a long contract or a setup fee?
6. How are advertising rules handled for results and testimonials?

Good answers to these questions matter as much as the design itself.

## Putting it into practice

You do not need to fix everything at once. A sensible order: practice area pages first, then the contact form and phone number, then advertising rules on any page with results or testimonials, then local search details, then speed.

If you would rather see the whole checklist applied to your own site, send us your website for a [free redesign](/redesign). We rebuild your pages to this list, keep every address so nothing breaks, and you can compare side by side. Plans for law firms are on our [pricing page](/pricing), and our page on [websites for law firms](/websites-for/law-firms) shows the designs. When you are ready, you can [start free](/signup) and change anything by asking Sofie.`,
  },
  {
    slug: 'practice-area-page-that-earns-calls',
    title: 'How to Write a Practice Area Page That Earns Calls',
    description: 'A step-by-step method for law firm practice area pages: start from the client’s situation, answer real questions, follow ad rules and make calling easy.',
    kind: 'guide',
    status: 'published',
    published: '2026-10-23',
    about: ['Practice area pages', 'Law firm websites', 'Content writing'],
    hero: { src: u('1454165804606-c3d57bc86b40'), alt: 'People taking notes around a meeting table' },
    summary: [
      'Open with the reader’s situation in their own words, then explain what happens next and how you help.',
      'Build the page from the questions clients ask in consultations; they are the questions people search for.',
      'Every screen should offer a way to call or write, and any results or testimonials must follow your state’s rules.',
    ],
    faq: [
      { q: 'How long should a practice area page be?', a: 'Long enough to answer the questions a client in that situation has, and no longer. For most case types that means several sections: what is happening, what comes next, what the firm does, common questions and how to get in touch. Padding a page to hit a word count makes it worse, not better.' },
      { q: 'Should I create a separate page for each city I serve?', a: 'Only where you genuinely work and can say something specific, such as the courthouse, local procedure or the area you cover. Near-identical pages with only the city name changed go against Google’s guidance on pages made for search engines rather than people.' },
      { q: 'Can I mention case results on a practice area page?', a: 'In most states you can, with conditions. Many require a statement that past results do not guarantee a similar outcome, placed near the results. Some limit how results may be described. Check your state bar’s advertising rules before adding results to any page.' },
      { q: 'What should the title of a practice area page be?', a: 'Name the case type and the place, in the words people use: for example, DUI defense lawyer in Phoenix. Keep it unique to that page and short enough to read in full in search results. The firm name can come at the end if it fits.' },
      { q: 'How often should practice area pages be updated?', a: 'Whenever the law, local procedure or your services change, and at least once a year as a check. Outdated information hurts trust and can raise ethics concerns, so a short yearly review of each page is a good habit for any firm.' },
    ],
    body: `Most visitors to a law firm website never see the home page. They search for their problem, land on the page about it, and decide within a minute or two whether to call. That page is the practice area page, and on most firm websites it is the weakest page on the site: a paragraph of general claims, a list of related services and a contact button.

This article is a method for writing practice area pages that do their job. It works for any case type, from DUI defense to estate planning, and it follows the principles in our [law firm guide](/guides/law-firms). For the full list of what a firm site needs, see the checklist in our [law firm guide](/guides/law-firms).

## Start with the reader’s situation

The person reading this page has a problem right now. They may be scared, angry or confused. The first thing the page should do is show them they are in the right place, in their own words.

Compare two openings:

| Weak opening | Strong opening |
|---|---|
| Our firm has decades of combined experience in criminal defense. | Arrested for DUI in Maricopa County? Here is what happens next and how we can help. |
| We are committed to protecting your rights. | Your first court date is usually within weeks. You have decisions to make before then. |
| We handle all types of family law matters. | Thinking about divorce in Cook County? Start with what the process looks like. |

The strong openings name the situation, the place and the reader’s next concern. They promise useful information, which is what the reader came for.

> **Tip:** Read the opening aloud to someone outside the firm. If they cannot tell within two sentences what kind of person the page is for, rewrite it.

## Collect the real questions

The best source of content for a practice area page is your own intake calls and consultations. The questions clients ask you are the questions people type into search engines and AI assistants.

For each case type, list the questions you hear most often. For a DUI page they might include:

1. Will I lose my license?
2. Do I have to go to court?
3. What happens at the first hearing?
4. Will this show up on background checks?
5. What does a lawyer do that I cannot do myself?
6. How much does it cost and how do I pay?

Each of these becomes a section or an entry in the page’s questions. Answer each in the first sentence or two, then explain. A reader who only skims gets the answer; a reader who wants detail finds it below.

![Conference room with chairs around a table](${u('1571055931484-22dce9d6c510')})

## Structure the page

A structure that works for most case types:

1. **The situation.** Two or three sentences that name the problem and the place.
2. **What happens next.** The process in order, with the decisions the reader faces.
3. **How the firm helps.** What you do at each stage, specifically.
4. **Common questions.** The list you collected, answered plainly.
5. **Who will handle it.** The attorneys who do this work, linked to their bios.
6. **How to get in touch.** Phone, form and what happens after they reach out.

Headings should match how people think about the problem. "What happens at the arraignment" is a better heading than "Our process," because it is what the reader is wondering and what they might search for.

## Make it local, honestly

Most legal problems are local: a particular court, a particular county’s procedures. Naming the courts you appear in and the areas you serve helps readers and helps Google understand where you work. Google says local results depend on relevance, distance and prominence ([Google Business Profile: how local ranking works](${LOCAL_RANKING})), and a page that clearly describes local work is more relevant to local searches.

> **Watch out:** Creating dozens of near-identical pages with only the city name changed is a pattern Google’s spam policies describe as doorway pages ([Google: spam policies](${SPAM})). Create location pages only where you genuinely work and can say something specific about each place.

## Follow the advertising rules

Every practice area page is lawyer advertising. Most states base their rules on the ABA Model Rules 7.1 to 7.3 ([ABA Model Rules of Professional Conduct](${ABA_RULES})), and the details vary. Before publishing, check the page against these:

- [ ] Any case results carry the disclaimer your state requires, placed where your state requires it
- [ ] Testimonials are real, permitted in your state and include any required consent or disclaimer
- [ ] Words like "specialist," "expert" and "best" are allowed for this use in your state
- [ ] Nothing implies a guaranteed outcome
- [ ] The responsible attorney and office address appear where required

Our state articles, such as [Texas bar rules for Houston law firm websites](/blog/houston-law-firm-website-design), go into the specifics.

## Write so search engines and AI answers can use it

The page title and description are often what people see in search results. Make the title name the case type and place, and make the description say what the reader will learn ([Google: title links](${TITLE_LINKS}), [Google: snippets](${SNIPPETS})).

AI Overviews and AI assistants increasingly answer legal questions directly and link to sources. Google says these features draw on its normal ranking systems and need no special markup ([Google: AI features and your website](${AI_FEATURES})). Pages that answer a question clearly at the top of a section are easier for these systems to understand and quote. Our [AI search guide](/guides/ai-search) explains more.

## Make contacting you effortless

A reader who has decided to call should not have to look for the number.

- [ ] A tap-to-call number near the top and again at the end
- [ ] A short form: name, phone, email and a brief description
- [ ] A note that the form does not create an attorney-client relationship
- [ ] What happens next: who responds and roughly when, if you can commit to it

![Office towers seen from the street](${u('1486406146926-c627a92ad1ab')})

## A worked outline

Here is how the method looks for an estate planning page in one county:

| Section | What goes in it |
|---|---|
| Opening | Planning your estate in the county, and why a plan matters even for modest estates |
| What happens | The first meeting, the documents usually involved, signing and storage |
| How we help | What the firm prepares, reviews and explains at each step |
| Questions | Do I need a trust? What if I move states? How often should I update my will? |
| Who | The attorneys who handle estate planning, with links to their bios |
| Contact | Phone, form, office address and hours |

Each section answers something a real client would ask, and nothing is there to fill space.

## A full example, section by section

Here is how the method reads in practice for a first-offense DUI page. The words are illustrative; your own page should reflect your state’s law and your firm’s real process.

**Opening.** "Arrested for a first DUI in Maricopa County? You probably have questions about your license, your job and your first court date. This page walks through what usually happens next and how our attorneys help at each step."

**What happens next.** A short, ordered list: the arrest and release, the administrative license process, the first court appearance, the options that follow, and how long cases usually take in that court, described without invented numbers.

**How the firm helps.** For each step, one or two sentences on what the attorney actually does: reviewing the stop and testing, appearing at hearings, explaining options and negotiating where appropriate.

**Questions.** The six questions from your intake calls, each answered in its first sentence.

**Who.** The attorneys who handle DUI matters, each linked to a bio.

**Contact.** A tap-to-call number, a short form and a note about confidentiality.

## Mistakes to avoid

| Mistake | What to do instead |
|---|---|
| Writing for other lawyers | Write for someone who has never been in a courtroom |
| Burying the phone number | Show it near the top and again at the end |
| Copying the same page for every city | Write location pages only where you can say something specific |
| Listing every related service in one paragraph | Link to a dedicated page for each related service |
| Promising outcomes | Describe the process and your role; never imply a result |
| Leaving out the next step | End every section with an easy way to get in touch |

## Link your pages together

Practice area pages work best as part of a connected set. Link each one to the attorneys who handle that work, to closely related practice pages, and to articles that answer narrower questions in depth. Those links help readers keep going and help search engines understand how your pages relate.

If you publish articles, each one should link back to the practice page it supports. Our articles on [writing pages AI answers can quote](/blog/write-pages-ai-answers-can-quote) and [Google AI Overviews for law firms](/blog/google-ai-overviews-for-law-firms) show how articles and practice pages can support each other.

> **Tip:** At the end of each practice page, add a short "related" list of two or three closely connected pages. It is one of the simplest ways to keep a reader on your site.

## Plain language, without dumbing down

Legal readers are often intelligent people in an unfamiliar situation. Plain language respects that. Use everyday words where they are accurate, explain a legal term the first time it appears, and keep sentences short enough to read on a phone. "Arraignment" can stay, as long as the next sentence says it is the first court appearance where charges are read and a plea is entered. Avoid Latin phrases and long qualifications unless they change the meaning. A page that a stressed reader understands on the first pass will always outperform one that impresses other lawyers.

## Questions to put to every draft

Before publishing, read the page once more as a worried person would, and ask:

1. Do the first two sentences tell me I am in the right place?
2. Can I see how to call without scrolling far on my phone?
3. Is every term explained the first time it appears?
4. Does each section answer something I would actually wonder?
5. Is anything here a promise about the outcome of my case?
6. Would I know what happens after I call or write in?

If any answer is no, fix that before the page goes live.

## Keep a page per question when it grows

Sometimes one question deserves far more than a paragraph, such as how license suspensions work in your state. When a section grows long, give it its own article and link to it from the practice page, keeping a short answer on the practice page itself.

## Measure the page

Once the page is live, watch how it does. Google Search Console shows which searches lead to it and how often people click. Your intake records show whether it produces consultations. If a page gets visits but no calls, reread it as a worried client would and fix whatever slows them down.

## Review it every year

Laws change, procedures change and so do your services. Put a yearly review of every practice area page on the calendar. Check facts, update the questions, confirm the advertising rules still match and fix anything that has gone stale.

## Where SaySites fits

SaySites law firm sites give every practice area its own page, built around this structure, with the phone number in reach on every screen. You change any page by telling Sofie what you want in plain words. See the designs on our page about [websites for law firms](/websites-for/law-firms), compare plans on our [pricing page](/pricing), or send us your current site for a [free redesign](/redesign) to see your own practice pages rebuilt this way. You can also [start free](/signup) today.`,
  },
  {
    slug: 'medical-practice-website-checklist',
    title: 'Medical Practice Website Checklist for Patients and Google',
    description: 'A checklist for medical and dental practice websites: service pages, insurance and hours, booking, privacy on forms, health claims, local search and speed.',
    kind: 'guide',
    status: 'published',
    published: '2026-10-25',
    about: ['Medical practice websites', 'Dental practice websites', 'Local SEO'],
    hero: { src: u('1666214280557-f1b5022eb634'), alt: 'Doctor explaining a scan to a patient' },
    summary: [
      'Patients look first for whether you treat their problem, take their insurance, are nearby and can see them soon.',
      'Website forms are for appointment requests and general questions; keep clinical details in your patient portal.',
      'Health claims need evidence and testimonials must be honest, under FTC guidance and your state’s rules.',
    ],
    faq: [
      { q: 'What should a medical practice home page include?', a: 'The services you offer, the insurance you accept, your location and hours, a clear way to book or request an appointment, and a short introduction to your providers. Patients usually look for these before anything else, so put them where a phone visitor sees them without scrolling far.' },
      { q: 'Is it safe to have a contact form on a practice website?', a: 'Yes, for appointment requests and general questions. Tell patients on the form not to include medical details, and route anything clinical to your patient portal or phone line. Website forms are not designed to handle protected health information the way your clinical systems are, so keep them for scheduling and simple questions.' },
      { q: 'Should a practice list insurance plans on its website?', a: 'Yes. Whether you take a patient’s insurance is one of the first things they check. A clear, current list, with a note to call if their plan is not shown, saves time for patients and front-desk staff alike. Update it whenever your contracts with insurers change.' },
      { q: 'Can we show patient reviews on our website?', a: 'You can share genuine reviews with the patient’s permission, as long as they do not imply that unusual results are typical. The FTC’s endorsement guides cover this, and some states add rules for health professionals. Never edit a review to change its meaning.' },
      { q: 'Do medical websites need to be accessible?', a: 'Accessibility helps every patient, including people with low vision and those using screen readers. The Department of Justice has published guidance on web accessibility under the ADA. Readable text, alt text on images, clear headings and labeled forms are the basics.' },
    ],
    body: `Patients choose a practice quickly. They want to know whether you treat their problem, whether you take their insurance, whether you are close by and whether they can get an appointment soon. A practice website that answers those questions immediately, and makes booking easy, does most of its work before a patient reads a full paragraph.

This checklist covers everything a medical or dental practice website needs, in the order patients meet it. It follows our [medical and dental guide](/guides/medical-and-dental), which explains the reasoning in more depth.

## 1. The first screen

On a phone, the first screen is all many visitors see before deciding. Make it count.

- [ ] What kind of practice you are, in plain words
- [ ] The town or neighborhood you are in
- [ ] A button to book or request an appointment
- [ ] A tap-to-call phone number
- [ ] Whether you are accepting new patients

> **Tip:** Open your site on your own phone, in a place with weak signal. Whatever you can see in the first few seconds is your real home page.

## 2. Service pages

Each service or treatment deserves its own page. Patients search for specific things, and a page about each one gives them, and Google, a clear match.

- [ ] One page per service, named the way patients describe it
- [ ] What the service is and who it is for, in plain language, with the clinical term included
- [ ] What happens at the visit, step by step
- [ ] How to prepare and what to expect afterwards
- [ ] Which providers offer it
- [ ] How to book

Google’s guidance on helpful content asks whether a page was written to help people and reflects real expertise ([Google: creating helpful content](${HELPFUL})). Service pages written from the questions your front desk answers every day meet that test naturally.

![Clinic reception desk](${u('1519494026892-80bbd2d6fd0d')})

## 3. Insurance, payment and new patients

These are among the first things patients check, and the most common reasons they call your front desk.

- [ ] A current list of insurance plans you accept
- [ ] A note to call if their plan is not listed
- [ ] Payment options for patients without insurance
- [ ] New-patient forms they can complete before the visit
- [ ] What to bring to the first appointment

## 4. Providers

Patients want to know who they will see.

- [ ] A page or section for each provider, with a recent photo
- [ ] Credentials, training and board certifications
- [ ] The services each provider offers, linked to those pages
- [ ] Languages spoken, if relevant

## 5. Privacy on forms

HIPAA protects patients’ health information held by practices and their business associates ([HHS: HIPAA for professionals](${HHS_HIPAA})). A website contact form is not a clinical system. Use it for the right things.

| Use the website form for | Keep in your portal or phone |
|---|---|
| Appointment requests | Symptoms and medical history |
| General questions about services | Test results and diagnoses |
| Insurance questions | Prescription requests |
| New-patient inquiries | Anything involving treatment decisions |

- [ ] The form asks only for contact details and a brief reason for the visit
- [ ] A visible note asks patients not to include medical details
- [ ] A link to your patient portal for clinical questions

## 6. Health claims and reviews

Health advertising is held to a higher standard than most marketing. The FTC expects health-related claims to be supported by competent and reliable scientific evidence ([FTC: health products compliance guidance](${FTC_HEALTH})), and testimonials must reflect honest experiences without implying unusual results are typical ([FTC: endorsement guides](${FTC_ENDORSE})). States add their own rules for physicians and dentists.

> **Watch out:** Before-and-after photos, "painless" or "permanent" claims and comparisons with other providers are the areas most likely to cause problems. Check them against your state board’s rules before publishing.

Our state articles cover specifics, for example [Florida rules for Miami medical practice websites](/blog/miami-medical-practice-website-design) and [Texas rules for Houston dental websites](/blog/houston-dental-practice-website-texas-rules).

## 7. Locations and local search

Patients search with a place in mind. Google says local results depend mainly on relevance, distance and prominence ([Google Business Profile: how local ranking works](${LOCAL_RANKING})).

- [ ] Your practice name, address and phone identical on your website and Google Business Profile
- [ ] A separate page for each location, with its own address, hours, phone and directions
- [ ] Parking, public transport and accessibility details
- [ ] MedicalBusiness, Physician or Dentist structured data ([Google: local business structured data](${LOCAL_SD}))
- [ ] A habit of inviting patients to leave reviews, without incentives

![Stethoscope on a table](${u('1505751172876-fa1923c5c528')})

## 8. Accessibility and speed

Your patients include older adults, people with low vision and people on slow connections. The Department of Justice has published guidance on web accessibility under the ADA ([ADA.gov: web guidance](${ADA_WEB})), and Google measures real visitors’ experience through Core Web Vitals ([Google: Core Web Vitals](${CWV})).

- [ ] Text large enough to read without zooming
- [ ] Strong contrast between text and background
- [ ] Alt text on every meaningful image
- [ ] Buttons big enough to tap
- [ ] Pages that load quickly on a phone (test with [PageSpeed Insights](${PAGESPEED}))

## 9. Search results

- [ ] Each page has a unique title naming the service and place ([Google: title links](${TITLE_LINKS}))
- [ ] Each page has a description saying what the patient will find ([Google: snippets](${SNIPPETS}))
- [ ] Service pages answer the main question in their opening sentences, which also helps AI answers quote them ([Google: AI features](${AI_FEATURES}))

## A worked example: one service page

Here is an outline for a page about a routine dental cleaning. The same pattern works for a physical exam, a skin check or physical therapy.

| Section | What goes in it |
|---|---|
| Opening | What a cleaning is, who it is for and how often your dentists usually recommend it |
| The visit | Check-in, the cleaning itself, the exam and any X-rays, and roughly how long it takes |
| Comfort | What you do for patients who are anxious or sensitive |
| Insurance | How cleanings are usually covered and what to ask your insurer |
| Who | The hygienists and dentists who see patients for cleanings |
| Book | A booking button and phone number |

Each section answers a question patients actually ask, and the page ends with a clear way to book.

## Common mistakes on practice websites

| Mistake | Why it hurts | The fix |
|---|---|---|
| No insurance information | Patients call just to ask, or leave | A current list of plans, with a note to call if theirs is missing |
| One page listing every service | Patients searching for a service don’t land on a page about it | A page per service |
| Booking only by phone during office hours | Patients searching in the evening can’t act | An online request form or booking link |
| Medical jargon without explanation | Patients feel lost | Plain words first, with the clinical term alongside |
| Outdated provider list | Patients ask for someone who has left | Update the team page whenever staff change |
| Hours that differ from Google | Patients arrive to a closed door | Update your website and profile together |

## Multiple locations

If your practice has more than one office, give each its own page with its address, hours, phone number, directions, the providers who work there and the services offered at that location. Patients choose by location, and a page per office lets Google match each one to nearby searches. Each location can have its own Google Business Profile, and the details on the page and the profile should match exactly.

## Online booking and telehealth

If you offer online booking, put the button on every service page rather than only the home page. If you offer telehealth visits, say which services can be handled by video, how patients join, and what they need. Keep the clinical part of these visits inside your secure systems, not your website forms.

## Writing for patients

Health information is easier to act on when it is easy to read. A few habits help every service page:

- Short sentences and short paragraphs, especially on phones
- The plain word first and the clinical term alongside it, for example "a skin check (dermatological exam)"
- One idea per paragraph, with headings that say what each section covers
- Concrete next steps: what to bring, how to prepare, how to book
- A review date, so you remember to check the page when guidelines change

These habits also help search engines and AI answers understand each page, because clear structure and plain statements are easier to interpret and quote.

## New patients versus returning patients

Returning patients mostly want the portal, forms and contact details. New patients want reassurance: who you are, what to expect and whether you take their insurance. A short "New patients" page that gathers forms, insurance, what to bring and how the first visit works serves new patients well, and a clear link to the patient portal near the top of every page serves everyone else.

## Reviews and photos

Patients read reviews before choosing a practice, and Google counts reviews as part of prominence in local results ([Google Business Profile: how local ranking works](${LOCAL_RANKING})).

- [ ] Invite every patient to leave a review, with a direct link, after their visit
- [ ] Never offer anything in return for a review
- [ ] Reply to reviews without confirming that the reviewer is a patient or mentioning any health details, since doing so can raise privacy concerns
- [ ] Use real photos of your office, waiting room and team, so patients know what to expect
- [ ] Show the entrance and parking, which helps first-time patients find you

> **Watch out:** A friendly reply that says "we are glad your treatment went well" confirms someone is a patient. Keep replies general: thank them for their feedback and invite them to call the office.

## Keep it current

Practice information goes out of date quietly: a provider leaves, hours change, an insurance contract ends. Put a short review of every page on the calendar each quarter, and update your website and Google Business Profile on the same day whenever something changes.

## Measuring what works

| Source | What it tells you |
|---|---|
| Google Search Console | Which searches show your pages and which ones people click |
| Google Business Profile performance | Calls, direction requests and website visits from your profile |
| Your scheduling system | Which booking requests came from the website |

A monthly look at these is enough. If a service page gets visits but few bookings, check whether insurance, hours and the booking button are easy to find on it.

## A sensible order

If this list feels long, work in this order: first screen and booking, then insurance and hours, then service pages, then forms and privacy notes, then claims and reviews, then local details and speed. Each step makes the site more useful to patients on its own. Our [local search guide](/guides/local-seo) and the article on [how Google decides which local businesses to show](/blog/how-google-picks-local-businesses) are good next reads.

## Where SaySites fits

SaySites builds practice websites with a page for every service, booking and phone in reach on every screen, and forms that ask patients not to include medical details. See the designs on our pages about [websites for medical practices](/websites-for/medical-practices) and [dental practices](/websites-for/dentists), compare plans on our [pricing page](/pricing), or send us your website for a [free redesign](/redesign). You can also [start free](/signup) and change anything by asking Sofie.`,
  },
  {
    slug: 'home-service-website-checklist',
    title: 'Home Service Website Checklist: Plumbers, HVAC, Roofers',
    description: 'A checklist for plumbing, HVAC, electrical and roofing websites: calls first, service and area pages, license numbers, reviews, photos and speed.',
    kind: 'guide',
    status: 'published',
    published: '2026-10-26',
    about: ['Home service websites', 'Contractor websites', 'Local SEO'],
    hero: { src: u('1621905251189-08b45d6a269e'), alt: 'Electrician in a hard hat installing wiring' },
    summary: [
      'Urgent searches end in calls: put a tap-to-call number at the top of every page and keep pages fast.',
      'Name services the way customers describe problems, and only create town pages where you really work.',
      'Show your license number and real photos of your team, and build a steady flow of honest reviews.',
    ],
    faq: [
      { q: 'What is the most important thing on a plumber or HVAC website?', a: 'A phone number that can be tapped immediately, on every page, near the top. Many home service searches are urgent, and the visitor wants to talk to someone now. Everything else on the site supports that call: clear services, the areas you cover and reasons to trust you.' },
      { q: 'Should I list prices on my contractor website?', a: 'Many contractors publish starting prices or price ranges for common jobs, such as a service call fee, because customers compare. If prices depend on an inspection, say so and explain how quotes work. Honest pricing information can reduce calls from people who are not a good fit.' },
      { q: 'How many town pages should a service business have?', a: 'Only as many as the towns where you genuinely work and can say something specific. A page per town with real details, such as typical jobs there, is useful. Dozens of copies with the town name swapped go against Google’s spam policies on doorway pages.' },
      { q: 'Do I need to show my license number online?', a: 'Many states require contractors to include their license number in advertising, and that can include websites. Even where it is not required, a license number in the footer of every page is a simple trust signal. Check your state licensing board’s rules for the exact requirement.' },
      { q: 'Are stock photos okay on a contractor website?', a: 'They are better than nothing at first, but real photos of your team, trucks and finished work build more trust. Customers want to know who will come to their home. Replace stock photos with your own as soon as you have good ones.' },
    ],
    body: `A burst pipe, a dead furnace, sparks from an outlet, a leak through the ceiling: the people who search for home services are often in a hurry and sometimes in a panic. They pick up a phone, search, and call the first business that looks trustworthy and available. A home service website exists to win that moment.

This checklist covers plumbers, HVAC companies, electricians and roofers, and most of it applies to any business that goes to the customer’s home. It follows our [home services guide](/guides/home-services).

## 1. The call comes first

- [ ] A tap-to-call phone number at the very top of every page
- [ ] The number repeated at the end of every page
- [ ] Your hours and whether you offer emergency service, stated plainly
- [ ] What happens when someone calls: who answers and how quickly you schedule
- [ ] A short form for people who would rather write

> **Tip:** Call your own number from your website on a phone. Count the taps and seconds it takes. That is your customer’s experience.

## 2. Service pages named the way customers talk

Customers search for problems more often than for trade terms. "No hot water" is a search; "tankless water heater descaling" is a service. Your pages should cover both.

| Customers search for | Your page could cover |
|---|---|
| No hot water | Water heater repair and replacement |
| AC blowing warm air | Air conditioning repair |
| Breaker keeps tripping | Electrical troubleshooting and panel upgrades |
| Roof leaking in the rain | Roof leak repair |
| Drain backing up | Drain cleaning and sewer line repair |

- [ ] One page per main service
- [ ] The problems that lead to that service, named in the customer’s words
- [ ] What you do, roughly how long it takes and what affects the price
- [ ] Emergency availability for that service, if you offer it

![Two roofers working on the roof of a house](${u('1635424709961-f3a150459ad4')})

## 3. Your license and insurance

Most states license plumbers, electricians, HVAC technicians and roofers, and many require the license number to appear in advertising. Showing it is a legal habit and a trust signal at once.

- [ ] Your license number in the footer of every page
- [ ] Insurance and bonding stated where true
- [ ] Any manufacturer certifications you hold, accurately named

Our city articles cover specific states, for example [Florida license number rules for Tampa HVAC websites](/blog/tampa-hvac-website-design) and [Washington license rules for Seattle plumbers](/blog/seattle-plumber-website-design).

## 4. The areas you serve

Home service businesses go to the customer, so Google treats them as service-area businesses. In your Google Business Profile you set the areas you serve rather than showing a storefront address, if you don’t serve customers at your location ([Google: service areas](${SERVICE_AREAS})).

On your website:

- [ ] A clear list of the towns and neighborhoods you cover
- [ ] A page for a town only where you do real work there and can say something specific
- [ ] Consistent service areas on your website and your Google Business Profile

> **Watch out:** Pages that differ only by town name are what Google’s spam policies call doorway pages ([Google: spam policies](${SPAM})). They tend to hurt more than they help.

Our article [no storefront? How to show Google where you work](/blog/service-area-business-google) explains service areas in detail.

## 5. Trust: photos, people and reviews

People are letting you into their home. Help them feel good about it.

- [ ] Real photos of your team, your vans and your finished work
- [ ] The owner’s name and a few words about how the business started
- [ ] A handful of genuine reviews, shown with the customer’s permission
- [ ] Any guarantees on workmanship, stated exactly as you honor them

Reviews also matter for local search. Google lists prominence as one of the three main factors in local results, and reviews are part of prominence ([Google Business Profile: how local ranking works](${LOCAL_RANKING})). Ask every satisfied customer, make it easy with a direct link, and never offer incentives or filter for only positive reviews ([Google: tips for getting reviews](${REVIEW_TIPS}), [Google Maps: user contributed content policy](${MAPS_POLICY})). Our article on [asking for Google reviews the right way](/blog/ask-for-google-reviews-the-right-way) covers this step by step.

![Outdoor air conditioner unit beside a brick wall](${u('1718203862467-c33159fdc504')})

## 6. Speed, in a basement

Your customers are often searching from a basement, an attic or a car, on a weak connection. Heavy pages lose them.

- [ ] No autoplay video or large slider at the top
- [ ] Images compressed and sized for phones
- [ ] Pages that load quickly on a phone (check with [PageSpeed Insights](${PAGESPEED}))
- [ ] Core Web Vitals in good shape ([Google: Core Web Vitals](${CWV}))

## 7. Details Google reads

- [ ] Your business name, phone and service areas identical everywhere they appear
- [ ] Structured data describing your business type, such as Plumber, HVACBusiness, Electrician or RoofingContractor ([Google: local business structured data](${LOCAL_SD}))
- [ ] Unique page titles naming the service and area ([Google: title links](${TITLE_LINKS}))
- [ ] Descriptions that say what each page offers ([Google: snippets](${SNIPPETS}))

## 8. Seasonal pages

Many home services are seasonal: furnace tune-ups before winter, AC checks before summer, gutter and roof inspections after storms. A page about a seasonal service, kept up to date, gives customers somewhere to land when the season arrives.

- [ ] A page for each seasonal service you offer
- [ ] A short checklist customers can use themselves, which also shows your expertise
- [ ] A clear way to book ahead of the busy season

## A worked example: a water heater page

Here is how a service page reads when it is built around the customer’s problem.

| Section | What goes in it |
|---|---|
| Opening | No hot water, leaking tank or strange noises? What those signs usually mean |
| Repair or replace | The questions you ask to decide, in plain words |
| What you do | Inspection, repair, replacement and removal of the old unit |
| Options | Tank and tankless, and what affects which suits a home |
| Timing | Same-day service if you offer it, and how scheduling works |
| Price | A starting price or how quotes work |
| Book | A tap-to-call number and a short form |

The page answers the questions a homeowner asks on the phone, which are also the questions they type into a search engine.

## Emergency service pages

If you take emergency calls, give that its own page and make it unmistakable: what counts as an emergency, your availability, how quickly you can usually respond in your area (only if you can honor it), and the number to call. Repeat the phone number several times on the page. Never claim around-the-clock service unless someone really answers.

## Common mistakes on home service websites

| Mistake | Why it hurts | The fix |
|---|---|---|
| Phone number only in the footer | Urgent visitors leave | Tap-to-call at the top of every page |
| A slider of stock photos at the top | Slow to load, says nothing about you | One real photo of your team or work |
| One page for all services | Searches for a specific problem don’t find you | A page per service |
| Dozens of town pages with the same text | Against Google’s spam policies | Real pages only where you work |
| No license number | Lost trust, and possibly a rule broken | License number in every footer |
| Outdated hours or service areas | Wasted calls and frustrated customers | Update your site and profile together |

## Payment and financing

Big jobs like roof replacements and system installs raise money questions. If you offer financing, say so on the relevant service pages, name the provider, and link to their terms rather than summarizing rates yourself. State which payment methods you accept on the contact page.

## Show the work

Customers want to see what you do before they let you into their home. A simple gallery of recent jobs, with a sentence on each about the problem and what you did, goes a long way. Photos of a neat finished install, a cleaned-up worksite or your van outside a customer’s home all tell people what to expect.

- [ ] Recent job photos with a short note on each
- [ ] Before-and-after photos where the difference is clear and genuine
- [ ] Customer permission for any photo that shows their home in a recognizable way
- [ ] No photos from other companies or stock images presented as your work

## Seasonal and maintenance plans

If you offer maintenance plans or seasonal tune-ups, describe exactly what is included, how often visits happen, the price and how to cancel. Clear plan pages help customers say yes, and they give past customers a reason to come back to your site. Avoid vague promises; list the actual checks and services.

## Quotes and estimates

Many jobs start with a quote. Make the process clear on your website so customers know what to expect.

- [ ] Whether quotes are free, and whether a visit is needed
- [ ] What information helps you quote quickly, such as photos of the problem or the age of the system
- [ ] How long a quote usually stays valid
- [ ] A form that lets customers attach photos, if your system supports it

## Answering the phone

The best website in the world loses customers if calls go unanswered. Decide who answers during business hours and after hours, set up a voicemail message that says when you will call back, and return missed calls quickly. If you use an answering service, make sure it has your current services, areas and prices. The phone number on your website should ring wherever someone can actually answer it.

## Trust signals that matter

Customers decide quickly whether to trust a business coming into their home. Beyond reviews and your license number, small details help: a named owner, a physical business address if you have one, membership in a local trade association if true, and clear written guarantees on workmanship. List only what is real and current, and keep it on every page where people decide.

## Keep it current

Prices, service areas and staff change. Review your service pages and contact details each season, and update your website and Google Business Profile together. An out-of-date page is often the reason a good customer calls a competitor instead.

Small, regular updates keep your site trustworthy and your phone ringing.

## Measuring calls

For a home service business, calls are the measure that matters. Ask every new customer how they found you, and note it. Your Google Business Profile shows how many people called from your profile, and Google Search Console shows which searches lead to your pages. If a page gets visits but no calls, check that the number is easy to tap and the page says clearly that you serve that area.

## Where to start

If you only do three things this week: put a tap-to-call number at the top of every page, add your license number to the footer, and ask your last ten happy customers for a review. Then work through service pages, area pages and speed. Our [local search guide](/guides/local-seo) covers the bigger picture.

## Where SaySites fits

SaySites home service sites put the call button at the top of every page, give every service its own page, show your license number in the footer and stay fast on a phone. See designs for [plumbers](/websites-for/plumbers), [HVAC companies](/websites-for/hvac-companies), [electricians](/websites-for/electricians) and [roofers](/websites-for/roofers), compare plans on our [pricing page](/pricing), or send us your website for a [free redesign](/redesign). You can [start free](/signup) and change anything by asking Sofie.`,
  },
  {
    slug: 'local-seo-checklist-small-business',
    title: 'Local SEO Checklist for Small Businesses',
    description: 'A plain-English local SEO checklist from Google’s own guidance: Business Profile, consistent details, service pages, reviews, structured data and speed.',
    kind: 'guide',
    status: 'published',
    published: '2026-10-28',
    about: ['Local SEO', 'Google Business Profile', 'Small business websites'],
    hero: { src: u('1687422808248-f807f4ea2a2e'), alt: 'Small business owner standing in their shop' },
    summary: [
      'Google says local results depend mainly on relevance, distance and prominence; you can influence relevance and prominence.',
      'A complete Business Profile, consistent details everywhere and a page for each service are the foundations.',
      'Reviews, clear page titles, structured data and fast pages build on them. No one can buy or guarantee a local ranking.',
    ],
    faq: [
      { q: 'What is local SEO?', a: 'Local SEO is the work of helping a business appear when people nearby search for what it offers, in Google’s map results and local listings as well as regular results. It covers your Google Business Profile, your website, reviews and the consistency of your details across the web.' },
      { q: 'How long does local SEO take to work?', a: 'There is no fixed timeline and no one can promise one. Some changes, like correcting your hours or category, can show up quickly. Others, like building reviews and useful pages, add up over months. Google decides rankings, so focus on what makes your business genuinely easier to find and choose.' },
      { q: 'Do I need a website for local SEO?', a: 'A Google Business Profile alone can appear in local results, but a website gives Google and customers much more: a page for each service, your story, your areas and a contact route you control. Most businesses do best with both working together and saying the same things.' },
      { q: 'Does posting on my Google Business Profile help ranking?', a: 'Google has not said that posts are a ranking factor. Posts can still help customers by sharing offers, news, holiday hours or events. Treat them as a way to inform the people who already found your profile, and keep them current, rather than as a ranking tactic.' },
      { q: 'Should I add my city to my business name on Google?', a: 'No. Google’s guidelines require your real business name as used on your signage, website and documents. Adding cities, services or other keywords to the name breaks the guidelines and can get a profile suspended. Put your location and services in the fields meant for them instead.' },
    ],
    body: `When someone nearby searches for what you offer, Google decides which businesses to show in its map results and local listings. You cannot buy your way into those results, and no one can guarantee a position in them. What you can do is give Google, and the people searching, everything they need to understand your business and choose it.

This checklist is built from Google’s own documentation. It applies to almost any local business: law firms, practices, trades, shops and restaurants. For the reasoning behind each item, see our [local search guide](/guides/local-seo).

## How local results work

Google says local results are based mainly on three factors ([Google Business Profile: how local ranking works](${LOCAL_RANKING})):

| Factor | What it means | What you can do |
|---|---|---|
| Relevance | How well a business matches the search | Complete profile, the right category, a page for each service |
| Distance | How far the business is from the searcher or the place they named | Accurate address or service areas |
| Prominence | How well known the business is | Reviews, a strong website, being mentioned around the web |

Distance depends mostly on the searcher. Relevance and prominence are where your effort pays off.

## 1. Google Business Profile

Your profile is often the first thing a local searcher sees, before your website.

- [ ] Claimed and verified
- [ ] Your real business name, with nothing added ([Google Business Profile guidelines](${GBP_GUIDELINES}))
- [ ] The most specific primary category that fits, plus relevant secondary categories
- [ ] Accurate address, or service areas if you go to customers ([Google: service areas](${SERVICE_AREAS}))
- [ ] Phone number, website and hours, including holiday hours
- [ ] Services or products listed with short descriptions
- [ ] Real photos of your premises, team and work
- [ ] Attributes that apply, such as accessibility features

> **Watch out:** Adding keywords or cities to your business name is the most common profile mistake, and Google’s guidelines say it can lead to suspension.

Our article on [Google Business Profile or a website](/blog/google-business-profile-or-website) explains how the two work together, and our [Google Business Profile setup guide](/blog/google-business-profile-setup-guide) walks through every field.

![Shoppers looking at a store window display](${u('1758520387635-d290a74d3aee')})

## 2. Consistent details everywhere

Google and customers compare what your website, your profile and other listings say about you. Mismatches create doubt.

- [ ] The same business name, address and phone number on your website, profile and directory listings
- [ ] The same hours everywhere, updated together when they change
- [ ] Old addresses and phone numbers corrected wherever you find them

## 3. Your website’s pages

Your website is where relevance is built in depth.

- [ ] A page for each service you offer, written for the customer
- [ ] The towns or areas you serve named where true
- [ ] A contact page with address, hours, map or directions
- [ ] Content written from real experience, answering real customer questions ([Google: creating helpful content](${HELPFUL}))

> **Tip:** The questions customers ask you on the phone are the best list of topics for your service pages. Answer each one plainly near the top of the page.

## 4. Structured data

Structured data is code that tells Google exactly what your business is, where it is and how to reach it ([Google: local business structured data](${LOCAL_SD})). It doesn’t guarantee anything, but it removes guesswork.

- [ ] LocalBusiness markup, or a more specific type such as Plumber, Dentist or LegalService
- [ ] Name, address, phone, hours and website in the markup, matching your pages
- [ ] Checked with Google’s Rich Results Test after changes

## 5. Reviews

Reviews are part of prominence, and they are what many customers read before choosing.

- [ ] Ask every satisfied customer, every time ([Google: tips for getting reviews](${REVIEW_TIPS}))
- [ ] Share a direct review link by text or email
- [ ] Reply to reviews, including critical ones, calmly and without private details
- [ ] Never offer incentives, never ask only happy customers and never post fake reviews ([Google Maps: user contributed content policy](${MAPS_POLICY}))

Our article on [asking for Google reviews without breaking the rules](/blog/ask-for-google-reviews-the-right-way) has wording you can use.

![Inviting clothing store interior](${u('1441986300917-64674bd600d8')})

## 6. Titles and descriptions

The title and description are what people see in results. Google may rewrite them, but good ones give it the best material ([Google: title links](${TITLE_LINKS}), [Google: snippets](${SNIPPETS})).

- [ ] A unique title on every page, naming the service and place
- [ ] A description that says plainly what the page offers
- [ ] No pages left with titles like "Home" or "Untitled"

See our article on [page titles and descriptions that people click](/blog/page-titles-and-descriptions-that-get-clicks).

## 7. Speed and phones

Local searches happen mostly on phones. Google measures real visitors’ experience with Core Web Vitals ([Google: Core Web Vitals](${CWV})).

- [ ] Pages load quickly on a phone (test with [PageSpeed Insights](${PAGESPEED}))
- [ ] The phone number can be tapped on every page
- [ ] Nothing jumps around while the page loads

## 8. Avoid shortcuts

Google’s spam policies describe practices that can remove a business from results entirely ([Google: spam policies](${SPAM})).

- [ ] No fake locations or virtual offices pretending to be storefronts
- [ ] No pages that differ only by town name
- [ ] No bought reviews or links

## Directories and citations

A citation is any mention of your business name, address and phone number on another website: directories, industry listings, your chamber of commerce, local news. Consistent citations help confirm your details. You do not need hundreds; you need the important ones to be accurate.

- [ ] The main directories for your industry and region list you correctly
- [ ] Your local chamber of commerce or business association lists you, if you are a member
- [ ] Old listings with outdated addresses or numbers are corrected or removed
- [ ] You keep a simple list of where you are listed, so updates are easy

> **Tip:** Search for your business name together with your old phone number. Any results that still show the old number are listings worth correcting.

## Businesses with more than one location

Each location should have its own Google Business Profile and its own page on your website. The page should give that location’s address, hours, phone number, directions, staff and services, and link to the profile. Do not create profiles for places where you have no staffed location; Google’s guidelines are clear that each profile must represent a real place where the business operates or a genuine service area ([Google Business Profile guidelines](${GBP_GUIDELINES})).

## Measuring local search

Three free sources tell you most of what you need.

| Source | What to look at |
|---|---|
| Google Business Profile performance | Searches that found you, calls, direction requests and website visits |
| Google Search Console | Which searches show your website and which pages people click |
| Your own records | How new customers say they found you |

Look monthly, not daily. Rankings move for many reasons, most of them outside your control. Trends over several months, and the number of real inquiries, matter more than any single day.

## Common mistakes

| Mistake | Why it hurts | The fix |
|---|---|---|
| Keywords in the business name | Against the guidelines; risks suspension | Your real name only |
| A broad category | Google matches you to fewer relevant searches | The most specific category that fits |
| Different phone numbers in different places | Confusion for customers and Google | One main number everywhere |
| No page for each service | Less relevance for specific searches | A page per service |
| Ignoring reviews | Missed trust and missed prominence | Ask consistently and reply |
| Slow pages on phones | Visitors leave before they see you | Lighter pages and fewer heavy scripts |

## A 30-day plan

If you are starting from scratch, this order works well:

1. **Week one:** claim and complete your Google Business Profile, with the right name, category, hours and photos.
2. **Week two:** make your name, address and phone identical on your website and your main listings.
3. **Week three:** make sure every main service has its own page with a clear title, and add local business structured data.
4. **Week four:** start asking every customer for a review, reply to existing reviews and check your pages’ speed on a phone.

After that, the monthly routine below keeps everything current.

## Replying to reviews

Replies show customers how you treat people, and they are read by future customers more than the reviewer. A few patterns help.

| Kind of review | A good reply |
|---|---|
| Glowing | Thank them by name, mention what they appreciated, and invite them back |
| Mixed | Thank them, acknowledge the concern, and say what you are doing about it |
| Critical | Stay calm, avoid arguing in public, and offer to continue the conversation directly |
| Unfair or fake | Reply briefly and politely, and flag it to Google if it breaks the policy |

Keep replies short, never share private details about the customer, and never offer something in return for changing a review.

## Photos that help

Real photos help customers recognize your business and decide to visit. Add your entrance and street view so people can find you, your interior so they know what to expect, your team so they know who they will meet, and your work or products. Replace old photos when your premises change. Avoid stock images on your profile; customers notice.

## Local content on your website

Beyond service pages, a few pages about your local area can help when they are genuinely useful: a guide to parking near your shop, a seasonal checklist for homeowners in your climate, or answers to questions specific to your town’s rules. Write them because customers need them, not to repeat your town’s name. Google’s guidance on helpful content applies here as everywhere ([Google: creating helpful content](${HELPFUL})).

## Your website’s home page

The home page still matters for local search: it is often where your profile links and where many visitors start. It should say what you do and where in the first sentence, show your phone number and address or service area, link to each service page and make contacting you easy. Our article on [what to put on your home page](/blog/what-to-put-on-your-home-page) covers this in detail.

## Being mentioned locally

Prominence grows when your business is known and mentioned around your area. Sponsoring a local team, joining your business association, speaking at a community event or being featured in local news are all genuine ways to be mentioned and linked. Do them because they are good for your business and community; buying links or mentions breaks Google’s spam policies ([Google: spam policies](${SPAM})).

> **Tip:** Keep a one-page document with your exact business name, address, phone number, hours, categories and website. Copy from it every time you create or update a listing, so your details never drift.

## A monthly routine

Local SEO is a habit more than a project. Once a month: check your profile details and hours, reply to new reviews, add a few recent photos, and read one of your service pages as a customer would, fixing anything unclear. The article on [how Google decides which local businesses to show](/blog/how-google-picks-local-businesses) is a good companion read.

## Where SaySites fits

Every SaySites website includes local business structured data, a page for each service, consistent details from one place and pages built to load fast on a phone. See [websites for local businesses by trade](/websites-for/plumbers) and our other industries, compare plans on our [pricing page](/pricing), or send us your website for a [free redesign](/redesign). You can [start free](/signup) and change anything by asking Sofie.`,
  },
  {
    slug: 'google-business-profile-setup-guide',
    title: 'Google Business Profile Setup Guide for Local Businesses',
    description: 'Set up and optimize a Google Business Profile the way Google’s guidelines describe: name, category, address or service areas, hours, photos and reviews.',
    kind: 'guide',
    status: 'published',
    published: '2026-10-27',
    about: ['Google Business Profile', 'Local SEO', 'Google Maps'],
    hero: { src: u('1727893119356-1702fe921cf9'), alt: 'Mechanics working on cars in a bright workshop' },
    summary: [
      'Use your real business name, the most specific category and accurate location or service areas.',
      'Fill in every field that applies: hours, services, attributes and real photos, and keep them current.',
      'Reviews and replies matter; never use incentives, and keep your profile and website saying the same thing.',
    ],
    faq: [
      { q: 'Is a Google Business Profile free?', a: 'Yes. Creating and managing a Google Business Profile is free, including adding photos, hours and services and replying to reviews. Google sells ads separately, and ads are labeled as such. Paying for ads does not change where your profile appears in the unpaid local results.' },
      { q: 'Can I have a Google Business Profile without a storefront?', a: 'Yes. Businesses that serve customers at their location, such as plumbers or mobile services, can hide their address and set service areas instead. Google’s guidelines describe when an address should be shown and when service areas are the right choice.' },
      { q: 'What category should I choose?', a: 'Choose the most specific primary category that describes your main business, such as Personal Injury Attorney rather than Lawyer, then add secondary categories for other services you genuinely offer. Categories help Google match your profile to the right searches, so review them whenever your services change.' },
      { q: 'How many photos should I add to my profile?', a: 'Google does not set an ideal number. Add real photos that help customers: your exterior so they can find you, your interior, your team and your work. Update them over time so the profile stays current and shows what customers will actually see when they arrive, and avoid stock images.' },
      { q: 'Should I reply to every review?', a: 'Replying to reviews shows customers you are listening. Thank people for positive reviews and respond calmly and briefly to critical ones, without sharing private details. Never argue in public; offer to continue the conversation directly when needed. Future customers read your replies as closely as the reviews.' },
    ],
    body: `A Google Business Profile is the listing that appears when someone searches for your business by name, or for what you offer nearby, in Google Search and Google Maps. For many local businesses it is seen more often than the website. Setting it up properly takes an hour or two, and keeping it current takes a few minutes a month.

This guide walks through every part of a profile, in the order you will meet them, following Google’s own guidelines. It pairs with our [local search guide](/guides/local-seo) and our article on [no storefront? showing Google where you work](/blog/service-area-business-google).

## Before you start

Gather these first, so setup is quick:

- [ ] Your exact business name as it appears on your signage, documents and website
- [ ] Your address, or the towns and areas you serve if you go to customers
- [ ] Your main phone number and website address
- [ ] Your regular hours and any upcoming holiday hours
- [ ] A list of your services or products, with a sentence on each
- [ ] Some real photos: outside, inside, your team, your work

## 1. Your business name

Google’s guidelines are strict here: your name should reflect your real-world business name, as consistently used on your storefront, website and documents ([Google Business Profile guidelines](${GBP_GUIDELINES})).

| Allowed | Not allowed |
|---|---|
| Rossi Plumbing | Rossi Plumbing: Best Emergency Plumber Chicago |
| Smith & Lee Law | Smith & Lee Injury Lawyers Near Me |
| Bright Smile Dental | Bright Smile Dental, Cheap Implants |

> **Watch out:** Adding keywords, locations or taglines to your name is one of the most common reasons profiles are suspended. If your legal name genuinely includes a word like "Plumbing," that is fine; adding words that are not part of your name is not.

## 2. Category

Your primary category tells Google what your business is. Choose the most specific one that fits your main activity, then add secondary categories for other services you really offer.

- [ ] A specific primary category (for example "Divorce Lawyer" rather than "Lawyer," where it fits)
- [ ] Secondary categories only for services you actually provide
- [ ] Categories reviewed when your services change

## 3. Location or service areas

How you set your location depends on how you serve customers ([Google: service areas](${SERVICE_AREAS})):

| How you work | What to set |
|---|---|
| Customers visit you (shop, office, clinic) | Your address, shown on the profile |
| You go to customers (plumber, cleaner) | Service areas, with your address hidden |
| Both (a showroom that also does installs) | Your address and your service areas |

- [ ] Address entered exactly as it appears on your website
- [ ] Service areas limited to where you genuinely work
- [ ] No virtual offices or addresses where you do not actually operate

![Landscaper mowing a lawn](${u('1734303023491-db8037a21f09')})

## 4. Contact details and hours

- [ ] Main phone number, matching your website
- [ ] Website link to your home page, or to the page for that location if you have several
- [ ] Regular hours for every day
- [ ] Special hours for holidays, set ahead of time
- [ ] Appointment or booking link, if you use one

> **Tip:** Set a reminder before each holiday to add special hours. Customers who arrive to find you closed when Google said you were open often leave a review about it.

## 5. Verification

Google needs to confirm you run the business before the profile goes live. Depending on your business, Google may verify by phone, email, video or another method. Follow the steps Google offers in your profile, and keep your details consistent while verification is pending.

## 6. Services, products and description

- [ ] Each main service listed, with a short, plain description
- [ ] Products with photos and prices, if you sell products
- [ ] A business description that says what you do, for whom and where, without keyword stuffing or links
- [ ] Attributes that apply, such as wheelchair accessibility, online appointments or languages spoken

## 7. Photos

Real photos help customers recognize you and know what to expect.

- [ ] Exterior photos, so people can find you
- [ ] Interior photos, so they know what to expect
- [ ] Team photos, so they know who they will meet
- [ ] Photos of your work or products
- [ ] New photos added from time to time

![Cleaner vacuuming a bright living room](${u('1758273705627-937374bfa978')})

## 8. Reviews

Reviews are part of what Google calls prominence, one of the three main factors in local results ([Google Business Profile: how local ranking works](${LOCAL_RANKING})).

- [ ] Ask every customer, with a direct link to leave a review ([Google: tips for getting reviews](${REVIEW_TIPS}))
- [ ] Reply to reviews, thanking people and responding calmly to criticism
- [ ] Never offer discounts or gifts for reviews ([Google Maps: user contributed content policy](${MAPS_POLICY}))
- [ ] Never ask only satisfied customers or discourage negative reviews
- [ ] Never write or buy reviews

Our article on [asking for Google reviews without breaking the rules](/blog/ask-for-google-reviews-the-right-way) has message templates.

## 9. Keep the profile and website in step

Your website and your profile should say the same things. Google reads both, and so do customers.

- [ ] Same name, address, phone and hours on both
- [ ] Each service on your profile has a matching page on your website
- [ ] Local business structured data on your website ([Google: local business structured data](${LOCAL_SD}))
- [ ] When something changes, update both on the same day

## 10. A monthly check

- [ ] Hours and special hours correct
- [ ] New reviews answered
- [ ] Questions from customers answered
- [ ] A few new photos added
- [ ] Any suggested edits from Google or the public reviewed and corrected

## Posts and updates

Your profile can show posts: news, offers, events and updates. Google has not said posts affect ranking, but they can help the people who find your profile by showing what is current. If you use them:

- [ ] Share real news: a new service, holiday hours, an event or a seasonal reminder
- [ ] Use a clear photo and a short, plain description
- [ ] Remove or update offers once they end

## Messages and calls

If you turn on messaging, someone has to answer it. Unanswered messages frustrate customers. Turn it on only if a person will reply promptly during your business hours, and set an auto-reply that says when to expect a response.

## Suggested edits

Google lets the public suggest changes to business details, and Google may also update details from other sources. Check your profile regularly for changes you did not make, such as altered hours or a different phone number, and correct anything wrong. Keeping your website and profile consistent makes accidental changes less likely.

## Avoiding suspension

Profiles are most often suspended for breaking the guidelines on names, addresses or service areas ([Google Business Profile guidelines](${GBP_GUIDELINES})). The safest habits:

- [ ] Your real business name only
- [ ] A real address where you meet customers, or service areas if you go to them
- [ ] One profile per real location
- [ ] No fake or incentivized reviews
- [ ] Details that match your website and signage

If your profile is suspended, read the guidelines carefully, correct what does not comply, and follow Google’s process for requesting reinstatement.

## Several locations

Each real location gets its own profile, with its own address, hours, phone number and photos. Link each profile to that location’s page on your website, not just the home page, so customers land on the right details. Keep categories consistent across locations unless a location genuinely offers different services.

## Measuring your profile

Your profile’s performance view shows how people found you and what they did: calls, direction requests, website visits and bookings where available. Check it monthly. A drop in calls after a change to hours or categories is a sign to look again at what changed. Compare it with your own records of how new customers say they found you.

## Services by kind of business

Listing services clearly helps customers and helps Google understand what you do. Here are examples of how different businesses might list theirs.

| Business | Example services to list |
|---|---|
| Plumber | Drain cleaning, water heater repair, leak repair, repiping, emergency service |
| Law firm | Personal injury, car accidents, wrongful death, free consultations where true |
| Dental practice | Cleanings, fillings, crowns, whitening, emergency dental care |
| Med spa | Facials, injectables, laser hair removal, chemical peels |
| Restaurant | Dine-in, takeout, delivery, catering, private events |
| Hair salon | Cuts, color, highlights, blowouts, bridal styling |

Describe each in a sentence or two, using the words customers use, and list only what you actually offer.

## Choosing photos

Photos are often the first impression. A few principles:

- [ ] A clear exterior photo taken in daylight, showing your sign and entrance
- [ ] Interior photos that are tidy, well lit and true to what customers will see
- [ ] Team photos with real staff, ideally at work
- [ ] Photos of finished work or best-selling products
- [ ] No stock photos, heavy filters or text overlays

Take photos on a recent phone in good light; professional photography is a bonus, not a requirement.

## A holiday checklist

Holidays are when profiles most often show the wrong hours. Before each holiday season:

- [ ] Add special hours for every public holiday you close or change hours
- [ ] Update your website’s hours to match
- [ ] Add a post about holiday hours if you use posts
- [ ] After the holiday, check that regular hours are showing again

## When something goes wrong

Occasionally a profile shows wrong information, a duplicate profile appears, or a competitor-style edit changes your details. Check your profile monthly, correct anything wrong through your profile manager, and use Google’s support options for duplicates or problems you cannot fix yourself. Keeping a record of your correct details makes fixes faster.

## Bookings and appointment links

If customers book appointments, add your booking link so they can book straight from your profile. Use the same booking system your website uses, so availability stays consistent, and test the link from a phone after adding it. If you take bookings by phone only, say so in your description.

## Your description

The business description is a few sentences in your own words. Say what you do, who you serve and where, and what makes your business worth choosing, in plain language. Leave out links, prices that change often and lists of keywords. Read it aloud: if it sounds like something you would say to a customer, it is right.

## Common mistakes

| Mistake | Why it matters |
|---|---|
| Keywords in the business name | Against the guidelines; can lead to suspension |
| Wrong or outdated hours | Frustrated customers and negative reviews |
| Different phone numbers on profile and website | Confuses customers and weakens trust |
| No photos, or only stock photos | Customers can’t picture your business |
| Ignoring reviews | Missed chances to show you care |

## Where SaySites fits

SaySites can start your website from your Google Business Profile, bringing in your real name, address, phone and hours, and keeps your site’s details in one place so they stay consistent. See [how connecting your profile works](/connect/google-business-profile), our [websites for local businesses](/websites-for/cleaning-companies) by trade, and plans on our [pricing page](/pricing). Send us your current website for a [free redesign](/redesign), or [start free](/signup) today. The article on [how Google decides which local businesses to show](/blog/how-google-picks-local-businesses) is a good next read.`,
  },
  {
    slug: 'med-spa-website-checklist',
    title: 'Med Spa Website Checklist: Treatments, Claims and Booking',
    description: 'A checklist for med spa websites: treatment pages, who performs what, honest results and photos, health advertising rules, booking and local search.',
    kind: 'guide',
    status: 'published',
    published: '2026-10-29',
    about: ['Med spa websites', 'Health advertising', 'Local SEO'],
    hero: { src: u('1616394584738-fc6e612e71b9'), alt: 'Client receiving a facial mask treatment' },
    summary: [
      'Clients compare providers carefully: give every treatment its own page with who it suits, who performs it and what to expect.',
      'Aesthetic treatments are health care, so claims need evidence and photos and reviews must be genuine and honest.',
      'A booking button on every treatment page and consistent local details turn research into appointments.',
    ],
    faq: [
      { q: 'What pages should a med spa website have?', a: 'A home page, a page for each treatment, a page about your providers and their credentials, pricing or consultation information, a booking page, and a contact page with your address and hours. Treatment pages usually matter most, because clients research specific treatments before choosing a provider.' },
      { q: 'Can a med spa show before-and-after photos?', a: 'Genuine photos of your own clients, used with written consent and without editing that changes the result, are generally allowed. Add a note that results vary between people, and check your state’s rules on health advertising, which can be stricter for medical treatments.' },
      { q: 'Should I list who performs each treatment?', a: 'Yes. Clients want to know who will treat them and what training they have, and several states regulate who may perform or supervise aesthetic treatments. Naming providers and their credentials on each treatment page builds trust and keeps your descriptions accurate.' },
      { q: 'Is it okay to say a treatment is painless or permanent?', a: 'Be very careful with absolute words. Health claims should be supported by evidence, and words like painless, permanent or guaranteed are hard to support for every client. Describe what most clients experience, honestly, and explain what affects results, such as skin type, age and aftercare.' },
      { q: 'Should a med spa publish prices online?', a: 'Many do, as starting prices or ranges, because clients compare before booking. If the price depends on a consultation, explain why and what the consultation includes. Transparent pricing can reduce calls from people who are not a good fit and builds trust with those who are.' },
    ],
    body: `People choosing a med spa research carefully. They compare treatments, providers, prices, photos and reviews, often across several businesses, before they book a consultation. A med spa website wins when it answers their questions honestly and specifically, shows who will treat them, and makes booking easy at every step.

This checklist covers what a med spa website needs, from treatment pages to advertising rules. It follows our [med spa guide](/guides/med-spas).

## 1. The first screen

- [ ] What you offer, in plain words, and where you are
- [ ] A clear booking button
- [ ] A tap-to-call number
- [ ] One or two signs of credibility, such as your medical director or provider credentials

## 2. Treatment pages

Give every treatment its own page. Clients search for specific treatments, and a dedicated page gives them, and Google, a clear match.

- [ ] What the treatment is and what it does, in plain language
- [ ] Who it suits and, just as important, who it does not
- [ ] How many sessions are usual and how long each takes
- [ ] What clients usually feel during and after
- [ ] Downtime and aftercare
- [ ] When results usually appear and what affects them
- [ ] Who performs it, with credentials
- [ ] Starting price or how pricing works
- [ ] A booking button

> **Tip:** Your consultation notes are a goldmine. The questions clients ask before booking each treatment belong on that treatment’s page.

![Dropper of skincare serum](${u('1515377905703-c4788e51af15')})

## 3. Providers and supervision

Aesthetic treatments are health care. Clients want to know who will treat them, and many states regulate who may perform or supervise treatments such as injectables and lasers.

- [ ] A page or section for each provider with a recent photo
- [ ] Licenses, certifications and training described accurately
- [ ] Your medical director named, where you have one
- [ ] Each treatment page names who performs it

State rules differ. Our article on [Texas advertising and delegation rules for Dallas med spas](/blog/dallas-med-spa-website-design) covers one state in depth.

## 4. Claims, photos and reviews

Health advertising is held to a high standard. The FTC expects health-related claims to be supported by competent and reliable scientific evidence ([FTC: health products compliance guidance](${FTC_HEALTH})). Reviews and testimonials must reflect honest experiences and must not suggest unusual results are typical ([FTC: endorsement guides](${FTC_ENDORSE})).

| Instead of | Try |
|---|---|
| Painless | Most clients describe mild discomfort; we use numbing cream when appropriate |
| Permanent results | Results usually last several months; maintenance sessions keep them up |
| Guaranteed | We will explain at your consultation whether this treatment suits you |
| Look ten years younger | Softens the appearance of fine lines; results vary between people |

- [ ] Before-and-after photos are your own clients’, with written consent
- [ ] Photos are not retouched in ways that change the result
- [ ] A note that results vary appears with photos and testimonials
- [ ] Reviews are real and unedited, shown with permission

> **Watch out:** Comparisons with other providers, discount-driven urgency and celebrity-style endorsements are the areas most likely to raise problems. Check them against your state’s rules first.

## 5. Booking

- [ ] A booking button on every treatment page, not just the home page
- [ ] As few steps as possible to request or book
- [ ] Consultation availability clear
- [ ] Deposit and cancellation policies stated plainly
- [ ] A phone number for people who prefer to talk

## 6. Privacy

A website form is for booking requests and general questions, not medical history. HIPAA protects patients’ health information held by covered practices ([HHS: HIPAA for professionals](${HHS_HIPAA})).

- [ ] Forms ask only for contact details and the treatment they are interested in
- [ ] A note asks clients not to include medical details
- [ ] Clinical intake handled in your secure system

![Hot stone spa treatment](${u('1600334089648-b0d9d3028eb2')})

## 7. Local search

Clients look for treatments near them. Google says local results depend on relevance, distance and prominence ([Google Business Profile: how local ranking works](${LOCAL_RANKING})).

- [ ] Name, address, phone and hours identical on your website and Google Business Profile
- [ ] The neighborhoods and towns you draw clients from, mentioned where true
- [ ] Structured data describing your business ([Google: local business structured data](${LOCAL_SD}))
- [ ] A steady flow of genuine Google reviews, without incentives ([Google: tips for getting reviews](${REVIEW_TIPS}))

Our [local SEO checklist](/blog/local-seo-checklist-small-business) covers this in more depth.

## 8. Speed, accessibility and search results

- [ ] Fast pages on a phone, without heavy video at the top ([Google: Core Web Vitals](${CWV}))
- [ ] Readable text, strong contrast and alt text on images ([ADA.gov: web guidance](${ADA_WEB}))
- [ ] Unique titles naming the treatment and place ([Google: title links](${TITLE_LINKS}))
- [ ] Treatment pages that answer the main question in their opening sentences, which also helps AI answers ([Google: AI features](${AI_FEATURES}))

## A worked example: a treatment page outline

Here is an outline for a page about a common injectable treatment. Adapt the details to your own services, providers and state rules.

| Section | What goes in it |
|---|---|
| Opening | What the treatment softens or improves, in plain words |
| Who it suits | Good candidates, and who should consider something else |
| The appointment | Consultation, the treatment itself and roughly how long it takes |
| Comfort | What clients usually feel and what you do to keep them comfortable |
| Afterwards | Aftercare, downtime and when results usually appear |
| How long results last | A typical range, described honestly, with what affects it |
| Who performs it | The providers, with credentials |
| Price | Starting price or how pricing works |
| Book | A booking button and phone number |

## Pricing pages

Clients compare prices before they compare anything else, so a clear pricing page saves everyone time.

- [ ] Starting prices or ranges for your main treatments
- [ ] What affects price, such as the area treated or the number of sessions
- [ ] Consultation fees, and whether they apply toward treatment
- [ ] Packages and memberships described with exactly what they include
- [ ] How to cancel memberships, stated plainly

## Common mistakes on med spa websites

| Mistake | Why it hurts | The fix |
|---|---|---|
| Heavy video at the top of every page | Slow pages on phones, and visitors leave | A single strong photo and fast pages |
| Absolute claims like "painless" or "permanent" | Hard to support; raises advertising concerns | Honest descriptions of typical experiences |
| No provider names | Clients can’t tell who will treat them | Name providers and credentials on each treatment page |
| Booking only on the home page | Clients researching a treatment can’t act | A booking button on every treatment page |
| Edited before-and-after photos | Misleading and risky | Genuine, unretouched photos with consent |
| Outdated specials | Erodes trust | Remove offers as soon as they end |

## Social media and your website

Many med spa clients discover you on social media, then visit your website to decide. Make sure every treatment you promote on social media has a page on your site with full details and a booking button. Link from your social profiles to the specific treatment page, not just the home page. Your website is where clients check credentials, prices and honest expectations before they book.

## Measuring what works

| Source | What it tells you |
|---|---|
| Your booking system | Which treatments are booked from the website |
| Google Search Console | Which searches lead to which treatment pages |
| Google Business Profile performance | Calls, direction requests and website visits from your profile |

Review monthly. If a treatment page gets visitors but few bookings, check that the price, the provider and the booking button are all easy to find.

## Consultation pages

Many treatments start with a consultation. A clear page about consultations removes a common barrier.

- [ ] What happens at a consultation, step by step
- [ ] How long it takes and who it is with
- [ ] Whether there is a fee and whether it is credited toward treatment
- [ ] What clients should bring or prepare
- [ ] How to book, with a button and phone number

## Aftercare pages

Aftercare instructions are useful to clients after their visit and help new clients understand what they are signing up for. A page per treatment with plain aftercare guidance, written or approved by your medical director, is something clients return to and share. Keep it general and accurate, and point clients to your team for any concerns about their own treatment.

## Reviews and replies

Reviews influence med spa clients heavily, and Google treats reviews as part of prominence in local results ([Google Business Profile: how local ranking works](${LOCAL_RANKING})).

- [ ] Invite every client to leave a review, with a direct link
- [ ] Never offer discounts, credits or gifts for reviews ([Google Maps: user contributed content policy](${MAPS_POLICY}))
- [ ] Reply without discussing the client’s treatment or confirming medical details
- [ ] Show a few genuine reviews on your site, with permission, and a note that results vary

## Welcoming every client

Clients come in every age, skin tone and body type. Photos on your site should reflect the clients you actually serve, and treatment pages should say plainly whether a treatment suits different skin types. Accessible pages, with readable text, alt text and labeled forms, help every visitor book ([ADA.gov: web guidance](${ADA_WEB})).

## Gift cards, packages and memberships

Gift cards, treatment packages and memberships are popular with regular clients, and they deserve clear pages: what is included, how long it lasts, how to redeem it and how to cancel. Customers buying for someone else want to know exactly what the recipient gets. State terms in plain language rather than burying them, and keep prices current.

## Keep everything current

Treatments, providers, prices and specials change often in a med spa. Review your treatment pages, pricing and provider list every quarter, remove expired offers immediately, and update your website and Google Business Profile on the same day. Current, accurate information is one of the easiest ways to stand out from busier, more cluttered sites.

## Answering questions quickly

Clients researching treatments often have one more question before they book. Make it easy to ask: a short contact form, a phone number and, if you use it, messaging that someone answers during business hours. Reply promptly and personally, answer the question asked, and invite them to book a consultation when it suits them. Quick, helpful replies often decide whether someone books with you or keeps searching, especially for a first treatment they feel unsure about. Keep a short list of your most common questions, and add their answers to the relevant treatment pages over time so the next visitor finds them without asking.

## A sensible order

Start with your most-booked treatments: give each a full page with providers, honest expectations and a booking button. Then review every claim and photo against the rules, then local details, then speed. The article on [how Google decides which local businesses to show](/blog/how-google-picks-local-businesses) is a useful companion.

## Where SaySites fits

SaySites med spa websites give every treatment its own page with a booking button, show your providers and credentials, and load fast on a phone. See the designs on our page about [websites for med spas](/websites-for/med-spas), compare plans on our [pricing page](/pricing), or send us your website for a [free redesign](/redesign). You can [start free](/signup) and change anything by asking Sofie.`,
  },
]
