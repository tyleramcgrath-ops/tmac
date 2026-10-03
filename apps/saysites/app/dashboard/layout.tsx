import type { Metadata } from 'next'
import { TopBar } from '@/components/TopBar'
import { FeedbackButton } from '@/components/FeedbackButton'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { billingReady, loadAccess } from '@/lib/billing'

export const metadata: Metadata = { title: 'Dashboard', robots: { index: false } }

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const a = await loadAccess(getStore(), user)
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
          {a.locked ? (
            <p className="notice trial-bar">
              <strong>Your free trial has ended.</strong> Your site and everything you’ve made are saved. <a href="/dashboard/account#plan">Start your plan</a> to keep building.
            </p>
          ) : a.status === 'trial' && billingReady() ? (
            <p className="notice good trial-bar">
              <strong>Free trial: {a.daysLeft} day{a.daysLeft === 1 ? '' : 's'} left.</strong> Every change you make now keeps working for you after. <a href="/dashboard/account#plan">Your plan</a>
            </p>
          ) : null}
          {children}
        </div>
      </main>
      <FeedbackButton offer={a.status === 'trial' && !a.billing?.feedbackReward} />
    </>
  )
}
