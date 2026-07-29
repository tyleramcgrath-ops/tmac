// Shared recipient resolution for scheduler email alerts (regressions, the
// weekly digest). Real org membership only — never an invented address.

import type { FoundationStore } from '../store'

export async function resolveOwners(
  store: Pick<FoundationStore, 'listMembers' | 'getUserById'>,
  orgId: string
): Promise<{ userId: string; email: string }[]> {
  const members = await store.listMembers(orgId)
  const owners = members.filter((m) => m.role === 'owner')
  const result: { userId: string; email: string }[] = []
  for (const m of owners) {
    const u = await store.getUserById(m.userId)
    if (u) result.push({ userId: m.userId, email: u.email })
  }
  return result
}

export async function resolveOwnerEmails(
  store: Pick<FoundationStore, 'listMembers' | 'getUserById'>,
  orgId: string
): Promise<string[]> {
  return (await resolveOwners(store, orgId)).map((o) => o.email)
}

// Quotes are escaped too: the digest interpolates escaped values inside
// `<a href="...">`, and a surviving double quote closes the attribute and
// turns the rest of the value into markup. Ampersand must come first so an
// escape sequence is not re-formed out of the ones that follow.
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
