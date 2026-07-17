import { redirect } from 'next/navigation'

// The RankForge app entry is the persistent, authenticated projects flow.
// Business data (projects, scans, recommendations, WordPress connections and
// deployments) lives server-side — never in localStorage. /app forwards into
// the projects list, which opens each project's Command Center dashboard.
export default function AppIndex() {
  redirect('/projects')
}
