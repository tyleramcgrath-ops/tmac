// Local time helpers for the night clock. "Night" here means the hours people
// actually go out: 8pm until 4am local time.
export function localHour(tz: string, at: Date): number {
  const h = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(at);
  return Number(h) % 24;
}

export function isNight(tz: string, at: Date): boolean {
  const h = localHour(tz, at);
  return h >= 20 || h < 4;
}

export function localTime(tz: string, at: Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(at).toLowerCase();
}
