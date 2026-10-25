import type { Metadata } from 'next'
import { AuthScreen } from '../_components/auth'

export const metadata: Metadata = {
  title: 'Client login — Contact Studios',
  description: 'Sign in to your Contact Studios account.',
}

export default function SignInPage() {
  return <AuthScreen mode="signin" />
}
