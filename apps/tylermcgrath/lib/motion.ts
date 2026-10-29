// Phone tilt, shared by the Compass and the room parallax. Values are -1..1
// relative to how the phone was held when tilt first came in, so holding it
// at any comfortable angle reads as "level".
export const tilt = { x: 0, y: 0, has: false };

let rest: { b: number; g: number } | null = null;
let listening = false;

function listen() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("deviceorientation", (e) => {
    if (e.beta == null || e.gamma == null) return;
    rest ??= { b: e.beta, g: e.gamma };
    tilt.x = Math.max(-1, Math.min(1, (e.gamma - rest.g) / 25));
    tilt.y = Math.max(-1, Math.min(1, (e.beta - rest.b) / 25));
    tilt.has = true;
  });
}

/** Call from a tap: iOS asks the visitor for permission first. */
export function enableTilt() {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return;
  const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
  if (typeof DOE.requestPermission === "function") {
    DOE.requestPermission().then((r) => r === "granted" && listen()).catch(() => {});
  } else listen();
}
