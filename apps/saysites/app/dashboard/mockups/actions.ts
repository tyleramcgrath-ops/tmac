'use server'

import { revalidatePath } from 'next/cache'
import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'

export async function markMockupSent(id: string) {
  const user = await requireUser()
  if (!isAdmin(user.email)) notFound()
  const store = getStore()
  const m = (await store.mockups(1000)).find((x) => x.id === id)
  if (m) await store.saveMockup({ ...m, status: 'sent', sentAt: new Date().toISOString() })
  revalidatePath('/dashboard/mockups')
}
