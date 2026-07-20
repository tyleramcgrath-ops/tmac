// Shared recipient resolution for scheduler email alerts (regressions, the
// weekly digest). Real org membership only — never an invented address.

import type { FoundationStore } from '../store'

export async function resolveOwnerEmails(
  store: Pick<FoundationStore, 'listMembers' | 'getUserById'>,
  orgId: string
): Promise<string[]> {
  const members = await store.listMembers(orgId)
  const owners = members.filter((m) => m.role === 'owner')
  const emails: string[] = []
  for (const m of owners) {
    const u = await store.getUserById(m.userId)
    if (u) emails.push(u.email)
  }
  return emails
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
