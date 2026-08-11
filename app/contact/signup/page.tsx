import type { Metadata } from 'next'
import { AuthScreen } from '../_components/auth'

export const metadata: Metadata = {
  title: 'Create account — Contact',
  description: 'Start with the people you already have.',
}

export default function SignUpPage() {
  return <AuthScreen mode="signup" />
}
