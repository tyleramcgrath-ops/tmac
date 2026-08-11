import type { Metadata } from 'next'
import { Workspace } from '../_components/workspace'

export const metadata: Metadata = {
  title: 'Workspace — Contact',
  description: 'Your network, and who to reach out to this week.',
}

export default function WorkspacePage() {
  return <Workspace />
}
