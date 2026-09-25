// SaySites' own team: who can read the feedback inbox. Set
// SAYSITES_ADMIN_EMAILS (comma-separated) in the Vercel project.
export function isAdmin(email: string): boolean {
  return (process.env.SAYSITES_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase())
}
