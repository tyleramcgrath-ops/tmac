import type { Metadata } from 'next'
import { RankForgeSite } from './components/rankforge-site'

export const metadata: Metadata = {
  title: 'RankForge — The SEO tool that safely does the work on your WordPress site',
  description:
    'RankForge audits your WordPress site, fixes what matters, and deploys the changes for you — then reads every change back to verify it stuck, with one-click rollback. Works with Yoast, Rank Math, and AIOSEO. Never a number we didn’t measure.',
}

export default function RankForgePage() {
  return <RankForgeSite />
}
