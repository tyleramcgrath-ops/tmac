// Talk & Design templates: the four example sites, each with a detailed
// prompt that fills in with the owner's details. The prompt shows how
// easy it is to describe a website in plain words; Sofie then designs the
// site from it, starting from the template's design.

import type { Design } from './starter'

export interface TemplateInfo {
  name?: string
  typeLabel?: string
  city?: string
  region?: string
  phone?: string
  services?: string[]
}

export interface Template {
  key: Design
  name: string
  bestFor: string
  example: string // showcase subdomain
  palette: string
  prompt: (info: TemplateInfo) => string
}

const or = (v: string | undefined, fallback: string) => (v && v.trim() ? v.trim() : fallback)
const list = (s: string[] | undefined, fallback: string) => (s && s.length ? s.slice(0, 6).join(', ') : fallback)

export const TEMPLATES: Template[] = [
  {
    key: 'bold',
    name: 'Bold & Local',
    bestFor: 'Plumbers, electricians, roofers, cleaners, mechanics',
    example: 'rivertown-plumbing',
    palette: 'ocean',
    prompt: (i) =>
      `Build a website for ${or(i.name, '[your business name]')}, a ${or(i.typeLabel, '[kind of business]').toLowerCase()} in ${or(i.city, '[your city]')}, ${or(i.region, '[state]')}. ` +
      `Use a full-width photo at the top with a dark fade, a big confident headline and two buttons: one to call ${or(i.phone, '[your phone number]')} and one to see our services. ` +
      `Put a slim bar above the menu that says who we serve, with our phone number on the right. ` +
      `Under the photo, add a strip of four short reasons to choose us. Then a "What we do" section with a photo card for each service: ${list(i.services, '[your services]')}. ` +
      `Add a "why people call us" section, three common questions with honest answers, and a dark call-to-action band at the bottom. ` +
      `Keep the wording friendly, plain and local, and set the Google titles for our trade and city.`,
  },
  {
    key: 'editorial',
    name: 'Calm & Refined',
    bestFor: 'Salons, dentists, law firms, studios',
    example: 'salt-and-stone',
    palette: 'plum',
    prompt: (i) =>
      `Build a website for ${or(i.name, '[your business name]')}, a ${or(i.typeLabel, '[kind of business]').toLowerCase()} in ${or(i.city, '[your city]')}, ${or(i.region, '[state]')}. ` +
      `Make it feel calm and elegant: serif headings, soft neutral colors and plenty of space. ` +
      `Start with a large photo on the left and our headline on the right, with a button to ${i.phone ? `call ${i.phone}` : 'book a visit'} and another to see our services. ` +
      `Follow with one centered sentence about how we treat every client, then a services section with a tall photo for each: ${list(i.services, '[your services]')}. ` +
      `Finish with three common questions, a simple booking call-to-action and our hours in the footer. ` +
      `Write like a thoughtful person, not an advert, and set the Google titles for our city.`,
  },
  {
    key: 'warm',
    name: 'Warm & Handmade',
    bestFor: 'Bakeries, cafés, restaurants, shops',
    example: 'rosies-bakery',
    palette: 'sunset',
    prompt: (i) =>
      `Build a website for ${or(i.name, '[your business name]')}, a ${or(i.typeLabel, '[kind of business]').toLowerCase()} in ${or(i.city, '[your city]')}, ${or(i.region, '[state]')}. ` +
      `Make it warm and inviting: a cream background, serif headings and rounded buttons. ` +
      `Open with our headline and a short welcome on the left and a big photo of what we make on the right, with buttons to ${i.phone ? `call ${i.phone}` : 'get in touch'} and to see what we offer. ` +
      `Then a "What we make" section with a photo card for each: ${list(i.services, '[what you make or sell]')}. ` +
      `Add a dark band about being made here in ${or(i.city, '[your city]')}, three common questions, and our address and hours in the footer. ` +
      `Keep the wording cozy and specific, and set the Google titles for our city.`,
  },
  {
    key: 'upscale',
    name: 'Dark & Upscale',
    bestFor: 'Restaurants, bars, salons, boutiques',
    example: 'olive-and-ember',
    palette: 'noir',
    prompt: (i) =>
      `Build a website for ${or(i.name, '[your business name]')}, a ${or(i.typeLabel, '[kind of business]').toLowerCase()} in ${or(i.city, '[your city]')}, ${or(i.region, '[state]')}. ` +
      `Make it dark and upscale: a near-black background, warm gold accents, elegant serif headings and sharp, understated buttons. ` +
      `Open with a full-width photo and a short, confident headline, with buttons to ${i.phone ? `call ${i.phone}` : 'get in touch'} and to explore what we offer. ` +
      `Follow with one centered line about what it feels like to come here, then tall photo cards for: ${list(i.services, '[what you offer]')}. ` +
      `Finish with three common questions and a simple call-to-action, with our hours and address in the footer. ` +
      `Keep the wording short, calm and specific, never salesy, and set the Google titles for our city.`,
  },
]

export function templateFor(key: string | undefined): Template | undefined {
  return TEMPLATES.find((t) => t.key === key)
}
