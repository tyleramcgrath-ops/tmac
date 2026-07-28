// Platform-aware BotID wrapper. Vercel BotID throws off-platform in
// production (no x-vercel-oidc-token / VERCEL_OIDC_TOKEN), which would turn
// /api/chat and /api/errors into unhandled 500s on a self-hosted container.
// Off Vercel the wrapper must degrade open and SAY it did not screen; on
// Vercel it must pass the real verdict through untouched.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = { ...process.env }

const checkBotIdMock = vi.hoisted(() => vi.fn())
vi.mock('botid/server', () => ({ checkBotId: checkBotIdMock }))

async function freshCheckBot() {
  // The "already warned" latch is module state; re-import per test.
  vi.resetModules()
  return (await import('../lib/bot-protection')).checkBot
}

describe('checkBot', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
    delete process.env.VERCEL
    delete process.env.VERCEL_OIDC_TOKEN
    checkBotIdMock.mockReset()
  })
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
    vi.restoreAllMocks()
  })

  it('degrades open without calling BotID when not on Vercel', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const checkBot = await freshCheckBot()

    expect(await checkBot()).toEqual({ isBot: false, unavailable: true })
    // The real check must not even be attempted — that is what throws.
    expect(checkBotIdMock).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0][0]).toContain('DISABLED')
  })

  it('warns once, not on every request', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const checkBot = await freshCheckBot()

    await checkBot()
    await checkBot()
    await checkBot()

    expect(warn).toHaveBeenCalledOnce()
  })

  it('passes a real bot verdict through on Vercel', async () => {
    process.env.VERCEL = '1'
    checkBotIdMock.mockResolvedValue({ isBot: true, isHuman: false })
    const checkBot = await freshCheckBot()

    expect(await checkBot()).toEqual({ isBot: true, unavailable: false })
    expect(checkBotIdMock).toHaveBeenCalledOnce()
  })

  it('passes a real human verdict through on Vercel', async () => {
    process.env.VERCEL = '1'
    checkBotIdMock.mockResolvedValue({ isBot: false, isHuman: true })
    const checkBot = await freshCheckBot()

    expect(await checkBot()).toEqual({ isBot: false, unavailable: false })
  })

  it('runs the real check when only VERCEL_OIDC_TOKEN is present', async () => {
    process.env.VERCEL_OIDC_TOKEN = 'token'
    checkBotIdMock.mockResolvedValue({ isBot: true, isHuman: false })
    const checkBot = await freshCheckBot()

    expect(await checkBot()).toEqual({ isBot: true, unavailable: false })
    expect(checkBotIdMock).toHaveBeenCalledOnce()
  })

  it('fails open, not 500, when BotID throws on a misconfigured Vercel project', async () => {
    process.env.VERCEL = '1'
    checkBotIdMock.mockRejectedValue(new Error('OIDC disabled'))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const checkBot = await freshCheckBot()

    expect(await checkBot()).toEqual({ isBot: false, unavailable: true })
    expect(error).toHaveBeenCalledOnce()
  })
})
