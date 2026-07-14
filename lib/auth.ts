// Temporary auth/identification utility
// For Phase 3, this will be replaced with proper auth (OAuth, etc.)

const USER_ID_KEY = 'rf_user_id'

export function getOrCreateUserId(): string {
  try {
    let userId = localStorage.getItem(USER_ID_KEY)
    if (!userId) {
      // Generate a unique ID for anonymous user
      userId = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
      localStorage.setItem(USER_ID_KEY, userId)
    }
    return userId
  } catch {
    // If localStorage is not available, generate a session-only ID
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  }
}
