'use client'

// Team management: invite people into an org, see pending invitations, and
// change/remove existing members' roles. Every action is server-verified
// (role checks live in the API, not just hidden here) — this UI just makes
// the existing membership model actionable.

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../lib/auth-context'
import { api, ApiError, type InvitationDTO, type MemberDTO, type Org, type Role } from '../lib/client'
import { AppHeader, Field, inputClass, RequireAuth, Spinner } from '../lib/ui'
import { PilotBar } from '../lib/PilotBar'

const ROLE_LABEL: Record<Role, string> = { owner: 'Owner', admin: 'Admin', member: 'Member' }

export default function TeamPage() {
  return (
    <RequireAuth>
      <AppHeader />
      <PilotBar />
      <main className="mx-auto max-w-3xl px-5 pb-8 pt-2">
        <TeamInner />
      </main>
    </RequireAuth>
  )
}

function TeamInner() {
  const { user, orgs } = useAuth()
  const [orgId, setOrgId] = useState<string>('')
  useEffect(() => {
    if (!orgId && orgs.length > 0) setOrgId(orgs[0].id)
  }, [orgs, orgId])

  if (orgs.length === 0) return <Spinner label="Loading your organizations…" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Team</h1>
        <p className="text-sm text-[var(--rf-muted)]">Invite teammates into an organization and manage their access.</p>
      </div>
      {orgs.length > 1 && (
        <Field label="Organization">
          <select className={inputClass} value={orgId} onChange={(e) => setOrgId(e.target.value)}>
            {orgs.map((o: Org) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      {orgId && user && <OrgTeam orgId={orgId} selfUserId={user.id} />}
    </div>
  )
}

function OrgTeam({ orgId, selfUserId }: { orgId: string; selfUserId: string }) {
  const [members, setMembers] = useState<MemberDTO[] | null>(null)
  const [invitations, setInvitations] = useState<InvitationDTO[]>([])
  const [error, setError] = useState('')
  const [inviting, setInviting] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.listMembers(orgId)
      setMembers(res.members)
      setInvitations(res.invitations)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the team.')
      setMembers([])
    }
  }, [orgId])
  useEffect(() => {
    setMembers(null)
    void load()
  }, [load])

  const self = members?.find((m) => m.userId === selfUserId)
  const canManage = self?.role === 'owner' || self?.role === 'admin'

  if (members === null) return <Spinner label="Loading team…" />

  return (
    <div className="space-y-4">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      {canManage && (
        <div className="rf-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Invite a teammate</h2>
            <button onClick={() => setInviting(true)} className="rf-btn-primary rounded-lg px-3 py-1.5 text-xs font-semibold">
              Invite
            </button>
          </div>
          {inviting && (
            <InviteForm
              orgId={orgId}
              onClose={() => setInviting(false)}
              onInvited={(inv) => {
                setInviting(false)
                setInvitations((prev) => [inv, ...prev])
              }}
            />
          )}
        </div>
      )}

      <div className="rf-card divide-y divide-[var(--rf-card-line)]">
        <h2 className="px-4 pt-4 pb-2 text-sm font-semibold text-white">Members ({members.length})</h2>
        {members.map((m) => (
          <MemberRow
            key={m.userId}
            orgId={orgId}
            member={m}
            canManage={canManage}
            isSelf={m.userId === selfUserId}
            onChanged={load}
          />
        ))}
      </div>

      {invitations.length > 0 && (
        <div className="rf-card divide-y divide-[var(--rf-card-line)]">
          <h2 className="px-4 pt-4 pb-2 text-sm font-semibold text-white">Pending invitations ({invitations.length})</h2>
          {invitations.map((inv) => (
            <InvitationRow key={inv.id} orgId={orgId} invitation={inv} canManage={canManage} onRevoked={() => setInvitations((prev) => prev.filter((i) => i.id !== inv.id))} />
          ))}
        </div>
      )}

      {!canManage && members.length > 0 && (
        <p className="text-xs text-[var(--rf-faint)]">Only owners and admins can invite or manage members.</p>
      )}
    </div>
  )
}

function MemberRow({
  orgId,
  member,
  canManage,
  isSelf,
  onChanged,
}: {
  orgId: string
  member: MemberDTO
  canManage: boolean
  isSelf: boolean
  onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function changeRole(role: Role) {
    setBusy(true)
    setError('')
    try {
      await api.updateMemberRole(orgId, member.userId, role)
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change role.')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!confirm(`Remove ${member.email} from this organization?`)) return
    setBusy(true)
    setError('')
    try {
      await api.removeMember(orgId, member.userId)
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove member.')
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm text-white">{member.name || member.email}</p>
        <p className="truncate text-xs text-[var(--rf-muted)]">{member.email}</p>
        {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {canManage && !isSelf ? (
          <select
            disabled={busy}
            value={member.role}
            onChange={(e) => void changeRole(e.target.value as Role)}
            className="rf-mono rounded-md border border-[var(--rf-card-line)] bg-transparent px-2 py-1 text-xs text-white disabled:opacity-60"
          >
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>
        ) : (
          <span className="rf-mono rounded-md border border-[var(--rf-card-line)] px-2 py-1 text-xs text-[var(--rf-muted)]">
            {ROLE_LABEL[member.role]}
            {isSelf ? ' (you)' : ''}
          </span>
        )}
        {canManage && !isSelf && (
          <button onClick={() => void remove()} disabled={busy} className="rf-btn-ghost rounded-md px-2 py-1 text-xs text-red-300 disabled:opacity-60">
            Remove
          </button>
        )}
      </div>
    </div>
  )
}

function InvitationRow({
  orgId,
  invitation,
  canManage,
  onRevoked,
}: {
  orgId: string
  invitation: InvitationDTO
  canManage: boolean
  onRevoked: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function revoke() {
    setBusy(true)
    setError('')
    try {
      await api.revokeInvitation(orgId, invitation.id)
      onRevoked()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not revoke invitation.')
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm text-white">{invitation.email}</p>
        <p className="text-xs text-[var(--rf-muted)]">
          Invited as {ROLE_LABEL[invitation.role]} · expires {new Date(invitation.expiresAt).toLocaleDateString()}
        </p>
        {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
      </div>
      {canManage && (
        <button onClick={() => void revoke()} disabled={busy} className="rf-btn-ghost shrink-0 rounded-md px-2 py-1 text-xs disabled:opacity-60">
          Revoke
        </button>
      )}
    </div>
  )
}

function InviteForm({ orgId, onClose, onInvited }: { orgId: string; onClose: () => void; onInvited: (inv: InvitationDTO) => void }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const { invitation, emailDelivery } = await api.inviteMember(orgId, email, role)
      onInvited(invitation)
      if (emailDelivery === 'logged-only') {
        setNotice('Invitation created. Email delivery is not configured in this environment — check server logs for the link, or share it manually.')
      } else {
        setEmail('')
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send invitation.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 border-t border-[var(--rf-card-line)] pt-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <Field label="Email">
            <input type="email" required autoFocus className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" />
          </Field>
        </div>
        <div className="w-32">
          <Field label="Role">
            <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'member')}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
        </div>
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
      {notice && <p className="text-xs text-[var(--rf-blue-bright)]">{notice}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rf-btn-primary rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-60">
          {saving ? 'Sending…' : 'Send invitation'}
        </button>
        <button type="button" onClick={onClose} className="rf-btn-ghost rounded-lg px-4 py-2 text-xs font-medium">
          Close
        </button>
      </div>
    </form>
  )
}
