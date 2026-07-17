import { redirect } from 'next/navigation'

// The site entry is the product: forward to the authenticated projects area,
// which sends signed-out visitors to the login screen. The marketing site
// remains available at /rankforge.
export default function HomePage() {
  redirect('/projects')
}
