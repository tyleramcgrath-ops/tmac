import { permanentRedirect } from 'next/navigation'

// The old trades homepage; SaySites now has one home page for every industry.
export default function Trades() {
  permanentRedirect('/')
}
