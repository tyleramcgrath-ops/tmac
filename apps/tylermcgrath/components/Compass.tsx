"use client";

// The North Star Compass. Every value the rings, glow and lights use is eased
// toward the current state each frame, and ring angles are integrated from
// their speed, so switching state (or hovering a card) never makes it jump.
// The whole instrument turns to face the cursor and the needle swings to
// point at it on a spring.
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { focus } from "@/lib/focus";
import { tilt } from "@/lib/motion";

export type CompassState =
  | "sleep"
  | "wake"
  | "hover"
  | "idle"
  | "thinking"
  | "planning"
  | "executing"
  | "success";

type Profile = {
  color: string;
  activity: number;
  brightness: number;
  core: number;
  outer: number;
  middle: number;
  inner: number;
  vertical: number;
  tension: number;
};

const P = (color: string, activity: number, brightness: number, core: number, outer: number, middle: number, inner: number, vertical: number, tension: number): Profile => ({ color, activity, brightness, core, outer, middle, inner, vertical, tension });

// The cool HUD light the Compass takes on while locked onto a card.
const LOCK_COLOR = new THREE.Color("#9ff0ff");

const PROFILES: Record<CompassState, Profile> = {
  sleep: P("#8e8067", 0.04, 0.18, 0.16, 0.002, -0.003, 0.004, 0.05, 0.02),
  wake: P("#ffd889", 0.72, 0.86, 0.92, 0.12, -0.16, 0.34, 0.7, 0.4),
  hover: P("#ffd889", 0.34, 0.62, 0.62, 0.032, -0.044, 0.065, 0.26, 0.2),
  idle: P("#ffd889", 0.22, 0.5, 0.52, 0.02, -0.03, 0.045, 0.2, 0.12),
  thinking: P("#c6ddff", 0.58, 0.72, 0.78, 0.09, -0.13, 0.2, 0.42, 0.3),
  planning: P("#ffd889", 0.5, 0.68, 0.72, 0.058, -0.086, 0.13, 0.34, 0.36),
  executing: P("#ffc46b", 0.78, 0.86, 0.9, 0.13, -0.18, 0.28, 0.56, 0.4),
  success: P("#dafff0", 0.66, 0.82, 0.86, 0.044, -0.062, 0.1, 0.56, 0.2),
};

// Shared across the page: where the cursor is, in viewport pixels.
const cursor = { x: -1, y: -1, seen: false };
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType === "touch") return;
      cursor.x = e.clientX;
      cursor.y = e.clientY;
      cursor.seen = true;
    },
    { passive: true },
  );
}

type Live = Omit<Profile, "color"> & { color: THREE.Color; energy: number; pulse: number; lock: number };

// Materials whose look depends on the live profile register a formula here and
// are updated once per frame instead of being re-created on every state change.
type Glow = { mat: THREE.MeshBasicMaterial; base: number; k: keyof Live; amt: number };

function useCompassMaterials() {
  return useMemo(() => {
    const glows: Glow[] = [];
    const glow = (base: number, k: keyof Live, amt: number) => {
      const mat = new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
      glows.push({ mat, base, k, amt });
      return mat;
    };
    const brass = new THREE.MeshStandardMaterial({ color: "#d19a3e", metalness: 0.97, roughness: 0.16, emissive: "#5b3209" });
    const brassDim = new THREE.MeshStandardMaterial({ color: "#9d7434", metalness: 0.97, roughness: 0.24, emissive: "#5b3209", emissiveIntensity: 0.035 });
    const obsidian = new THREE.MeshStandardMaterial({ color: "#171412", metalness: 0.88, roughness: 0.28, emissive: "#160d04" });
    const lens = new THREE.MeshStandardMaterial({ metalness: 0.02, roughness: 0.02, transparent: true, depthWrite: false });
    const heart = new THREE.MeshStandardMaterial({ color: "#fff4cc", metalness: 0.18, roughness: 0.14 });
    return { glows, glow, brass, brassDim, obsidian, lens, heart };
  }, []);
}

type Mats = ReturnType<typeof useCompassMaterials>;

function Ring({ r, tube, mat, arc = Math.PI * 2, seg = 220 }: { r: number; tube: number; mat: THREE.Material; arc?: number; seg?: number }) {
  return (
    <mesh material={mat}>
      <torusGeometry args={[r, tube, 14, seg, arc]} />
    </mesh>
  );
}

function Instrument({ state, pulseKey, live }: { state: CompassState; pulseKey: number; live: React.MutableRefObject<Live> }) {
  const m = useCompassMaterials();
  const { gl } = useThree();
  const root = useRef<THREE.Group>(null);
  const outer = useRef<THREE.Group>(null);
  const middle = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const orbitA = useRef<THREE.Group>(null);
  const orbitB = useRef<THREE.Group>(null);
  const orbitC = useRef<THREE.Group>(null);
  const needle = useRef<THREE.Group>(null);
  const heart = useRef<THREE.Mesh>(null);
  const wave = useRef<THREE.Mesh>(null);
  const key = useRef<THREE.PointLight>(null);
  const spot = useRef<THREE.SpotLight>(null);
  // Integrated angles and spring state; never derived from elapsed time.
  const s = useRef({ outer: 0, middle: 0, inner: 0, a: 0, b: 0, c: 0, t: 0, rx: 0, ry: 0, lean: 0, needle: 0, needleV: 0 });
  const target = useRef(PROFILES[state]);
  const targetColor = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    target.current = PROFILES[state];
  }, [state]);

  useEffect(() => {
    if (pulseKey) live.current.pulse = 1;
  }, [pulseKey, live]);

  const star = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(0, 0.78);
    sh.lineTo(0.048, 0.1);
    sh.lineTo(0.42, 0);
    sh.lineTo(0.048, -0.1);
    sh.lineTo(0, -0.78);
    sh.lineTo(-0.048, -0.1);
    sh.lineTo(-0.42, 0);
    sh.lineTo(-0.048, 0.1);
    sh.closePath();
    return sh;
  }, []);

  const glowA = useMemo(() => ({
    outerHalo: m.glow(0.08, "activity", 0.18),
    orbitA: m.glow(0.12, "activity", 0.38),
    orbitB: m.glow(0.08, "activity", 0.32),
    orbitC: m.glow(0.06, "activity", 0.24),
    middleFine: m.glow(0.08, "activity", 0.16),
    innerA: m.glow(0.22, "activity", 0.38),
    innerB: m.glow(0.14, "activity", 0.34),
    starGlow: m.glow(0.16, "core", 0.24),
    heartHalo: m.glow(0.06, "core", 0.24),
    beam: m.glow(0.06, "vertical", 0.34),
    beamHalo: m.glow(0.06, "core", 0.18),
    floor: m.glow(0.08, "activity", 0.18),
    wave: m.glow(0, "pulse", 0.55),
  }), [m]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const L = live.current;
    const T = target.current;
    const st = s.current;
    st.t += dt;

    // Ease every profile value toward the target state.
    for (const k of ["activity", "brightness", "core", "outer", "middle", "inner", "vertical", "tension"] as const) {
      L[k] = THREE.MathUtils.damp(L[k], T[k], 2.2, dt);
    }
    targetColor.set(T.color).lerp(LOCK_COLOR, L.lock * 0.55);
    L.color.lerp(targetColor, 1 - Math.exp(-2.2 * dt));
    L.pulse = Math.max(0, L.pulse - dt * 0.9);

    // Where is the cursor relative to the instrument?
    const rect = gl.domElement.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // A card being looked at wins; then the mouse; on a phone without a card
    // in focus, tilting it moves a virtual cursor instead.
    const aim = focus.active
      ? { x: focus.x, y: focus.y, on: true }
      : cursor.seen
        ? { x: cursor.x, y: cursor.y, on: true }
        : { x: cx + tilt.x * innerWidth * 0.45, y: cy + tilt.y * innerHeight * 0.35, on: tilt.has };
    let dx = 0;
    let dy = 0;
    if (aim.on) {
      dx = (aim.x - cx) / (innerWidth / 2);
      dy = (aim.y - cy) / (innerHeight / 2);
    }
    const dist = Math.hypot(dx, dy);
    const energy = cursor.seen ? THREE.MathUtils.clamp(1 - dist / 0.9, 0, 1) : 0.15;
    L.energy = THREE.MathUtils.damp(L.energy, energy, 3, dt);
    // Locked onto a card: the core flares and the light runs cool.
    L.lock = THREE.MathUtils.damp(L.lock, focus.active ? 1 : 0, 6, dt);
    const boost = L.energy * 0.35 + L.lock * 0.55 + L.pulse * 0.6;

    // Face the cursor: a smooth, critically damped turn and a slight lean.
    st.ry = THREE.MathUtils.damp(st.ry, THREE.MathUtils.clamp(dx, -1.2, 1.2) * 0.62, 3.2, dt);
    st.rx = THREE.MathUtils.damp(st.rx, THREE.MathUtils.clamp(dy, -1.2, 1.2) * 0.44, 3.2, dt);
    st.lean = THREE.MathUtils.damp(st.lean, THREE.MathUtils.clamp(dx, -1, 1) * 0.05, 2.5, dt);
    if (root.current) {
      root.current.rotation.set(st.rx + 0.01 * Math.sin(st.t * 0.3), st.ry, 0);
      root.current.position.set(st.lean, -0.04 + Math.sin(st.t * (0.42 + 0.7 * L.activity)) * (0.008 + 0.02 * L.activity), 0);
      root.current.scale.setScalar(0.82 + 0.02 * Math.sin(st.t * 0.7) * L.activity + L.pulse * 0.05);
    }

    // The needle points at the cursor, on a spring that overshoots a little.
    // (stiffness 60, damping ratio about 0.6; drifts slowly when there's no cursor)
    if (aim.on && dist > 0.06) {
      const want = Math.atan2(-(aim.y - cy), aim.x - cx) - Math.PI / 2;
      const diff = Math.atan2(Math.sin(want - st.needle), Math.cos(want - st.needle));
      st.needleV += (60 * diff - 9.3 * st.needleV) * dt;
    } else {
      st.needleV += (0.15 - st.needleV) * 2 * dt;
    }
    st.needle += st.needleV * dt;
    if (needle.current) needle.current.rotation.z = st.needle;

    const spin = 1 + boost * 4;
    st.outer += L.outer * spin * dt;
    st.middle += L.middle * spin * dt;
    st.inner += L.inner * spin * dt;
    st.a += (0.08 + 0.36 * L.activity) * spin * dt;
    st.b -= (0.05 + 0.3 * L.activity) * spin * dt;
    st.c += (0.035 + 0.24 * L.activity) * spin * dt;
    outer.current?.rotation.set(0, 0.035 * Math.sin(0.2 * st.t), st.outer);
    middle.current?.rotation.set(0, st.middle, Math.sin(0.24 * st.t) * (0.035 + 0.08 * L.tension));
    inner.current?.rotation.set(Math.PI / 2 + 0.028 * Math.sin(0.22 * st.t), 0, -st.inner);
    orbitA.current?.rotation.set(0.66 + 0.04 * Math.sin(0.22 * st.t), 0.1, st.a);
    orbitB.current?.rotation.set(0.1, 0.72 + 0.035 * Math.cos(0.18 * st.t), st.b);
    orbitC.current?.rotation.set(-0.5 + 0.04 * Math.sin(0.16 * st.t), -0.38 + 0.035 * Math.cos(0.2 * st.t), st.c);
    heart.current?.scale.setScalar(1 + Math.sin(st.t * (0.8 + 1.2 * L.activity)) * (0.025 + 0.07 * L.core) + L.pulse * 0.4 + L.energy * 0.12);
    if (wave.current) wave.current.scale.setScalar(0.6 + (1 - L.pulse) * 1.6);

    // Push the live values into the materials and lights.
    const b = L.brightness + boost * 0.5;
    for (const g of m.glows) {
      g.mat.color.copy(L.color);
      g.mat.opacity = g.base + g.amt * Math.min(1, (L[g.k] as number) + (g.k === "pulse" ? 0 : boost * 0.5));
    }
    m.brass.emissiveIntensity = 0.085 * b;
    m.obsidian.emissiveIntensity = 0.04 * b;
    m.lens.color.copy(L.color);
    m.lens.emissive.copy(L.color);
    m.lens.opacity = 0.085 + 0.07 * L.activity;
    m.lens.emissiveIntensity = 0.08 + 0.2 * L.core;
    m.heart.emissive.copy(L.color);
    m.heart.emissiveIntensity = 0.3 + 3.1 * (L.core + boost * 0.4);
    if (key.current) {
      key.current.color.copy(L.color);
      key.current.intensity = 3 + 10 * b;
    }
    if (spot.current) {
      spot.current.color.copy(L.color);
      spot.current.intensity = 0.55 * (3 + 10 * b);
    }
  });

  const g = glowA;
  return (
    <>
      <ambientLight intensity={0.42} color="#9b672b" />
      <directionalLight position={[2.6, 3.4, 4]} intensity={3.4} color="#ffe3ac" />
      <directionalLight position={[-2.2, 1.1, 2.4]} intensity={0.7} color="#71869b" />
      <spotLight ref={spot} position={[0, 2.2, 2.1]} angle={0.4} penumbra={0.78} distance={6.2} />
      <pointLight ref={key} position={[0, 0.18, 1.25]} distance={5.4} />
      <group ref={root}>
        {/* Light pooled on the desk under the instrument */}
        <group position={[0, -0.98, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh scale={[1.28, 0.38, 1]} material={g.floor}>
            <ringGeometry args={[0.42, 0.74, 160]} />
          </mesh>
        </group>
        <mesh position={[0, -0.08, 0.02]} material={g.beam}>
          <cylinderGeometry args={[0.006, 0.032, 2.05, 32]} />
        </mesh>
        <mesh position={[0, -0.08, 0.025]} material={g.beamHalo}>
          <sphereGeometry args={[0.36, 48, 48]} />
        </mesh>
        <group position={[0, -0.02, 0]}>
          <group ref={orbitA} position={[0, -0.01, 0.08]}>
            <mesh scale={[1.18, 0.78, 1]} material={g.orbitA}><torusGeometry args={[0.74, 0.007, 10, 220, 1.52 * Math.PI]} /></mesh>
          </group>
          <group ref={orbitB} position={[0, -0.01, 0.09]}>
            <mesh scale={[0.84, 1.18, 1]} material={g.orbitB}><torusGeometry args={[0.68, 0.006, 10, 220, 1.32 * Math.PI]} /></mesh>
          </group>
          <group ref={orbitC} position={[0, -0.01, 0.1]}>
            <mesh scale={[1.1, 0.9, 1]} material={g.orbitC}><torusGeometry args={[0.58, 0.005, 10, 220, 1.12 * Math.PI]} /></mesh>
          </group>
          <group ref={outer}>
            <Ring r={0.82} tube={0.024} mat={m.brass} seg={256} />
            <Ring r={0.86} tube={0.006} mat={g.outerHalo} seg={256} />
            {[0, Math.PI / 2, Math.PI, 1.5 * Math.PI].map((a) => (
              <mesh key={a} position={[0.82 * Math.cos(a), 0.82 * Math.sin(a), 0.03]} material={m.brass}>
                <sphereGeometry args={[0.032, 20, 20]} />
              </mesh>
            ))}
          </group>
          <group ref={middle}>
            <mesh rotation={[0, Math.PI / 2, 0]} material={m.brassDim}><torusGeometry args={[0.78, 0.017, 18, 220]} /></mesh>
            <mesh rotation={[0.38, Math.PI / 2, 0.18]} material={g.middleFine}><torusGeometry args={[0.62, 0.008, 12, 180]} /></mesh>
          </group>
          <group ref={inner}>
            <mesh material={g.innerA}><torusGeometry args={[0.55, 0.014, 14, 192]} /></mesh>
            <mesh rotation={[0, Math.PI / 2, 0]} scale={[1, 1, 0.58]} material={g.innerB}><torusGeometry args={[0.47, 0.01, 12, 160]} /></mesh>
          </group>
          {Array.from({ length: 48 }, (_, i) => {
            const a = (i / 48) * Math.PI * 2;
            const major = i % 6 === 0;
            const r = major ? 0.72 : 0.7;
            return (
              <mesh key={i} position={[Math.cos(a) * r, Math.sin(a) * r, 0.028]} rotation={[0, 0, a]} material={major ? m.brass : m.brassDim}>
                <boxGeometry args={[0.006, major ? 0.115 : 0.058, 0.004]} />
              </mesh>
            );
          })}
          <mesh position={[0, 0, -0.015]} rotation={[Math.PI / 2, 0, 0]} material={m.obsidian}>
            <torusGeometry args={[0.48, 0.006, 10, 180]} />
          </mesh>
          {/* Shockwave sent out by a click */}
          <mesh ref={wave} position={[0, 0, 0.05]} material={g.wave}>
            <ringGeometry args={[0.8, 0.83, 160]} />
          </mesh>
          <group ref={needle}>
            {[0, Math.PI / 2].map((r) => (
              <mesh key={r} rotation={[0, 0, r]} material={m.brass}><cylinderGeometry args={[0.01, 0.01, 1.66, 24]} /></mesh>
            ))}
            {[Math.PI / 4, -Math.PI / 4].map((r) => (
              <mesh key={r} rotation={[0, 0, r]} material={m.brassDim}><cylinderGeometry args={[0.006, 0.006, 1.2, 24]} /></mesh>
            ))}
            <group position={[0, 0, 0.13]} scale={0.48}>
              <mesh position={[0, 0, 0.015]} material={m.brass}><shapeGeometry args={[star]} /></mesh>
              <mesh position={[0, 0, 0.026]} scale={0.76} material={g.starGlow}><shapeGeometry args={[star]} /></mesh>
              {/* North tip catches the light so the direction reads at a glance */}
              <mesh position={[0, 0.62, 0.03]} material={g.starGlow}><sphereGeometry args={[0.05, 16, 16]} /></mesh>
            </group>
          </group>
          <mesh material={m.lens}><sphereGeometry args={[0.44, 64, 64]} /></mesh>
          <mesh ref={heart} material={m.heart}><sphereGeometry args={[0.13, 64, 64]} /></mesh>
          <mesh material={g.heartHalo}><sphereGeometry args={[0.29, 64, 64]} /></mesh>
        </group>
      </group>
    </>
  );
}

class Fallback extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? <div className="compass-fallback">✧</div> : this.props.children;
  }
}

export default function Compass({ state, paused, pulseKey }: { state: CompassState; paused: boolean; pulseKey: number }) {
  const live = useRef<Live>({ ...PROFILES.sleep, color: new THREE.Color(PROFILES.sleep.color), energy: 0, pulse: 0, lock: 0 });
  return (
    <Fallback>
      <Canvas
        frameloop={paused ? "demand" : "always"}
        dpr={[1, 1.8]}
        camera={{ position: [0, 0.06, 5.1], fov: 21, near: 0.1, far: 20 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <Instrument state={state} pulseKey={pulseKey} live={live} />
      </Canvas>
    </Fallback>
  );
}
