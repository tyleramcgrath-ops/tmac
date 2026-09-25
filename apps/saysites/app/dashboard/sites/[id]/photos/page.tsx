import { notFound } from 'next/navigation'
import { LogoIdeas } from '@/components/LogoIdeas'
import { PhotoUpload } from '@/components/PhotoUpload'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { addGalleryToHome, chooseLogoIdea, getLogoIdeas, removePhoto, requestLogoIdeas, setLogo, uploadPhoto } from '../manage-actions'

// Sofie's logo sketches run in the background of these actions.
export const maxDuration = 300

export default async function PhotosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  // Logos Sofie drew are kept with the files but aren't photos.
  const [all, logoIdeas] = await Promise.all([store.mediaForSite(site.id), getLogoIdeas(site.id)])
  const photos = all.filter((m) => m.mime !== 'image/svg+xml')
  const logo = site.business.logo

  return (
    <section className="stack">
      <div className="sec-head">
        <div>
          <h2>Photos</h2>
          <p className="muted">Your own photos look better than any stock photo. Upload them here, then ask Sofie to use them, or pick them for products and blog posts.</p>
          <p className="muted small">Until then, your site uses free professional photos from Unsplash photographers, picked so no other SaySites site has the same ones. The deal is a small “Photos by” credit in your footer: they get the credit, you get great photos for free. Swap in your own and the credit goes away.</p>
        </div>
      </div>
      <div className="card">
        <div className="card-head">
          <h3>Your logo</h3>
          {logo && <span className="current-logo"><img src={logo} alt="Current logo" /></span>}
        </div>
        <p className="muted small" style={{ marginTop: 0 }}>No logo yet, or want a fresh one? Sofie sketches three different directions in your colours. Pick the one you like and it goes straight into your header and browser tab. Have your own? Upload it below.</p>
        <LogoIdeas
          siteId={site.id}
          siteName={site.business.name}
          current={{ logo, icon: site.business.icon }}
          initial={logoIdeas}
          request={requestLogoIdeas.bind(null, site.id)}
          poll={getLogoIdeas.bind(null, site.id)}
          choose={chooseLogoIdea.bind(null, site.id)}
        />
      </div>
      <div className="card">
        <h3>Upload a photo or your logo</h3>
        <PhotoUpload action={uploadPhoto.bind(null, site.id)} logo />
      </div>
      {photos.length > 0 && (
        <div className="notice good gallery-cta">
          <span><strong>Show them off.</strong> Add your latest {Math.min(photos.length, 9)} photo{photos.length > 1 ? 's' : ''} to your home page as an “Our work” gallery.</span>
          <form action={addGalleryToHome.bind(null, site.id)}><button className="btn btn-primary btn-sm" type="submit">Add to my home page</button></form>
        </div>
      )}
      {photos.length === 0 ? (
        <p className="muted">No photos yet.</p>
      ) : (
        <div className="photo-grid">
          {photos.map((m) => {
            const src = `/u/${m.id}`
            const isLogo = logo === src
            return (
              <figure key={m.id} className="card photo">
                <img src={src} alt={m.alt} loading="lazy" width={m.width} height={m.height} />
                <figcaption>
                  <span className="small">{m.alt}</span>
                  <span className="muted small">{m.width}×{m.height} · {Math.round(m.bytes / 1024)} KB{isLogo ? ' · Logo' : ''}</span>
                  <span className="photo-actions">
                    <form action={setLogo.bind(null, site.id, isLogo ? null : m.id)}><button className="btn btn-ghost btn-sm" type="submit">{isLogo ? 'Stop using as logo' : 'Use as logo'}</button></form>
                    <form action={removePhoto.bind(null, site.id, m.id)}><button className="btn btn-ghost btn-sm danger" type="submit">Delete</button></form>
                  </span>
                </figcaption>
              </figure>
            )
          })}
        </div>
      )}
    </section>
  )
}
