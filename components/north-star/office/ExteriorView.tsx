"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_LOCATION,
  plateSrc,
  MASTER_ENVIRONMENTS,
  type LocationPack,
  type MasterEnvironment,
} from "./locations";
import { samplePlate, type PlateLight } from "./plateLighting";

// The world beyond the glass. Ported verbatim from the confirmed North Star
// Executive Office baseline (north-star-station @ 546fb87). Double-buffered:
// the next master preloads, then fades in over the old one — the sky turns,
// it never switches. Sits at its own parallax depth and reports its sampled
// light so the office can answer it.
export default function ExteriorView({
  condition,
  location = DEFAULT_LOCATION,
  onLight,
}: {
  condition: MasterEnvironment;
  location?: LocationPack;
  onLight: (light: PlateLight) => void;
}) {
  const [buffers, setBuffers] = useState(() => ({
    a: plateSrc(location, condition),
    b: "",
    front: "a" as "a" | "b",
  }));
  const frontSrc = useRef(plateSrc(location, condition));

  // report the initial plate's light, then stream the rest of the pack
  useEffect(() => {
    samplePlate(plateSrc(location, condition)).then(onLight).catch(() => {});
    const idle = setTimeout(() => {
      for (const c of MASTER_ENVIRONMENTS) {
        const img = new Image();
        img.src = plateSrc(location, c);
      }
    }, 3500);
    return () => clearTimeout(idle);
    // initial mount only — condition/location changes are handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const src = plateSrc(location, condition);
    if (frontSrc.current === src) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      frontSrc.current = src;
      samplePlate(src)
        .then((light) => {
          if (!cancelled) onLight(light);
        })
        .catch(() => {});
      setBuffers((current) =>
        current.front === "a"
          ? { ...current, b: src, front: "b" }
          : { ...current, a: src, front: "a" }
      );
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [condition, location, onLight]);

  return (
    <div className="hq-exterior absolute inset-0">
      {(["a", "b"] as const).map((slot) => {
        const src = buffers[slot];
        if (!src) return null;
        return (
          <div
            key={slot}
            className="hq-exterior-fade absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${src})`,
              opacity: buffers.front === slot ? 1 : 0,
            }}
          />
        );
      })}
    </div>
  );
}
