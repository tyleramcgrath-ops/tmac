'use client'

import dynamic from 'next/dynamic'

// The headquarters is a WebGL scene and cannot server-render — load it
// client-only with a cinematic loading veil. This route is the new scene
// module required by the Blueprint; the rejected SVG build is discarded.
const Headquarters = dynamic(() => import('@/components/hq/Headquarters').then((m) => m.Headquarters), {
  ssr: false,
  loading: () => (
    <div className="hq-root hq-loading">
      <div>
        <div className="hq-loading-mark">North Star</div>
        <div className="hq-loading-sub">Entering the headquarters</div>
        <div className="hq-loading-bar" />
      </div>
    </div>
  ),
})

export default function HqPage() {
  return <Headquarters />
}
