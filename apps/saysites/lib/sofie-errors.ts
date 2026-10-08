// What went wrong when Sofie couldn't finish, in words an owner can act on.
// Owners see the plain sentence; the SaySites team (admins) also sees
// Anthropic's own reason, so a setup problem (a bad key, no credit) is
// obvious without reading server logs.

export interface SofieFailure {
  owner: string
  team: string
}

export function describeSofieError(e: unknown): SofieFailure {
  const raw = (e instanceof Error ? e.message : String(e)).replace(/\s+/g, ' ').slice(0, 300)
  // Anthropic's SDK errors carry the HTTP status.
  const s = typeof (e as { status?: unknown })?.status === 'number' ? (e as { status: number }).status : undefined
  if (s !== undefined) {
    if (s === 401 || s === 403)
      return { owner: 'Sofie can’t connect right now. We’re on it; please try again later.', team: `The Anthropic API key was refused (${s}). In SiteGround, check ANTHROPIC_API_KEY is pasted exactly (starts with sk-ant-, no spaces or quotes), then restart the app.` }
    if (s === 400 && /scoped to a workspace|anthropic-workspace-id/i.test(raw))
      return { owner: 'Sofie can’t connect right now. We’re on it; please try again later.', team: 'The Anthropic API key isn’t tied to a workspace. In the Claude Console, API keys → Create key, pick the Default workspace, then paste the new key into ANTHROPIC_API_KEY in SiteGround and restart the app.' }
    if (s === 400 && /credit balance|billing|purchase credits/i.test(raw))
      return { owner: 'Sofie can’t connect right now. We’re on it; please try again later.', team: 'The Anthropic account is out of credit. Add credit at console.anthropic.com → Settings → Billing.' }
    if (s === 429)
      return { owner: 'Sofie is busy right now. Please try again in a minute.', team: `Anthropic rate limit (429). New API accounts start with low limits that rise as you use and add credit (console.anthropic.com → Settings → Limits). ${raw}` }
    if (s >= 500)
      return { owner: 'Sofie’s AI is overloaded right now. Please try again in a minute.', team: `Anthropic server error (${s}). ${raw}` }
    if (s === 400 || s === 404 || s === 413)
      return { owner: 'Sofie couldn’t finish that one. Try asking for a smaller change.', team: `Anthropic rejected the request (${s}): ${raw}` }
  }
  if (/timed? ?out|ETIMEDOUT|ECONNRESET|fetch failed|network/i.test(raw))
    return { owner: 'Sofie couldn’t reach her AI just now. Please try again in a moment.', team: `Network problem reaching Anthropic: ${raw}` }
  return { owner: 'Sofie couldn’t finish that just now. Please try again in a moment.', team: raw }
}

// The message saved for the studio: the team also sees the reason.
export function sofieErrorText(e: unknown, isTeam: boolean): string {
  const f = describeSofieError(e)
  return isTeam ? `${f.owner} For the team: ${f.team}` : f.owner
}
