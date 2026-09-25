import type { Industry } from './types'

export const LAW_FIRMS: Industry = {
  slug: 'law-firms',
  type: 'lawyer',
  example: 'hale-and-porter',
  plural: 'law firms',
  title: 'Law Firm Websites Without the Contract | SaySites',
  description: 'A fast, professional law firm website with practice area pages, attorney advertising notices and a consultation form. $15 a month, no contract, and it’s yours.',
  kicker: 'Websites for law firms',
  h1: 'A law firm website you own, for $15 a month.',
  lede: 'Practice area pages written for how clients search, a consultation form that reaches your inbox, and the professional polish a firm needs. No long contract, no setup fee, and every word and page stays yours.',
  problems: [
    { title: 'Locked into a platform', body: 'Many legal marketing providers sign firms to 12-month or longer agreements, and sites built on a proprietary platform have to be rebuilt from scratch when a firm leaves.' },
    { title: 'Paying agency prices for small changes', body: 'Changing a bio, adding a practice area or updating a phone number often means a support ticket and a wait. Simple edits shouldn’t take a week.' },
    { title: 'Slow pages that lose calls', body: 'People looking for a lawyer are often stressed and on their phone. A page that takes seconds to load sends them back to the search results and on to the next firm.' },
    { title: 'Thin practice area pages', body: 'One page listing every area of law rarely ranks for anything. Clients search for a specific problem in a specific place, and the site has to answer that.' },
  ],
  pages: [
    { name: 'Home', why: 'Who you help, where, and one clear way to reach you: a call button and a consultation request, above the fold on every phone.' },
    { name: 'Practice areas', why: 'A hub linking to a page for each area you handle, so each one can rank on its own for the searches clients actually make.' },
    { name: 'Attorney profiles', why: 'Real bios with education, bar admissions and experience. Clients choose a person, and Google looks for signs of real expertise.' },
    { name: 'Client reviews', why: 'Real reviews from real clients, shown word for word. Never invented, never paraphrased.' },
    { name: 'Contact and consultation', why: 'A form that goes straight to your inbox, with your phone, address, hours and a map-ready address Google can read.' },
    { name: 'Legal guides and blog', why: 'Plain-English answers to the questions clients ask before they call. Each post gets its own page and a place in your sitemap.' },
  ],
  searches: ['personal injury lawyer near me', 'divorce attorney [your city]', 'how much does an estate plan cost', 'DUI lawyer free consultation', 'best family law firm in [your city]', 'what to do after a car accident in [your state]'],
  seo: [
    { title: 'LegalService business details', body: 'Your firm is described to Google as a LegalService, with your name, address, phone, hours and service area, so it can show you in local results and the map.' },
    { title: 'One page per practice area', body: 'Sofie writes a separate, substantial page for each area of law you handle, each with its own title and description sized to fit Google’s results.' },
    { title: 'Fast on every phone', body: 'Every page must score 95+ on speed before it can go live. Most legal searches happen on phones, often in a hurry.' },
    { title: 'Content that shows real experience', body: 'Attorney bios, real reviews and helpful guides are what Google’s quality guidelines ask for. SaySites never invents credentials, results or reviews.' },
  ],
  sofie: [
    'Add a practice area page about wrongful death claims in our county',
    'Update Sarah’s bio: she was admitted to the Ohio bar in 2012',
    'Write a guide on what to bring to a first divorce consultation',
    'Add our Spanish-speaking line to the header',
    'Add the attorney advertising notice to the bottom of every page',
  ],
  faq: [
    { q: 'How much does a law firm website cost on SaySites?', a: '$15 a month, with no setup fee and no long-term contract. That includes hosting, your own domain, speed checks, SEO basics and changes by Sofie. It’s free during early access.' },
    { q: 'Do we own our website and content?', a: 'Yes. Your words, photos, attorney bios and domain are yours. If you ever leave, you take them with you.' },
    { q: 'Does it handle attorney advertising rules?', a: 'Each law firm site includes an attorney advertising notice and a note that information on the site isn’t legal advice, and Sofie never invents results, credentials or reviews. Bar rules vary by state, so the final wording is always yours to review.' },
    { q: 'Can we add a page for every practice area?', a: 'Yes. Ask Sofie for a page on any area you handle and she writes it for your firm and your city. Each page gets its own title and description for Google.' },
    { q: 'Do we need anyone technical to run it?', a: 'No. You change the site by asking in plain English, see every change as a draft first, and can undo anything.' },
    { q: 'Can you guarantee we’ll rank first on Google?', a: 'No one honestly can. What we can do is give you the foundations Google rewards: fast pages, accurate firm details, real expertise and helpful content, and a score that shows exactly what to improve next.' },
  ],
}
