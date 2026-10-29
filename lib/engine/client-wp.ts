// Browser-stored WordPress connection (site URL + username + application
// password), kept in localStorage like the API keys and sent with each
// WordPress request. Never persisted on a server.

export interface WpClientConnection {
  site: string
  username: string
  appPassword: string
}

const STORAGE_KEY = 'seo-intel-wp-connection'

export function readWpConnection(): WpClientConnection | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<WpClientConnection>
    if (parsed.site && parsed.username && parsed.appPassword) {
      return { site: parsed.site, username: parsed.username, appPassword: parsed.appPassword }
    }
    return null
  } catch {
    return null
  }
}

export function saveWpConnection(conn: WpClientConnection): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conn))
  } catch {
    /* storage blocked */
  }
}

export function clearWpConnection(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
