import { notFound } from 'next/navigation'
import { SofieStudio } from '@/components/SofieStudio'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { getStudioState } from './actions'

// Sofie works in the background after a message is sent, within this
// function's time limit.
export const maxDuration = 300

export default async function SofiePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ talk?: string }> }) {
  const [{ id }, { talk }] = await Promise.all([params, searchParams])
  const user = await requireUser()
  const site = await getStore().siteForUser(user.id, id)
  if (!site) notFound()
  const initial = await getStudioState(site.id)

  return (
    <SofieStudio
      siteId={site.id}
      siteName={site.business.name}
      initial={initial}
      ready={Boolean(process.env.ANTHROPIC_API_KEY)}
      autostart={initial.chat.length === 0 ? (talk ?? '').slice(0, 2000) : ''}
    />
  )
}
