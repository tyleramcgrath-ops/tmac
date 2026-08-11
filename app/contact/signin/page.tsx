import type { Metadata } from 'next'
import { AuthScreen } from '../_components/auth'

export const metadata: Metadata = {
  title: 'Sign in — Contact',
  description: 'Sign in to your network.',
}

export default function SignInPage() {
  return <AuthScreen mode="signin" />
}
