// The soft relay "thunk" of sensor lights switching on, one per bank of
// lights, timed to the CSS sequence in immersive.css. Synthesised, so there's
// no audio file to load. Must be called from a click (browsers block audio
// before a user gesture).
const TIMES = [0.85, 1.35, 1.55, 1.95, 2.55, 3.35];

export default function lightClicks() {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;

  for (const [i, t] of TIMES.entries()) {
    const at = ctx.currentTime + t;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 1600 + i * 180;
    band.Q.value = 1.4;
    const click = ctx.createGain();
    click.gain.value = 0.16;
    src.connect(band).connect(click).connect(ctx.destination);
    src.start(at);

    const thump = ctx.createOscillator();
    thump.frequency.setValueAtTime(110, at);
    thump.frequency.exponentialRampToValueAtTime(48, at + 0.12);
    const body = ctx.createGain();
    body.gain.setValueAtTime(0.0001, at);
    body.gain.exponentialRampToValueAtTime(0.12, at + 0.005);
    body.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
    thump.connect(body).connect(ctx.destination);
    thump.start(at);
    thump.stop(at + 0.2);
  }
  setTimeout(() => ctx.close(), (TIMES.at(-1)! + 1) * 1000);
}
