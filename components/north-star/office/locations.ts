import type { TimeBand, Weather } from "./EnvironmentEngine";

// ============================================================================
// LOCATION PACK — the Master Environment model, ported from the confirmed
// North Star Executive Office baseline (north-star-station @ 546fb87).
// Four production masters: morning, day, golden-hour, night. Weather and
// season are derived at runtime by the environment engine; they never swap
// to a dedicated plate. Trimmed to the one location pack whose assets ship
// with this preview (Swiss Alps) — the source repo lists additional
// "coming soon" cities with no real assets; they are omitted rather than
// faked.
// ============================================================================

export type MasterEnvironment = "morning" | "day" | "golden-hour" | "night";

export const MASTER_ENVIRONMENTS: readonly MasterEnvironment[] = [
  "morning",
  "day",
  "golden-hour",
  "night",
];

export type LocationPack = {
  id: string;
  /** Etched into the top bar. */
  label: string;
  /** Baseline ambient temperature per master, °F. */
  temperaturesF: Record<MasterEnvironment, number>;
};

export const DEFAULT_LOCATION: LocationPack = {
  id: "swiss-alps",
  label: "SWISS ALPS",
  temperaturesF: { morning: 46, day: 57, "golden-hour": 53, night: 39 },
};

export const plateSrc = (location: LocationPack, master: MasterEnvironment) =>
  `/locations/${location.id}/${master}.webp`;

/** Time band → master. Blue-hour is the golden master sinking under the
 *  engine's cool dusk grade; sunset rides golden-hour directly. */
export function resolveMaster(time: TimeBand): MasterEnvironment {
  switch (time) {
    case "morning":
      return "morning";
    case "afternoon":
      return "day";
    case "golden-hour":
    case "sunset":
    case "blue-hour":
      return "golden-hour";
    case "night":
      return "night";
  }
}

/** The top bar reads the world: baseline by master, shifted by weather. */
export function temperatureF(
  location: LocationPack,
  time: TimeBand,
  weather: Weather
): number {
  const base = location.temperaturesF[resolveMaster(time)];
  const delta: Record<Weather, number> = {
    clear: 0,
    wind: -3,
    cloudy: -4,
    rain: -8,
    "heavy-rain": -10,
    storm: -11,
    fog: -6,
    snow: -22,
  };
  return base + delta[weather];
}
