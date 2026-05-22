import Link from 'next/link'
import { Gavel } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <Gavel className="h-4 w-4" />
            </span>
            Bidly
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Real-estate auctions, online. Find a home, place a bid, take the keys.
            A demo marketplace — no real transactions occur.
          </p>
        </div>
        <FooterCol title="Buy">
          <FooterLink href="/">Browse auctions</FooterLink>
          <FooterLink href="/watchlist">Watchlist</FooterLink>
          <FooterLink href="/bids">My bids</FooterLink>
          <FooterLink href="/how-it-works">How bidding works</FooterLink>
        </FooterCol>
        <FooterCol title="Sell">
          <FooterLink href="/sell">List a property</FooterLink>
          <FooterLink href="/how-it-works#sellers">Seller guide</FooterLink>
          <FooterLink href="/how-it-works#fees">Fees</FooterLink>
        </FooterCol>
        <FooterCol title="Company">
          <FooterLink href="/how-it-works">About</FooterLink>
          <FooterLink href="/how-it-works#trust">Trust &amp; safety</FooterLink>
          <FooterLink href="/how-it-works#contact">Contact</FooterLink>
        </FooterCol>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Bidly Marketplace, Inc. — Demo project. Not a real-estate broker.</p>
          <p>Listings are fictional. Bids are stored in your browser only.</p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="text-sm">
      <h4 className="mb-3 font-semibold">{title}</h4>
      <ul className="space-y-2">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-muted-foreground hover:text-foreground">
        {children}
      </Link>
    </li>
  )
}
