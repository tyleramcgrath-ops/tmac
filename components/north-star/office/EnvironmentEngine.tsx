"use client";

import { useSyncExternalStore } from "react";
import type { CSSProperties } from "react";

// ============================================================================
// THE ENVIRONMENT ENGINE
// Ported verbatim (frontend-only, no backend) from the confirmed North Star
// Executive Office baseline (north-star-station @ 546fb87). The room is
// frozen; the world and the light are alive. This module owns the single
// environment state — time band (from the user's local clock), weather,
// season, business health — and compiles it into a small set of CSS custom
// properties. Every visual layer consumes those vars through long CSS
// transitions, so no change is ever abrupt: the sky doesn't switch, it turns.
// Weather/season have no live feed (frontend-only, preview): they are
// config-driven and overridable via URL for review, e.g.
// ?time=night&weather=heavy-rain
// ============================================================================

export type TimeBand =
  | "morning"
  | "afternoon"
  | "golden-hour"
  | "sunset"
  | "blue-hour"
  | "night";

export type Weather =
  | "clear"
  | "cloudy"
  | "rain"
  | "heavy-rain"
  | "storm"
  | "fog"
  | "snow"
  | "wind";

export type Season = "spring" | "summer" | "autumn" | "winter";

export type Environment = {
  time: TimeBand;
  weather: Weather;
  season: Season;
  /** 0–100; a good week warms the room and Compass. Mocked, isolated. */
  businessHealth: number;
};

const TIME_BANDS: readonly TimeBand[] = [
  "morning",
  "afternoon",
  "golden-hour",
  "sunset",
  "blue-hour",
  "night",
];
const WEATHERS: readonly Weather[] = [
  "clear",
  "cloudy",
  "rain",
  "heavy-rain",
  "storm",
  "fog",
  "snow",
  "wind",
];
const SEASONS: readonly Season[] = ["spring", "summer", "autumn", "winter"];

export function resolveTimeBand(date: Date): TimeBand {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h >= 5.5 && h < 11) return "morning";
  if (h >= 11 && h < 16) return "afternoon";
  if (h >= 16 && h < 18) return "golden-hour";
  if (h >= 18 && h < 19.25) return "sunset";
  if (h >= 19.25 && h < 20.75) return "blue-hour";
  return "night";
}

export function resolveSeason(date: Date): Season {
  const m = date.getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

/** Review/debug overrides: ?time=night&weather=rain&season=winter */
export function readEnvironmentOverrides(
  search: string
): Partial<Pick<Environment, "time" | "weather" | "season">> {
  const params = new URLSearchParams(search);
  const out: Partial<Pick<Environment, "time" | "weather" | "season">> = {};
  const time = params.get("time") as TimeBand | null;
  const weather = params.get("weather") as Weather | null;
  const season = params.get("season") as Season | null;
  if (time && TIME_BANDS.includes(time)) out.time = time;
  if (weather && WEATHERS.includes(weather)) out.weather = weather;
  if (season && SEASONS.includes(season)) out.season = season;
  return out;
}

// --- the grade tables -------------------------------------------------------

type Grade = {
  bright: number; // window backdrop brightness
  sat: number; // window backdrop saturation
  blur: number; // window backdrop blur px (fog/heavy weather)
  warm: number; // warm wash opacity over the glass
  cool: number; // cool wash opacity over the glass
  night: number; // night darkening opacity over the glass
  fog: number; // fog fill opacity over the glass
  rain: number; // rain-streak opacity on the glass
  storm: number; // lightning gate 0/1
  snow: number; // snowfall + frost gate 0/1
  wind: number; // precipitation-drift accelerator 0/1
  interior: number; // interior light compensation (the office turns its lights on)
  roomCool: number; // cool cast over the whole room (weather mood)
  compass: number; // Compass warmth 0..1
  reflect: number; // floor/desk reflection intensity boost
};

const TIME_GRADES: Record<TimeBand, Partial<Grade>> = {
  morning: { bright: 1, sat: 1, warm: 0.05, cool: 0.04, interior: 0.22, compass: 0.55, reflect: 0.32 },
  afternoon: { bright: 1.02, sat: 1, warm: 0.02, cool: 0.03, interior: 0.14, compass: 0.5, reflect: 0.3 },
  "golden-hour": { bright: 1, sat: 1, warm: 0.26, cool: 0, interior: 0.32, compass: 0.7, reflect: 0.4 },
  sunset: { bright: 0.93, sat: 1.02, warm: 0.36, cool: 0.05, interior: 0.44, compass: 0.8, reflect: 0.46 },
  "blue-hour": { bright: 0.42, sat: 0.7, warm: 0.42, cool: 0.36, night: 0.28, interior: 0.7, compass: 0.85, reflect: 0.56 },
  night: { bright: 1, sat: 1, warm: 0.02, interior: 1, compass: 0.9, reflect: 0.7 },
};

// Weather never swaps the master plate — it transforms it.
const WEATHER_GRADES: Record<
  Weather,
  Partial<Grade> & { brightMul?: number; satMul?: number; warmMul?: number }
> = {
  clear: {},
  wind: { brightMul: 0.96, satMul: 0.94, cool: 0.05, wind: 1 },
  cloudy: { brightMul: 0.78, satMul: 0.7, warmMul: 0.4, cool: 0.16, interior: 0.12, roomCool: 0.1 },
  rain: { brightMul: 0.62, satMul: 0.6, warmMul: 0.3, cool: 0.26, rain: 0.55, blur: 0.8, interior: 0.18, roomCool: 0.16, reflect: 0.22 },
  "heavy-rain": { brightMul: 0.5, satMul: 0.52, warmMul: 0.22, cool: 0.34, rain: 0.9, blur: 1.4, wind: 0.6, interior: 0.24, roomCool: 0.22, reflect: 0.32 },
  storm: { brightMul: 0.34, satMul: 0.44, warmMul: 0.15, cool: 0.42, rain: 0.92, blur: 1.8, storm: 1, wind: 1, interior: 0.3, roomCool: 0.3, reflect: 0.36 },
  fog: { brightMul: 0.78, satMul: 0.42, warmMul: 0.4, cool: 0.16, fog: 0.68, blur: 2.6, interior: 0.16, roomCool: 0.12, reflect: -0.08 },
  snow: { brightMul: 0.88, satMul: 0.5, warmMul: 0.35, cool: 0.3, fog: 0.22, snow: 1, wind: 0.35, interior: 0.18, roomCool: 0.14 },
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Compile the environment into the CSS custom properties the room consumes. */
export function environmentVars(env: Environment): CSSProperties {
  const t = TIME_GRADES[env.time];
  const w = WEATHER_GRADES[env.weather];

  const bright = (t.bright ?? 1) * (w.brightMul ?? 1);
  const sat = (t.sat ?? 1) * (w.satMul ?? 1);
  const warm = (t.warm ?? 0) * (w.warmMul ?? 1) + (w.warm ?? 0);
  const health = clamp01((env.businessHealth - 50) / 50);
  const compass = clamp01(
    (t.compass ?? 0.6) + health * 0.15 - (w.roomCool ?? 0) * 0.4
  );

  return {
    "--env-bright": bright.toFixed(3),
    "--env-sat": sat.toFixed(3),
    "--env-blur": `${(t.blur ?? 0) + (w.blur ?? 0)}px`,
    "--env-warm": clamp01(warm).toFixed(3),
    "--env-cool": clamp01((t.cool ?? 0) + (w.cool ?? 0)).toFixed(3),
    "--env-night": clamp01((t.night ?? 0) + (w.night ?? 0)).toFixed(3),
    "--env-fog": clamp01((t.fog ?? 0) + (w.fog ?? 0)).toFixed(3),
    "--env-rain": clamp01((t.rain ?? 0) + (w.rain ?? 0)).toFixed(3),
    "--env-storm": String(w.storm ?? 0),
    "--env-snow": String(w.snow ?? 0),
    "--env-wind": String(w.wind ?? 0),
    "--env-interior": clamp01((t.interior ?? 0) + (w.interior ?? 0)).toFixed(3),
    "--env-room-cool": clamp01((t.roomCool ?? 0) + (w.roomCool ?? 0)).toFixed(3),
    "--env-compass": compass.toFixed(3),
    "--env-reflect": clamp01((t.reflect ?? 0.3) + (w.reflect ?? 0)).toFixed(3),
  } as CSSProperties;
}

// --- image-based lighting ----------------------------------------------
// The plate's own sampled light overrides the hand table for everything that
// couples the room to the world: the interior is CAUSED by the environment.

export type { PlateLight } from "./plateLighting";

export function lightingVars(light: {
  r: number;
  g: number;
  b: number;
  lum: number;
  warmth: number;
  sat: number;
} | null): CSSProperties {
  if (!light) return {};
  const interior = clamp01(1.12 - light.lum * 1.75);
  const castOp = clamp01(0.12 + (0.5 - light.lum) * 0.35 - light.warmth * 0.18);
  const glassReflect = clamp01(0.8 - light.lum * 1.3);
  const floorDim = clamp01((0.52 - light.lum) * 1.5);
  const flat = clamp01(1 - light.sat * 1.6) * clamp01(light.lum * 2);
  const vars = {
    "--env-interior": interior.toFixed(3),
    "--env-cast": `${light.r} ${light.g} ${light.b}`,
    "--env-cast-op": castOp.toFixed(3),
    "--env-reflect-tint": `${Math.min(255, light.r + 40)} ${Math.min(255, light.g + 30)} ${light.b}`,
    "--env-glass-reflect": glassReflect.toFixed(3),
    "--env-floor-dim": floorDim.toFixed(3),
    "--env-flat": flat.toFixed(3),
  };
  return vars as CSSProperties;
}

// Seasonal grading of the exterior only — the architecture never changes.
export function seasonVars(season: Season): CSSProperties {
  const table: Record<Season, { sat: number; hue: number }> = {
    spring: { sat: 1.06, hue: -2 },
    summer: { sat: 1, hue: 0 },
    autumn: { sat: 1.04, hue: -9 },
    winter: { sat: 0.82, hue: 4 },
  };
  const s = table[season];
  return {
    "--season-sat": s.sat.toFixed(2),
    "--season-hue": `${s.hue}deg`,
  } as CSSProperties;
}

// --- the live hook ----------------------------------------------------------

const DEFAULT_ENV: Environment = {
  time: "morning",
  weather: "clear",
  season: "summer",
  businessHealth: 92,
};

// One environment for the whole room — an external store so any surface
// answers when the world turns.
let state: Environment | undefined;
let timeOverridden = false;
let ticker: ReturnType<typeof setInterval> | undefined;
const envListeners = new Set<() => void>();

function notifyEnv() {
  for (const listener of envListeners) listener();
}

function initEnvironment(): Environment {
  const now = new Date();
  const overrides = readEnvironmentOverrides(window.location.search);
  timeOverridden = "time" in overrides;
  return {
    time: resolveTimeBand(now),
    season: resolveSeason(now),
    weather: "clear",
    businessHealth: 92,
    ...overrides,
  };
}

export const environmentStore = {
  subscribe(listener: () => void) {
    envListeners.add(listener);
    // the clock only runs while someone is watching
    if (!ticker) {
      ticker = setInterval(() => {
        if (timeOverridden || !state) return;
        const band = resolveTimeBand(new Date());
        if (band !== state.time) {
          state = { ...state, time: band };
          notifyEnv();
        }
      }, 60_000);
    }
    return () => {
      envListeners.delete(listener);
      if (envListeners.size === 0 && ticker) {
        clearInterval(ticker);
        ticker = undefined;
      }
    };
  },
  get(): Environment {
    if (!state) state = initEnvironment();
    return state;
  },
  getServer(): Environment {
    return DEFAULT_ENV;
  },
  setWeather(weather: Weather) {
    state = { ...this.get(), weather };
    notifyEnv();
  },
  setTime(time: TimeBand) {
    timeOverridden = true;
    state = { ...this.get(), time };
    notifyEnv();
  },
};

/** The whole room shares one environment. */
export function useEnvironment(): Environment {
  return useSyncExternalStore(
    environmentStore.subscribe,
    environmentStore.get,
    environmentStore.getServer
  );
}
