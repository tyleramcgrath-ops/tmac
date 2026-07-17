import { redirect } from 'next/navigation'

// The RankForge app entry is the persistent, authenticated projects flow.
// Business data (projects, scans, recommendations, WordPress connections and
// deployments) lives server-side — never in localStorage.
export default function AppIndex() {
  redirect('/app/projects')
}
