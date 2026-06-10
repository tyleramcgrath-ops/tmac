import Link from 'next/link'
import { AnalysisForm } from '@/components/AnalysisForm'
import { ReportList } from '@/components/ReportList'

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <section className="text-center">
        <h1 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          See exactly why competitors outrank you —{' '}
          <span className="text-blue-700">and how to beat them</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500 sm:text-base">
          Enter your page and a target keyword. We pull the live top 10 Google results, crawl every
          competing page, and build a precise gap analysis with a prioritized action plan.
        </p>
      </section>

      <section className="mx-auto max-w-2xl">
        <AnalysisForm />
        <div className="mt-4 grid grid-cols-2 gap-3 text-center text-xs text-slate-400 sm:grid-cols-4">
          <div className="rounded-lg bg-white px-2 py-3 ring-1 ring-slate-100">Live SERP data</div>
          <div className="rounded-lg bg-white px-2 py-3 ring-1 ring-slate-100">Real page crawls</div>
          <div className="rounded-lg bg-white px-2 py-3 ring-1 ring-slate-100">Core Web Vitals</div>
          <div className="rounded-lg bg-white px-2 py-3 ring-1 ring-slate-100">AI action plan</div>
        </div>
      </section>

      <section className="card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="section-title">Recent reports</h2>
            <p className="text-sm text-slate-500">Your latest analyses</p>
          </div>
          <Link href="/reports" className="btn-secondary">View all</Link>
        </div>
        <ReportList limit={5} />
      </section>
    </div>
  )
}
