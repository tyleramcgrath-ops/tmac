import { ToggleWelcome } from '@/components/modals/welcome'
import { VercelDashed } from '@/components/icons/vercel-dashed'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Props {
  className?: string
}

export async function Header({ className }: Props) {
  return (
    <header className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center">
        <VercelDashed className="ml-1 md:ml-2.5 mr-1.5" />
        <span className="hidden md:inline text-sm uppercase font-mono font-bold tracking-tight">
          OSS Vibe Coding Platform
        </span>
      </div>
      <div className="flex items-center ml-auto space-x-1.5">
        <Link
          href="/shorts"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 transition-colors"
        >
          <span>⚡</span> Shorts Generator
        </Link>
        <ToggleWelcome />
      </div>
    </header>
  )
}
