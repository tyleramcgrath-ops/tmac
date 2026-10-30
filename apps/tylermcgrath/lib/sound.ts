// The studio's sound, synthesised with Web Audio so there are no files to
// load: a warm room tone, the doors, the sensor-light relays, glass ticks as
// cards pass, a chime when one opens and a resonant hit from the Compass.
// Browsers (iOS especially) only allow audio after a tap, so unlock() must be
// called from one; every other call is a no-op until then or while muted.

type Ctx = AudioContext;

let ctx: Ctx | null = null;
let master: GainNode | null = null;
let room: GainNode | null = null;
let enabled = true;
let noise: AudioBuffer | null = null;

function noiseBuffer(c: Ctx) {
  if (noise) return noise;
  noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noise;
}

function env(g: GainNode, at: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
}

function tone(freq: number, at: number, peak: number, decay: number, type: OscillatorType = "sine", attack = 0.004) {
  if (!ctx || !master) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  env(g, at, peak, attack, decay);
  o.connect(g).connect(master);
  o.start(at);
  o.stop(at + attack + decay + 0.05);
  return o;
}

function hiss(at: number, dur: number, peak: number, filter: BiquadFilterType, from: number, to: number, q = 0.8) {
  if (!ctx || !master) return;
  const s = ctx.createBufferSource();
  s.buffer = noiseBuffer(ctx);
  const f = ctx.createBiquadFilter();
  f.type = filter;
  f.Q.value = q;
  f.frequency.setValueAtTime(from, at);
  f.frequency.exponentialRampToValueAtTime(to, at + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + dur * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  s.connect(f).connect(g).connect(master);
  s.start(at, Math.random());
  s.stop(at + dur + 0.05);
}

export function unlock() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    master = ctx.createGain();
    master.gain.value = enabled ? 0.9 : 0;
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
}

export function setSound(on: boolean) {
  enabled = on;
  if (!ctx || !master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(on ? 0.9 : 0, ctx.currentTime, 0.15);
}

const now = () => (ctx ? ctx.currentTime : 0);

/** The doors part: a long, low air movement. */
export function doors() {
  if (!ctx) return;
  const t = now();
  hiss(t, 2.4, 0.22, "lowpass", 220, 1800);
  tone(48, t, 0.18, 2.2, "sine", 0.6);
}

/** One relay per bank of lights, timed to the CSS sequence in immersive.css. */
export function lights() {
  if (!ctx || !master) return;
  const times = [0.85, 1.35, 1.55, 1.95, 2.55, 3.35];
  for (const [i, dt] of times.entries()) {
    const at = now() + dt;
    hiss(at, 0.05, 0.3, "bandpass", 1700 + i * 180, 1500 + i * 180, 1.4);
    const o = tone(110, at, 0.14, 0.15, "sine", 0.004);
    o?.frequency.exponentialRampToValueAtTime(46, at + 0.12);
    // the faint electrical hum of each bank warming up
    tone(120 * (i + 1), at + 0.02, 0.006, 0.6, "triangle", 0.05);
  }
}

/** A warm room tone that fades in once the lights are up and then stays. */
export function ambience(delay = 3) {
  if (!ctx || !master || room) return;
  const t = now() + delay;
  room = ctx.createGain();
  room.gain.setValueAtTime(0.0001, t);
  room.gain.exponentialRampToValueAtTime(1, t + 5);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 520;
  lp.Q.value = 0.6;
  const lfo = ctx.createOscillator();
  const depth = ctx.createGain();
  lfo.frequency.value = 0.05;
  depth.gain.value = 180;
  lfo.connect(depth).connect(lp.frequency);
  lfo.start(t);
  lp.connect(room).connect(master);
  // A low open fifth, slightly detuned so it breathes.
  for (const [f, g] of [[55, 0.05], [55.3, 0.04], [82.4, 0.03], [110.2, 0.014], [164.8, 0.008]] as const) {
    const o = ctx.createOscillator();
    const og = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = f;
    og.gain.value = g;
    o.connect(og).connect(lp);
    o.start(t);
  }
  // Air through the high windows.
  const air = ctx.createBufferSource();
  air.buffer = noiseBuffer(ctx);
  air.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 2400;
  bp.Q.value = 0.5;
  const ag = ctx.createGain();
  ag.gain.value = 0.012;
  air.connect(bp).connect(ag).connect(room);
  air.start(t);
}

/** Glass tick as a card passes the front or the cursor finds one. */
export function tick(pitch = 0) {
  if (!ctx) return;
  const t = now();
  tone(2600 + pitch * 140, t, 0.05, 0.07);
  tone(3900 + pitch * 200, t, 0.025, 0.05);
}

/** A struck-glass chime when a card or panel opens. */
export function chime() {
  if (!ctx) return;
  const t = now();
  for (const [f, g, d] of [[880, 0.09, 1.4], [1320, 0.05, 1.1], [1764, 0.035, 0.9], [2640, 0.02, 0.6]] as const) tone(f, t, g, d);
}

/** The Compass: a low resonant hit with a metallic ring and a shimmer. */
export function compass(step = 0) {
  if (!ctx) return;
  const t = now();
  const root = [196, 220, 247, 262, 294][step % 5];
  const o = tone(90, t, 0.22, 0.9);
  o?.frequency.exponentialRampToValueAtTime(52, t + 0.6);
  for (const [r, g, d] of [[1, 0.07, 2.2], [2.76, 0.035, 1.6], [5.4, 0.02, 1.1], [8.93, 0.01, 0.7]] as const) tone(root * r, t, g, d);
  hiss(t + 0.05, 1.2, 0.03, "highpass", 5000, 9000);
}

/** The Compass wakes: a rising swell into a chord. */
export function awaken() {
  if (!ctx || !master) return;
  const t = now();
  const o = ctx.createOscillator();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(220, t + 1.4);
  f.type = "lowpass";
  f.frequency.setValueAtTime(200, t);
  f.frequency.exponentialRampToValueAtTime(2400, t + 1.4);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.06, t + 1.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
  o.connect(f).connect(g).connect(master);
  o.start(t);
  o.stop(t + 2.3);
  for (const [fr, at] of [[440, 1.2], [554, 1.28], [659, 1.36], [880, 1.44]] as const) tone(fr, t + at, 0.05, 1.8);
}

/** A short haptic tap where the device supports it (Android). */
export function buzz(ms = 8) {
  if (enabled && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(ms);
}

/** The Compass locks onto a card: two quick rising pings and a breath of air. */
export function lock() {
  if (!ctx) return;
  const t = now();
  tone(1320, t, 0.035, 0.08);
  tone(1980, t + 0.06, 0.03, 0.12);
  hiss(t, 0.18, 0.025, "bandpass", 3200, 5200, 2);
}
