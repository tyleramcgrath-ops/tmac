import type { Metadata } from 'next'
import { TopBar } from '@/components/TopBar'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'

export const metadata: Metadata = { title: 'Dashboard', robots: { index: false } }

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireUser()
  return (
    <>
      <TopBar />
      <main className="dash">
        <div className="wrap">
          {!getStore().persistent && (
            <p className="notice">
              <strong>Test mode:</strong> no database is connected yet, so accounts and sites may disappear when the server restarts.
            </p>
          )}
          {children}
        </div>
      </main>
    </>
  )
}
