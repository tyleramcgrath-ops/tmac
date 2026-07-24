/* =====================================================================
   THE NORTH STAR COMPASS — a real 3D instrument with a state machine.
   Restrained machined brass when idle; an inner light system awakens
   through the working states. Room time-of-day is driven separately.
   Framework-agnostic: initCompass(canvas) returns an imperative API.
   Ported 1:1 from the reference artifact.
   ===================================================================== */
import * as THREE from 'three'

export type CompassState =
  | 'asleep' | 'awakening' | 'idle' | 'hover' | 'listening' | 'thinking'
  | 'planning' | 'executing' | 'deploying' | 'verifying' | 'success'
  | 'warning' | 'error' | 'offline'
export type TimeMode = 'dawn' | 'day' | 'dusk' | 'night'

export interface CompassApi {
  setState: (s: CompassState) => void
  setTime: (t: TimeMode) => void
  dolly: (mode: 'in' | 'back') => void
  flare: () => void
  hover: (on: boolean) => void
  getState: () => CompassState
  dispose: () => void
}

export function initCompass(canvas: HTMLCanvasElement): CompassApi {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.12

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  camera.position.set(0, 0.16, 12.1)   // starts dollied back; wake glides it in
  camera.lookAt(0, 0, 0)
  let camCur = 12.1, camTarget = 12.1

  function envTexture() {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512
    const g = c.getContext('2d')!
    const grd = g.createLinearGradient(0, 0, 0, 512)
    grd.addColorStop(0.0, '#05070f'); grd.addColorStop(0.42, '#0b1020')
    grd.addColorStop(0.52, '#3a2f1c'); grd.addColorStop(0.57, '#7a5a24')
    grd.addColorStop(0.63, '#22242f'); grd.addColorStop(1.0, '#020306')
    g.fillStyle = grd; g.fillRect(0, 0, 1024, 512)
    const key2 = g.createRadialGradient(512, 150, 20, 512, 150, 320)
    key2.addColorStop(0, 'rgba(255,232,190,0.95)'); key2.addColorStop(1, 'rgba(255,232,190,0)')
    g.fillStyle = key2; g.fillRect(0, 0, 1024, 512)
    const rim2 = g.createRadialGradient(120, 200, 10, 120, 200, 260)
    rim2.addColorStop(0, 'rgba(120,150,210,0.5)'); rim2.addColorStop(1, 'rgba(120,150,210,0)')
    g.fillStyle = rim2; g.fillRect(0, 0, 1024, 512)
    g.fillStyle = 'rgba(255,210,140,0.85)'
    for (let i = 0; i < 90; i++) {
      const x = (Math.abs(Math.sin(i * 12.9898) * 43758.5) % 1) * 1024
      const y = (Math.abs(Math.sin(i * 78.233) * 12543.7) % 1) * 150
      g.fillRect(x, y, 2, 2)
    }
    const t = new THREE.CanvasTexture(c)
    t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace
    return t
  }
  const pmrem = new THREE.PMREMGenerator(renderer)
  pmrem.compileEquirectangularShader()
  scene.environment = pmrem.fromEquirectangular(envTexture()).texture

  const brass = new THREE.MeshStandardMaterial({ color: 0xcaa24e, metalness: 1.0, roughness: 0.2, envMapIntensity: 1.5 })
  const brassEdge = new THREE.MeshStandardMaterial({ color: 0xe7c877, metalness: 1.0, roughness: 0.12, envMapIntensity: 1.7 })
  const brassDark = new THREE.MeshStandardMaterial({ color: 0x7d5f28, metalness: 1.0, roughness: 0.42, envMapIntensity: 1.1 })
  const mech = new THREE.MeshStandardMaterial({ color: 0x120f0a, metalness: 0.85, roughness: 0.5, envMapIntensity: 0.6 })
  const coreMat = new THREE.MeshStandardMaterial({ color: 0x0f0d09, metalness: 0.9, roughness: 0.38, envMapIntensity: 0.7 })

  const channels: THREE.MeshStandardMaterial[] = []
  function channelMat() {
    const m = new THREE.MeshStandardMaterial({ color: 0x241905, emissive: 0xffcf87, emissiveIntensity: 0.0, metalness: 0.5, roughness: 0.35, envMapIntensity: 0.5 })
    channels.push(m); return m
  }

  const compass = new THREE.Group(); scene.add(compass)

  function builtRing(radius: number, tube: number, parent: THREE.Group, opts: { dark?: boolean; channel?: boolean } = {}) {
    const body = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 26, 170), opts.dark ? brassDark : brass); parent.add(body)
    parent.add(new THREE.Mesh(new THREE.TorusGeometry(radius + tube * 0.55, tube * 0.34, 20, 170), brassEdge))
    parent.add(new THREE.Mesh(new THREE.TorusGeometry(radius - tube * 0.55, tube * 0.34, 20, 170), brassEdge))
    if (opts.channel !== false) parent.add(new THREE.Mesh(new THREE.TorusGeometry(radius, tube * 0.42, 14, 170), channelMat()))
    return body
  }

  const gimbal = new THREE.Group(); compass.add(gimbal)
  const horizon = builtRing(1.66, 0.07, gimbal); horizon.rotation.x = Math.PI / 2
  builtRing(1.66, 0.06, gimbal, { dark: true })

  const sphere = new THREE.Group(); compass.add(sphere)
  const equator = builtRing(1.36, 0.052, sphere); equator.rotation.x = Math.PI / 2
  const m1 = builtRing(1.36, 0.05, sphere); m1.rotation.y = 0.0
  const m2 = builtRing(1.36, 0.05, sphere); m2.rotation.y = Math.PI / 3
  const m3 = builtRing(1.2, 0.04, sphere, { dark: true }); m3.rotation.set(0.35, -Math.PI / 3, 0)
  const tropicN = builtRing(1.16, 0.03, sphere, { dark: true, channel: false }); tropicN.rotation.x = Math.PI / 2; tropicN.position.y = 0.5
  const tropicS = builtRing(1.16, 0.03, sphere, { dark: true, channel: false }); tropicS.rotation.x = Math.PI / 2; tropicS.position.y = -0.5

  const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.6, 24), brass); compass.add(axis)
  const capTop = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.22, 24), brassEdge); capTop.position.y = 1.82; compass.add(capTop)
  const capBot = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.22, 24), brassEdge); capBot.position.y = -1.82; capBot.rotation.x = Math.PI; compass.add(capBot)

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.6, 64, 64), coreMat); compass.add(core)
  const gearA = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.03, 12, 60), mech); compass.add(gearA)
  const gearB = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 12, 48), mech); gearB.rotation.x = Math.PI / 2; compass.add(gearB)

  const housing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 16, 48), brassEdge); housing.position.z = 0.58; compass.add(housing)

  const starCore = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 24), new THREE.MeshBasicMaterial({ color: 0xfff6e0, toneMapped: false }))
  starCore.material.depthTest = false; starCore.renderOrder = 11; starCore.position.z = 0.6; compass.add(starCore)

  function starSprite() {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')!; g.translate(128, 128)
    const rad = g.createRadialGradient(0, 0, 0, 0, 0, 128)
    rad.addColorStop(0, 'rgba(255,250,232,1)'); rad.addColorStop(0.1, 'rgba(255,232,184,0.85)')
    rad.addColorStop(0.4, 'rgba(255,202,132,0.22)'); rad.addColorStop(1, 'rgba(255,202,132,0)')
    g.fillStyle = rad; g.beginPath(); g.arc(0, 0, 128, 0, 7); g.fill()
    g.globalCompositeOperation = 'lighter'
    for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); const lg = g.createLinearGradient(0, 0, 0, -96); lg.addColorStop(0, 'rgba(255,246,220,0.92)'); lg.addColorStop(1, 'rgba(255,222,162,0)'); g.fillStyle = lg; g.beginPath(); g.moveTo(-3.5, 0); g.lineTo(0, -96); g.lineTo(3.5, 0); g.closePath(); g.fill() }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
  }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: starSprite(), blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true, toneMapped: false }))
  glow.scale.set(2.6, 2.6, 1); glow.position.z = 0.6; glow.renderOrder = 10; compass.add(glow)

  // the deploying light-column (3D cylinders stay off; the shaft is soft CSS light).
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xffe8bc, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 9, 28, 1, true), beamMat); beam.renderOrder = 9; compass.add(beam)
  const beamCoreMat = new THREE.MeshBasicMaterial({ color: 0xfffceb, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
  const beamCore = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 9, 20, 1, true), beamCoreMat); beamCore.renderOrder = 9; compass.add(beamCore)
  const baseFlare = new THREE.Sprite(new THREE.SpriteMaterial({ map: starSprite(), color: 0xffe6bc, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true, opacity: 0, toneMapped: false }))
  baseFlare.position.y = -1.9; baseFlare.scale.set(3.4, 1.6, 1); baseFlare.renderOrder = 9; compass.add(baseFlare)

  const amb = new THREE.AmbientLight(0x35415f, 0.5); scene.add(amb)
  const key = new THREE.DirectionalLight(0xffe6bf, 2.1); key.position.set(3, 5, 4); scene.add(key)
  const rim = new THREE.DirectionalLight(0x9fb6e6, 1.1); rim.position.set(-4, 1.5, -3); scene.add(rim)
  const starLight = new THREE.PointLight(0xffe2b0, 1.4, 9, 2); compass.add(starLight)
  const orbitLight = new THREE.PointLight(0xffdca0, 0.0, 6, 2); scene.add(orbitLight)

  type SP = { outer: number; inner: number; star: number; glow: number; rise: number; chan: number; key: number; orbit: number; beam: number; align: number; temp: [number, number, number]; pulse: string }
  const STATES: Record<CompassState, SP> = {
    asleep:    { outer: 0.012, inner: 0.007, star: 0.5, glow: 1.5, rise: -0.04, chan: 0.0, key: 0.32, orbit: 0.0, beam: 0.0, align: 0.1, temp: [255, 214, 166], pulse: 'heartbeat' },
    awakening: { outer: 0.16, inner: 0.22, star: 3.3, glow: 4.7, rise: 0.22, chan: 1.9, key: 3.05, orbit: 1.1, beam: 0.22, align: 0.92, temp: [255, 240, 212], pulse: 'rise' },
    idle:      { outer: 0.06, inner: 0.038, star: 1.0, glow: 2.5, rise: 0.0, chan: 0.06, key: 2.1, orbit: 0.0, beam: 0.0, align: 0.0, temp: [255, 226, 176], pulse: 'breath' },
    hover:     { outer: 0.075, inner: 0.05, star: 1.4, glow: 2.9, rise: 0.05, chan: 0.30, key: 2.35, orbit: 0.25, beam: 0.0, align: 0.0, temp: [255, 230, 186], pulse: 'breath' },
    listening: { outer: 0.05, inner: 0.11, star: 1.9, glow: 3.2, rise: 0.09, chan: 0.6, key: 2.5, orbit: 0.45, beam: 0.0, align: 0.35, temp: [255, 220, 165], pulse: 'listen' },
    thinking:  { outer: 0.18, inner: 0.30, star: 1.75, glow: 3.1, rise: 0.06, chan: 0.85, key: 2.6, orbit: 1.15, beam: 0.0, align: 0.0, temp: [255, 224, 172], pulse: 'slow' },
    planning:  { outer: 0.08, inner: 0.10, star: 1.85, glow: 3.0, rise: 0.08, chan: 0.9, key: 2.6, orbit: 0.55, beam: 0.05, align: 0.9, temp: [206, 224, 255], pulse: 'plan' },
    executing: { outer: 0.20, inner: 0.24, star: 2.5, glow: 4.0, rise: 0.14, chan: 1.6, key: 2.95, orbit: 1.1, beam: 0.4, align: 0.6, temp: [255, 236, 196], pulse: 'exec' },
    deploying: { outer: 0.27, inner: 0.35, star: 4.0, glow: 5.8, rise: 0.55, chan: 2.7, key: 3.6, orbit: 1.7, beam: 1.0, align: 1.0, temp: [255, 245, 222], pulse: 'rise' },
    verifying: { outer: 0.07, inner: 0.10, star: 2.0, glow: 3.4, rise: 0.10, chan: 1.1, key: 2.7, orbit: 0.55, beam: 0.18, align: 0.7, temp: [188, 226, 236], pulse: 'verify' },
    success:   { outer: 0.05, inner: 0.04, star: 2.8, glow: 4.5, rise: 0.12, chan: 1.5, key: 3.0, orbit: 0.2, beam: 0.15, align: 1.0, temp: [255, 242, 212], pulse: 'settle' },
    warning:   { outer: 0.05, inner: 0.07, star: 1.6, glow: 3.0, rise: 0.05, chan: 0.7, key: 2.3, orbit: 0.3, beam: 0.0, align: 0.5, temp: [255, 176, 96], pulse: 'warn' },
    error:     { outer: 0.035, inner: 0.05, star: 1.25, glow: 2.5, rise: 0.02, chan: 0.45, key: 1.95, orbit: 0.2, beam: 0.0, align: 0.25, temp: [255, 138, 74], pulse: 'error' },
    offline:   { outer: 0.012, inner: 0.008, star: 0.22, glow: 1.3, rise: -0.02, chan: 0.0, key: 1.15, orbit: 0.0, beam: 0.0, align: 0.15, temp: [150, 162, 182], pulse: 'off' },
  }
  let stateName: CompassState = 'idle'
  const cur = { star: 1, glow: 2.5, rise: 0, chan: 0.06, key: 2.1, orbit: 0, r: 255, g: 226, b: 176, outer: 0.06, inner: 0.038, beam: 0, align: 0, sexp: 1, envI: 1 }
  let flash = 0

  function setState(name: CompassState) {
    if (!STATES[name]) return
    stateName = name
    if (typeof document !== 'undefined') document.documentElement.setAttribute('data-compass-state', name)
    if (name === 'deploying' || name === 'success' || name === 'executing') flash = 1.0
  }

  const TIME_LIGHT: Record<TimeMode, { exp: number; amb: [number, number, number]; ambI: number; keyC: [number, number, number] }> = {
    dawn:  { exp: 1.09, amb: [0x4a, 0x50, 0x6e], ambI: 0.6, keyC: [255, 224, 190] },
    day:   { exp: 1.17, amb: [0x60, 0x6c, 0x86], ambI: 0.9, keyC: [255, 246, 232] },
    dusk:  { exp: 1.15, amb: [0x4a, 0x40, 0x46], ambI: 0.6, keyC: [255, 216, 168] },
    night: { exp: 1.05, amb: [0x30, 0x3c, 0x58], ambI: 0.5, keyC: [255, 230, 186] },
  }
  let timeTarget = TIME_LIGHT.night
  const timeCur = { exp: 1.05, ar: 0x30, ag: 0x3c, ab: 0x58, ai: 0.5 }
  function setTime(mode: TimeMode) { if (TIME_LIGHT[mode]) timeTarget = TIME_LIGHT[mode] }

  const target = { x: 0, y: 0 }, pt = { x: 0, y: 0 }
  const onMove = (e: PointerEvent) => { target.x = (e.clientX / window.innerWidth - 0.5) * 2; target.y = (e.clientY / window.innerHeight - 0.5) * 2 }
  window.addEventListener('pointermove', onMove)

  function resize() {
    const r = canvas.getBoundingClientRect(); const w = Math.max(1, r.width), h = Math.max(1, r.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(w, h, false)
    camera.aspect = w / h; camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', resize); resize()

  const clock = new THREE.Clock()
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const col = new THREE.Color()
  let raf = 0, disposed = false

  function animate() {
    if (disposed) return
    raf = requestAnimationFrame(animate)
    const dt = Math.min(clock.getDelta(), 0.05); const t = clock.elapsedTime; const S = STATES[stateName]
    const k = 1 - Math.pow(0.001, dt)

    cur.outer = lerp(cur.outer, S.outer, k); cur.inner = lerp(cur.inner, S.inner, k)
    cur.star = lerp(cur.star, S.star, k); cur.glow = lerp(cur.glow, S.glow, k)
    cur.rise = lerp(cur.rise, S.rise, k); cur.chan = lerp(cur.chan, S.chan, k)
    cur.key = lerp(cur.key, S.key, k); cur.orbit = lerp(cur.orbit, S.orbit, k)
    cur.r = lerp(cur.r, S.temp[0], k); cur.g = lerp(cur.g, S.temp[1], k); cur.b = lerp(cur.b, S.temp[2], k)
    cur.beam = lerp(cur.beam, S.beam, k); cur.align = lerp(cur.align, S.align, k * 0.8)
    flash *= Math.pow(0.12, dt)

    const wob = (stateName === 'error') ? Math.sin(t * 2.3) * 0.006 : 0
    gimbal.rotation.y -= cur.outer * dt
    sphere.rotation.y += cur.inner * dt
    gearA.rotation.z += cur.inner * 1.6 * dt; gearB.rotation.y += cur.outer * 1.2 * dt
    compass.rotation.z = Math.sin(t * 0.22) * 0.018 + wob

    m3.rotation.x = lerp(0.35, 0.0, cur.align)
    m2.rotation.y = lerp(Math.PI / 3, Math.PI / 2, cur.align * 0.5)

    // high-momentum cursor tilt that eases to perfect stillness when the mouse stops
    pt.x += (target.x - pt.x) * 0.035; pt.y += (target.y - pt.y) * 0.035
    compass.rotation.x = pt.y * 0.12 - 0.05; compass.rotation.y = pt.x * 0.16
    compass.position.y = cur.rise + Math.sin(t * 0.5) * 0.02   // gentle idle float

    let pf = 1
    if (S.pulse === 'breath') pf = 1 + Math.sin(t * 1.6) * 0.05
    else if (S.pulse === 'listen') pf = 1 + Math.sin(t * 2.2) * 0.10
    else if (S.pulse === 'slow') pf = 1 + Math.sin(t * 0.9) * 0.14
    else if (S.pulse === 'plan') pf = 1 + Math.sin(t * 1.2) * 0.07
    else if (S.pulse === 'exec') pf = 1 + 0.11 * Math.sin(t * 4.4) + 0.04 * Math.sin(t * 11)
    else if (S.pulse === 'rise') pf = 1.15 + 0.12 * Math.sin(t * 6)
    else if (S.pulse === 'verify') pf = 1 + 0.13 * (Math.sin(t * 3.2) > 0 ? 1 : 0.25)
    else if (S.pulse === 'settle') pf = 1 + Math.sin(t * 2.2) * 0.06
    else if (S.pulse === 'warn') pf = 1 + 0.16 * Math.sin(t * 1.15) * (Math.sin(t * 0.4) > -0.2 ? 1 : 0.35)
    else if (S.pulse === 'error') pf = 1 + 0.14 * Math.sin(t * 0.85) * (Math.sin(t * 0.31) > 0 ? 1 : 0.45)
    else if (S.pulse === 'off') pf = 1 + Math.sin(t * 0.4) * 0.03
    else if (S.pulse === 'heartbeat') { const hb = t % 3.4; pf = 1 + 0.5 * Math.exp(-Math.pow((hb - 0.35) / 0.16, 2)) + 0.32 * Math.exp(-Math.pow((hb - 0.72) / 0.16, 2)) }

    const starI = cur.star * pf + flash * 1.6
    col.setRGB(cur.r / 255, cur.g / 255, cur.b / 255)
    starCore.material.color.copy(col).multiplyScalar(Math.min(1, 0.42 + starI * 0.42))
    starCore.scale.setScalar(0.7 + starI * 0.22 + flash * 0.5)
    glow.material.color.copy(col)
    const gs = Math.min(3.9, cur.glow * 0.5 + starI * 0.22) + flash * 0.7
    glow.scale.set(gs, gs, 1)
    starLight.color.copy(col); starLight.intensity = 0.7 + starI * 0.7 + flash * 2.0

    const ci = cur.chan + flash * 1.2
    for (let i = 0; i < channels.length; i++) { channels[i].emissive.copy(col); channels[i].emissiveIntensity = ci }

    orbitLight.intensity = cur.orbit; orbitLight.color.copy(col)
    if (stateName === 'verifying') orbitLight.position.set(Math.cos(t * 2) * 1.4, ((t * 1.6) % 3) - 1.5, 1.6)
    else orbitLight.position.set(Math.cos(t * 1.4) * 2.0, Math.sin(t * 0.9) * 1.2, Math.sin(t * 1.4) * 2.0)

    const beamV = cur.beam
    beamMat.opacity = 0; beamCoreMat.opacity = 0
    baseFlare.material.opacity = beamV * 0.8; baseFlare.material.color.copy(col)
    baseFlare.scale.set(2.8 + beamV * 1.8, 1.2 + beamV * 0.8, 1)

    key.intensity = cur.key; key.color.setRGB(timeTarget.keyC[0] / 255, timeTarget.keyC[1] / 255, timeTarget.keyC[2] / 255)

    timeCur.exp = lerp(timeCur.exp, timeTarget.exp, k * 0.6); timeCur.ai = lerp(timeCur.ai, timeTarget.ambI, k * 0.6)
    timeCur.ar = lerp(timeCur.ar, timeTarget.amb[0], k * 0.6); timeCur.ag = lerp(timeCur.ag, timeTarget.amb[1], k * 0.6); timeCur.ab = lerp(timeCur.ab, timeTarget.amb[2], k * 0.6)
    // asleep dims the whole instrument to a faint outline; the star stays lit
    const sexpT = (stateName === 'asleep') ? 0.42 : 1
    cur.sexp = lerp(cur.sexp, sexpT, k * 0.5)
    renderer.toneMappingExposure = timeCur.exp * cur.sexp
    const envT = (stateName === 'asleep') ? 0.24 : 1
    cur.envI = lerp(cur.envI, envT, k * 0.5)
    brass.envMapIntensity = 1.5 * cur.envI; brassEdge.envMapIntensity = 1.7 * cur.envI
    brassDark.envMapIntensity = 1.1 * cur.envI; mech.envMapIntensity = 0.6 * cur.envI
    amb.intensity = timeCur.ai; amb.color.setRGB(timeCur.ar / 255, timeCur.ag / 255, timeCur.ab / 255)

    // the room reveals itself: a slow, almost imperceptible dolly forward
    camCur = lerp(camCur, camTarget, k * 0.4)
    camera.position.z = camCur

    renderer.render(scene, camera)
  }
  animate()

  return {
    setState,
    setTime,
    dolly: (mode: 'in' | 'back') => { camTarget = mode === 'in' ? 11.3 : 12.1 },
    flare: () => { flash = 1.0 },
    hover: (on: boolean) => { if (on) { if (stateName === 'idle') setState('hover') } else { if (stateName === 'hover') setState('idle') } },
    getState: () => stateName,
    dispose: () => {
      disposed = true; cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove); window.removeEventListener('resize', resize)
      renderer.dispose(); pmrem.dispose()
    },
  }
}
