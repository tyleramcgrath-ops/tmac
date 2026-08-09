import { handled, HttpError, requireUser } from '@/lib/foundation/auth'

export const runtime = 'nodejs'

// Neural speech for the Compass. The browser's own speechSynthesis is capped
// at whatever voices the OS ships — on a stock Windows install that is a
// legacy formant voice that sounds like a 1998 screen reader, and the good
// neural ones need admin rights to install. Edge's voices are neural, free,
// and need no API key, but they are only reachable over a WebSocket, so they
// need a server route rather than a browser call.
//
// UNOFFICIAL ENDPOINT. This is the same service Edge's built-in Read Aloud
// uses, not a supported API. It has been observed returning 403 to datacenter
// IPs, which means it may work in local development and fail once deployed.
// The caller must treat failure as normal and fall back to speechSynthesis —
// see use-voice.tsx. If the Compass ever needs guaranteed speech in
// production, swap this one route for ElevenLabs or OpenAI TTS; the client
// contract does not change.

const DEFAULT_VOICE = 'en-US-GuyNeural'

// Allowlist rather than passthrough: the voice name is interpolated into the
// SSML the library builds, so accepting arbitrary client strings would hand
// the browser a markup-injection surface for no benefit.
const VOICES = new Set([
  'en-US-GuyNeural',
  'en-US-AriaNeural',
  'en-US-ChristopherNeural',
  'en-US-EricNeural',
  'en-US-JennyNeural',
  'en-US-MichelleNeural',
  'en-GB-RyanNeural',
  'en-GB-SoniaNeural',
  'en-GB-ThomasNeural',
  'en-AU-WilliamNeural',
])

const MAX_CHARS = 4000

export const POST = handled(async (request) => {
  await requireUser(request)

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const text = String(body.text ?? '').trim().slice(0, MAX_CHARS)
  if (!text) throw new HttpError(400, 'Nothing to speak.')

  const requested = String(body.voice ?? '')
  const voice = VOICES.has(requested) ? requested : DEFAULT_VOICE

  // Imported lazily so a missing or broken optional dependency degrades to
  // "speech unavailable, use the browser" instead of taking down the route
  // module — and with it every other import in this file — at build time.
  let MsEdgeTTS: typeof import('msedge-tts').MsEdgeTTS
  let OUTPUT_FORMAT: typeof import('msedge-tts').OUTPUT_FORMAT
  try {
    const mod = await import('msedge-tts')
    MsEdgeTTS = mod.MsEdgeTTS
    OUTPUT_FORMAT = mod.OUTPUT_FORMAT
  } catch {
    throw new HttpError(503, 'Neural speech is unavailable (msedge-tts is not installed).')
  }

  const tts = new MsEdgeTTS()
  try {
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3)
    const { audioStream } = tts.toStream(text)

    const chunks: Buffer[] = []
    await new Promise<void>((resolve, reject) => {
      audioStream.on('data', (c: Buffer) => chunks.push(c))
      audioStream.on('end', resolve)
      audioStream.on('error', reject)
    })

    const audio = Buffer.concat(chunks)
    if (audio.length === 0) throw new Error('empty audio')

    return new Response(new Uint8Array(audio), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audio.length),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    // 502 rather than 500: the failure is upstream, and the client's job is to
    // fall back quietly rather than surface an error to the user.
    const detail = err instanceof Error ? err.message : 'unknown'
    throw new HttpError(502, `Neural speech failed (${detail.slice(0, 120)}).`)
  } finally {
    try {
      tts.close()
    } catch {}
  }
})
