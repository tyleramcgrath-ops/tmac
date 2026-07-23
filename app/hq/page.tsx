import { Suspense } from 'react'
import { HeadquartersScene } from '@/components/hq/HeadquartersScene'

// The headquarters is the application (Bible §02). This route is the new
// scene module required by §14 — the old room under /north-star is reference
// only and is never patched or reused.
export default function HqPage() {
  return (
    <Suspense fallback={null}>
      <HeadquartersScene />
    </Suspense>
  )
}
