import { notFound } from 'next/navigation'
import { PhotoUpload } from '@/components/PhotoUpload'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { addGalleryToHome, removePhoto, setLogo, uploadPhoto } from '../manage-actions'

export default async function PhotosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const photos = await store.mediaForSite(site.id)
  const logo = site.business.logo

  return (
    <section className="stack">
      <div className="sec-head">
        <div>
          <h2>Photos</h2>
          <p className="muted">Your own photos look better than any stock photo. Upload them here, then ask Sofie to use them, or pick them for products and blog posts.</p>
        </div>
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
