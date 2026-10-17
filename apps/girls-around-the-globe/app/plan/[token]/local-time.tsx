"use client";

import { useNow } from "@/lib/use-now";

// Formats in the reader's own timezone, which only the browser knows.
export function LocalTime({ iso }: { iso: string }) {
  const now = useNow();
  if (now === null) return <time dateTime={iso}>{new Date(iso).toUTCString().replace(":00 GMT", " UTC")}</time>;
  return (
    <time dateTime={iso}>
      {new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" })}
    </time>
  );
}
