import crypto from 'crypto'

// Simple password hashing using PBKDF2 (built-in Node crypto)
// For production, use bcryptjs: npm install bcryptjs
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':')
  const hashOfAttempt = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return hash === hashOfAttempt
}

export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

export function getTokenExpiry(hours: number = 24): Date {
  const now = new Date()
  now.setHours(now.getHours() + hours)
  return now
}

export function generateSessionToken(): string {
  return generateToken(32)
}

export function generateResetToken(): string {
  return generateToken(16)
}

export function generateVerifyToken(): string {
  return generateToken(16)
}
