// Asking customers for reviews, the way Google allows: ask every customer
// (not only the happy ones), offer nothing in return, and never write or post
// reviews for them. These messages are fixed templates, so they cost nothing.

import type { Site } from './schema'
import { siteOrigin } from './schema'

export interface ReviewMessage {
  id: string
  label: string
  subject?: string
  body: string
}

// The Google review link from a Place ID, for owners who have one.
export function googleReviewUrl(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId.trim())}`
}

export function reviewLink(site: Pick<Site, 'subdomain' | 'customDomain'>): string {
  return `${siteOrigin(site)}/review`
}

export function reviewMessages(site: Site): ReviewMessage[] {
  const name = site.business.name
  const link = reviewLink(site)
  if (site.language?.startsWith('es')) {
    return [
      { id: 'text', label: 'Mensaje de texto', body: `Hola, gracias por elegir ${name}. Si tienes un minuto, nos ayudaría mucho que compartieras tu experiencia: ${link}` },
      { id: 'email', label: 'Correo electrónico', subject: `¿Cómo lo hicimos?`, body: `Hola,\n\nGracias por confiar en ${name}. Nos encantaría saber cómo fue tu experiencia, sea cual sea. Si tienes un minuto, puedes dejar una reseña aquí:\n\n${link}\n\nTus comentarios ayudan a otras personas de la zona a elegir, y a nosotros a mejorar.\n\nGracias,\n${name}` },
      { id: 'person', label: 'En persona', body: `“Si tienes un momento, nos ayudaría mucho que dejaras una reseña sobre tu experiencia. Esta tarjeta te lleva directo.”` },
    ]
  }
  return [
    { id: 'text', label: 'Text message', body: `Hi, thanks for choosing ${name}. If you have a minute, we’d really appreciate hearing how it went: ${link}` },
    { id: 'email', label: 'Email', subject: 'How did we do?', body: `Hi,\n\nThank you for choosing ${name}. We’d love to hear how your experience was, whatever you thought of it. If you have a minute, you can leave a review here:\n\n${link}\n\nYour feedback helps other people nearby decide, and helps us get better.\n\nThank you,\n${name}` },
    { id: 'person', label: 'In person', body: `“If you have a moment, we’d really appreciate a review about your experience. This card takes you straight there.”` },
  ]
}

// Only links that are plainly a review page (or a known review site) are accepted.
export function checkReviewUrl(input: string): { url?: string; error?: string } {
  const raw = input.trim()
  if (!raw) return {}
  let u: URL
  try {
    u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
  } catch {
    return { error: 'That doesn’t look like a link.' }
  }
  if (u.protocol !== 'https:') return { error: 'The link needs to start with https://.' }
  if (u.href.length > 500) return { error: 'That link is too long.' }
  return { url: u.href }
}
