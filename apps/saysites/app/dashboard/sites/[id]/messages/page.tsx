import { redirect } from 'next/navigation'

// Messages became Leads (a pipeline with automations and CRM sync).
export default async function MessagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/dashboard/sites/${id}/leads`)
}
