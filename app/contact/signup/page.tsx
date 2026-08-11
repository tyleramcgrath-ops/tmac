import type { Metadata } from 'next'
import { AuthScreen } from '../_components/auth'

export const metadata: Metadata = {
  title: 'Create account — Contact Studios',
  description: 'Start with a free LLM visibility scan.',
}

export default function SignUpPage() {
  return <AuthScreen mode="signup" />
}
