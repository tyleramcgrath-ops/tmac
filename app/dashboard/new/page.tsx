import { NewSiteForm } from '@/components/Forms'
import { BUSINESS_TYPES, PALETTES } from '@/lib/starter'

export default async function NewSite({ searchParams }: { searchParams: Promise<{ idea?: string; template?: string }> }) {
  const sp = await searchParams
  const idea = (sp.idea ?? '').trim().slice(0, 200)
  const template = (sp.template ?? '').trim().slice(0, 20)
  const types = Object.entries(BUSINESS_TYPES).map(([k, v]) => [k, v.label] as [string, string])
  const palettes = Object.entries(PALETTES).map(([k, v]) => [k, v.label, v.colors.primary] as [string, string, string])
  return (
    <div>
      <div className="dash-head"><h1>Tell us about your business</h1></div>
      {idea && <p className="notice good" style={{ marginTop: -8 }}>You said: <strong>“{idea}”</strong>. A few details and it’s built.</p>}
      <p className="muted" style={{ marginTop: -12, marginBottom: 24 }}>Fill in a few details and watch your website build itself on the right. What you see is what you get, and you can change anything afterwards.</p>
      <NewSiteForm types={types} palettes={palettes} idea={idea} template={template} />
    </div>
  )
}
