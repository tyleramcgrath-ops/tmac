import { NewSiteForm } from '@/components/Forms'
import { BUSINESS_TYPES, PALETTES } from '@/lib/starter'

export default async function NewSite({ searchParams }: { searchParams: Promise<{ idea?: string }> }) {
  const idea = ((await searchParams).idea ?? '').trim().slice(0, 200)
  const types = Object.entries(BUSINESS_TYPES).map(([k, v]) => [k, v.label] as [string, string])
  const palettes = Object.entries(PALETTES).map(([k, v]) => [k, v.label, v.colors.primary] as [string, string, string])
  return (
    <div style={{ maxWidth: 640 }}>
      <div className="dash-head"><h1>Tell us about your business</h1></div>
      {idea && <p className="notice good" style={{ marginTop: -8 }}>You said: <strong>“{idea}”</strong>. A few details and it’s built.</p>}
      <p className="muted" style={{ marginTop: -12, marginBottom: 24 }}>We’ll build your Home, Services and Contact pages from this. You can change anything afterwards.</p>
      <div className="card">
        <NewSiteForm types={types} palettes={palettes} idea={idea} />
      </div>
    </div>
  )
}
