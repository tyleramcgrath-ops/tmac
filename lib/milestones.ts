// Small achievements an owner collects while building their site. Each is
// worked out from what the site already has, so nothing extra is stored.
// The dashboard shows them as a row of marks, and the first time one is
// earned the SaySites moment plays (components/Milestones.tsx).

export interface Milestone {
  id: string
  // The mark's name, and the line under the name in the moment.
  label: string
  caption: string
  // What to do to earn it, shown while it's still to come.
  hint: string
  href: string
  done: boolean
}

export interface MilestoneFacts {
  siteName: string
  base: string
  hasLogo: boolean
  sofieChanged: boolean
  photos: number
  visits: number
  messages: number
  posts: number
  products: number
  customDomain?: string
  seoClean: boolean
}

export function milestones(f: MilestoneFacts): Milestone[] {
  const m = (id: string, done: boolean, label: string, caption: string, hint: string, href: string): Milestone => ({ id, done, label, caption, hint, href })
  return [
    m('live', true, 'On the internet', 'is on the internet.', 'Build your site.', f.base),
    m('logo', f.hasLogo, 'Signature', 'has a logo.', 'Pick a logo Sofie designs, or upload yours.', `${f.base}/photos`),
    m('sofie', f.sofieChanged, 'First words', 'just changed with a sentence.', 'Ask Sofie to change something.', `${f.base}/sofie`),
    m('photos', f.photos > 0, 'In your own light', 'is showing your own photos.', 'Upload a photo of your work.', `${f.base}/photos`),
    m('visitor', f.visits > 0, 'First visitor', 'just had its first visitor.', 'Share your address.', `${f.base}/visitors`),
    m('message', f.messages > 0, 'First hello', 'got its first message.', 'Someone fills in your contact form.', `${f.base}/messages`),
    m('post', f.posts > 0, 'First story', 'published its first post.', 'Write a post, or ask Sofie to.', `${f.base}/posts`),
    m('shop', f.products > 0, 'Open for business', 'is selling online.', 'Add a product.', `${f.base}/products`),
    m('seo', f.seoClean, 'Top marks', 'passes every Google check.', 'Clear every SEO tip.', `${f.base}/pages`),
    m('domain', !!f.customDomain, 'A name of its own', 'now lives at its own address.', 'Connect a domain you own.', `${f.base}/settings`),
  ]
}
