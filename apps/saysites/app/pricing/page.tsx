import { permanentRedirect } from 'next/navigation'

// People type saysites.com/pricing; the plans live on the homepage.
export default function Pricing() {
  permanentRedirect('/#pricing')
}
