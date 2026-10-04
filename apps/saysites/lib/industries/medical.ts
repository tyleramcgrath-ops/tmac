// "Websites for <trade>" landing pages: medical practices and med spas.
// Every claim here must match what SaySites actually does today. No booking,
// ranking or results promises, prices only from lib/billing.ts, and no claims about how health
// information is handled: the request form is for contact details and a short
// note only.

import { PRICES } from '../billing'
import type { Industry } from './types'

export const MEDICAL_PRACTICES: Industry = {
  slug: 'medical-practices',
  type: 'doctor',
  example: 'brightwater-family-medicine',
  plural: 'medical practices',
  title: 'Websites for Medical Practices | SaySites',
  description: 'A fast, clear medical practice website with a page per service, provider profiles and an appointment request form. No long contract, and it’s yours.',
  kicker: 'Websites for medical practices',
  h1: 'A medical practice website patients can actually use.',
  lede: 'Before they call, patients want to know if you’re taking new patients, which insurance you accept and who they’ll see. SaySites builds a calm, fast site that answers those questions clearly, and it stays yours.',
  problems: [
    { title: 'The basic questions go unanswered', body: 'Are you accepting new patients? Do you take my insurance? Where do I park? When a site doesn’t say, patients call to ask, or pick a practice whose site does.' },
    { title: 'Providers are hard to get to know', body: 'Patients choose a person as much as a practice. A page of names with no photos, training or interests gives them little reason to pick you.' },
    { title: 'One services list for everything', body: 'Annual physicals, sports injuries, well-child visits and chronic care are separate searches. A single list of services rarely ranks for any of them.' },
    { title: 'Small updates take weeks', body: 'Changing hours for a holiday, adding a new provider or updating the insurance list often means a support ticket and a long wait.' },
  ],
  pages: [
    { name: 'Home', why: 'Who you care for, where you are, your hours, a call button and a clear note on whether you’re accepting new patients.' },
    { name: 'A page per service', why: 'Physicals, pediatric visits, joint pain, chronic care and the other services you offer each get their own page, so each can match the searches patients make.' },
    { name: 'Provider profiles', why: 'Photos and real bios for each doctor, nurse practitioner and physician assistant: training, board certification and what they focus on. Never invented.' },
    { name: 'New patients and insurance', why: 'What to expect at a first visit, what to bring, and the plans you accept, kept current with a quick request to Sofie.' },
    { name: 'Appointment request', why: 'A form for contact details and a short note that lands in your inbox for your front desk. It asks patients not to send medical details through it.' },
    { name: 'Emergency note', why: 'A plain note on every page that the site isn’t for emergencies and that anyone with an urgent medical need should call 911.' },
    { name: 'Locations and contact', why: 'Phone, hours, address, parking and directions for each office, written so both patients and Google can read them.' },
  ],
  searches: [
    'family doctor near me accepting new patients',
    'primary care [your city]',
    'pediatrician near me',
    'orthopedic doctor [your city]',
    'internal medicine doctor that takes [your insurance]',
    'sports physical near me',
  ],
  seo: [
    { title: 'Practice details Google can read', body: 'Structured data describes your practice with its name, address, phone, hours and providers, which is the information Google uses for local results and the map.' },
    { title: 'One page per service', body: 'Each service and specialty gets a substantial page with its own title and description sized to fit Google’s results.' },
    { title: 'Fast on every phone', body: 'Every page must score 95+ on speed before it can go live. Most patients look for a doctor on their phone, often while feeling unwell.' },
    { title: 'Real expertise, never invented', body: 'Provider bios, real reviews and plain-English health information are what Google’s quality guidelines ask for. SaySites never invents credentials, reviews or outcomes.' },
  ],
  sofie: [
    'Add a page about sports physicals for students',
    'Update our insurance list to add Aetna',
    'Add Dr. Morales to the providers page with this photo and bio',
    'Change our hours for the Thanksgiving week',
    'Add a banner saying we’re accepting new patients again',
  ],
  faq: [
    { q: 'How much does a medical practice website cost on SaySites?', a: `$${PRICES.site.month} a month (or $${PRICES.site.year} a year) on the Site plan, with hosting, your domain, your leads pipeline, call tracking and SEO included. No setup fee and no contract, and your site, content and domain stay yours. Start with a free redesign of your current site to see what you’d get.` },
    { q: 'Can patients book appointments online?', a: 'There’s no online booking system. Patients can call the practice or send an appointment request through the form, which lands in your inbox for your front desk to follow up.' },
    { q: 'Is the request form meant for medical details?', a: 'No. The form is for contact details and a short note, and it asks patients not to send medical details through it. Handle anything clinical through your usual channels.' },
    { q: 'Does the site say what to do in an emergency?', a: 'Yes. Every medical site includes a note that the site isn’t for emergencies and that anyone with an urgent medical need should call 911.' },
    { q: 'Can we add a page for each specialty and provider?', a: 'Yes. Ask Sofie for a page on any service you offer or any provider who joins, and she writes it for your practice and your city. Bios use the real details you give her.' },
    { q: 'Can we move our existing site over?', a: 'Yes. Enter your current website’s address and SaySites imports your pages, keeps the same page addresses wherever it can, and sets permanent redirects where one changes.' },
    { q: 'Does anyone on our staff need to be technical?', a: 'No. Anyone on your team can ask for changes in plain English, see each one as a draft first, and undo anything.' },
    { q: 'Can you guarantee more patients or a top ranking?', a: 'No one honestly can. What we can do is give you the foundations Google rewards: fast pages, accurate practice details, real expertise and helpful content.' },
  ],
}

export const MED_SPAS: Industry = {
  slug: 'med-spas',
  type: 'medspa',
  example: 'lumen-aesthetics',
  plural: 'med spas',
  title: 'Websites for Med Spas | SaySites',
  description: 'A polished, fast med spa website with a page per treatment, provider profiles and a consultation request form. No long contract, and it’s yours.',
  kicker: 'Websites for med spas',
  h1: 'A med spa website that earns the consultation.',
  lede: 'Clients compare treatments, providers and photos long before they reach out. SaySites builds a polished, fast site that explains each treatment honestly, introduces the people who perform it, and makes asking for a consultation easy.',
  problems: [
    { title: 'Treatments buried in one long menu', body: 'Injectables, laser hair removal, skin resurfacing and body contouring are each searched on their own. A single menu page gives Google little to rank for any of them.' },
    { title: 'Clients can’t tell who does the work', body: 'People want to know who will be holding the needle or the laser, and what training they have. Stock photos and first names alone don’t build that trust.' },
    { title: 'Beautiful but slow', body: 'Heavy image galleries and video headers look good on a desktop and crawl on a phone. Most clients browse on their phone, and many leave before the page finishes loading.' },
    { title: 'Waiting on someone to update it', body: 'A new treatment, a seasonal offer or a new injector should be on the site the same week, not after a long back and forth.' },
  ],
  pages: [
    { name: 'Home', why: 'Your signature treatments, your location, and one clear way to ask for a consultation, right at the top on every phone.' },
    { name: 'A page per treatment', why: 'Each treatment gets its own page: what it is, who it suits, what to expect and any downtime, written plainly and without hype.' },
    { name: 'Provider profiles', why: 'Photos and real bios for your injectors, nurses and medical director, with their training and credentials. Never invented.' },
    { name: 'Before and after gallery', why: 'Real photos from your own clients, shared with their permission, with a clear note that results vary from person to person.' },
    { name: 'Consultation request', why: 'A form for contact details and a short note about what they’re interested in. It asks clients not to send medical details through it.' },
    { name: 'Contact', why: 'Phone, hours, address and directions, written so both clients and Google can read them.' },
  ],
  searches: [
    'med spa near me',
    'botox [your city]',
    'lip filler near me',
    'laser hair removal [your city]',
    'microneedling near me',
    'best med spa in [your city]',
  ],
  seo: [
    { title: 'Business details Google can read', body: 'Structured data describes your med spa with its name, address, phone and hours, which is the information Google uses for local results and the map.' },
    { title: 'One page per treatment', body: 'Each treatment gets a substantial page with its own title and description, so a search for a specific treatment in your city can land on a page that’s actually about it.' },
    { title: 'Polished and fast', body: 'Photos are sized for phones and every page must score 95+ on speed before it can go live, so the site looks good without making clients wait.' },
    { title: 'Honest claims only', body: 'Every treatment and gallery page carries a “results vary” note, and SaySites never invents results, reviews, credentials or before and after photos.' },
  ],
  sofie: [
    'Add a page about microneedling with what to expect afterward',
    'Add Jenna to the providers page with her training and this photo',
    'Add these before and after photos to the lip filler gallery',
    'Change our Saturday hours to 9 to 3',
    'Write a blog post on how to prepare for your first laser session',
  ],
  faq: [
    { q: 'How much does a med spa website cost on SaySites?', a: `$${PRICES.site.month} a month (or $${PRICES.site.year} a year) on the Site plan, with hosting, your domain, your leads pipeline, call tracking and SEO included. No setup fee and no contract, and your site, content and domain stay yours. Start with a free redesign of your current site to see what you’d get.` },
    { q: 'Can clients book treatments online?', a: 'There’s no online booking system. Clients can call you or send a consultation request through the form, which lands in your inbox for your team to follow up.' },
    { q: 'Is the consultation form meant for medical details?', a: 'No. The form is for contact details and a short note about what the client is interested in, and it asks them not to send medical details through it. Handle health history through your usual intake process.' },
    { q: 'Can we show before and after photos?', a: 'Yes, as long as they’re real photos from your own clients and you have their permission. Each gallery includes a note that results vary from person to person.' },
    { q: 'Can we add a page for every treatment?', a: 'Yes. Ask Sofie for a page on any treatment you offer and she writes it for your med spa and your city, with its own title and description for Google.' },
    { q: 'Do we own our website and content?', a: 'Yes. Your words, photos, provider bios and domain are yours. If you ever leave, you take them with you.' },
    { q: 'Can you guarantee more bookings or a top ranking?', a: 'No one honestly can. What we can do is give you the foundations Google rewards: fast pages, accurate business details, real expertise and helpful content.' },
  ],
}
