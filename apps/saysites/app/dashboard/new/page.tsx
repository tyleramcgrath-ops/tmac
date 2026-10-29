import { StartWizard } from '@/components/StartWizard'
import { BUSINESS_TYPES, PALETTES } from '@/lib/starter'
import { placesReady } from '@/lib/places'

// Starting a website: a step-by-step window (components/StartWizard).
export default async function NewSite({ searchParams }: { searchParams: Promise<{ idea?: string; template?: string }> }) {
  const sp = await searchParams
  const idea = (sp.idea ?? '').trim().slice(0, 200)
  const template = (sp.template ?? '').trim().slice(0, 20)
  const types = Object.entries(BUSINESS_TYPES).map(([k, v]) => [k, v.label] as [string, string])
  const palettes = Object.entries(PALETTES).map(([k, v]) => [k, v.label, v.colors.primary] as [string, string, string])
  return <StartWizard types={types} palettes={palettes} idea={idea} template={template} google={placesReady()} />
}
