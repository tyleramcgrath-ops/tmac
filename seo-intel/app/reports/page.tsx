import { ReportList } from '@/components/ReportList'

export const metadata = { title: 'Report History — SEO Competitor Intelligence' }

export default function ReportsPage() {
  return (
    <div className="card">
      <h1 className="section-title">Report history</h1>
      <p className="section-subtitle">Reopen, re-run or delete past analyses.</p>
      <ReportList />
    </div>
  )
}
