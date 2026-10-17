// Local time helpers for the homepage's city explorer.
export function localHour(tz: string, at: Date): number {
  const h = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(at);
  return Number(h) % 24;
}

export function localTime(tz: string, at: Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(at).toLowerCase();
}
