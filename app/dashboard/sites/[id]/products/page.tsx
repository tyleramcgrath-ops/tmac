import { redirect } from 'next/navigation'

// Products moved into the Store tab.
export default async function ProductsMoved({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/dashboard/sites/${id}/store/products`)
}
