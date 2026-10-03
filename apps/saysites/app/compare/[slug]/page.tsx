import { permanentRedirect } from 'next/navigation'

// The old "SaySites vs ..." price comparisons. The public site no longer shows
// prices or names other companies; why to switch lives on /about.
export default function Compare() {
  permanentRedirect('/about')
}
