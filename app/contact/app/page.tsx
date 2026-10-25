import type { Metadata } from 'next'
import { Workspace } from '../_components/workspace'

export const metadata: Metadata = {
  title: 'LLM visibility scan — Contact Studios',
  description: 'See how your brand ranks inside AI answers.',
}

export default function WorkspacePage() {
  return <Workspace />
}
