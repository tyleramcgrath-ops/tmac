// Mailer provider selection: Resend (direct, no relay) takes precedence over
// the generic MAIL_WEBHOOK_URL relay; neither configured falls back to the
// honest logged-only no-op. Never claims delivery it didn't attempt.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sendEmail } from '../lib/foundation/mailer'

const ORIGINAL_ENV = { ...process.env }

describe('sendEmail provider selection', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
    delete process.env.RESEND_API_KEY
    delete process.env.RESEND_FROM_EMAIL
    delete process.env.MAIL_WEBHOOK_URL
  })
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
    vi.unstubAllGlobals()
  })

  it('sends via Resend when RESEND_API_KEY is set, with the right auth + payload', async () => {
    process.env.RESEND_API_KEY = 're_test_key'
    process.env.RESEND_FROM_EMAIL = 'RankForge <noreply@example.com>'
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toBe('https://api.resend.com/emails')
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer re_test_key')
      const body = JSON.parse(init.body as string)
      expect(body).toMatchObject({ from: 'RankForge <noreply@example.com>', to: 'user@x.com', subject: 'Hi' })
      return new Response('{}', { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await sendEmail({ to: 'user@x.com', subject: 'Hi', html: '<p>hi</p>', text: 'hi' })
    expect(result.delivered).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('prefers Resend over MAIL_WEBHOOK_URL when both are configured', async () => {
    process.env.RESEND_API_KEY = 're_test_key'
    process.env.MAIL_WEBHOOK_URL = 'https://relay.example.com/hook'
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toBe('https://api.resend.com/emails')
      return new Response('{}', { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    await sendEmail({ to: 'user@x.com', subject: 'Hi', html: '<p>hi</p>', text: 'hi' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('honestly reports failure (never claims delivery) when Resend rejects the request', async () => {
    process.env.RESEND_API_KEY = 're_test_key'
    vi.stubGlobal('fetch', vi.fn(async () => new Response('bad key', { status: 401 })))

    const result = await sendEmail({ to: 'user@x.com', subject: 'Hi', html: '<p>hi</p>', text: 'hi' })
    expect(result.delivered).toBe(false)
  })

  it('falls back to MAIL_WEBHOOK_URL when Resend is not configured', async () => {
    process.env.MAIL_WEBHOOK_URL = 'https://relay.example.com/hook'
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toBe('https://relay.example.com/hook')
      return new Response('{}', { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await sendEmail({ to: 'user@x.com', subject: 'Hi', html: '<p>hi</p>', text: 'hi' })
    expect(result.delivered).toBe(true)
    expect(result.via).toBe('webhook')
  })

  it('is honestly logged-only when neither is configured', async () => {
    const result = await sendEmail({ to: 'user@x.com', subject: 'Hi', html: '<p>hi</p>', text: 'hi' })
    expect(result.delivered).toBe(false)
    expect(result.via).toBe('logged-only')
  })
})
