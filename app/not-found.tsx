import Link from 'next/link'
import { SearchBar } from '@/components/ui'

export default function NotFound() {
  return (
    <section className="hero">
      <div className="wrap rise">
        <div className="eyebrow">404</div>
        <h1>We couldn&apos;t find that page.</h1>
        <p className="lede">It may have moved. Try a search, or start from the <Link href="/" style={{ color: '#fff' }}>home page</Link>.</p>
        <SearchBar />
      </div>
    </section>
  )
}
