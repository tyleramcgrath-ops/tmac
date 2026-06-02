import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface Props {
  colors: [string, string, string];
}

export const AnimatedBackground: React.FC<Props> = ({ colors }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Slow hue-shift cycle across the full duration
  const shift = interpolate(frame, [0, durationInFrames], [0, 360]);

  // Floating particle positions — deterministic offsets from index
  const particles = Array.from({ length: 18 }, (_, i) => {
    const seed = i * 137.5; // golden-angle spread
    const x = ((seed * 7.3) % 100);
    const y = ((seed * 3.7) % 100);
    const size = 4 + (i % 5) * 6;
    const speed = 0.3 + (i % 4) * 0.2;
    const drift = Math.sin((frame * speed * Math.PI) / 60 + seed) * 12;
    const opacity = 0.08 + (i % 3) * 0.06;
    return { x, y: y + drift, size, opacity };
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(${shift}deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`,
        overflow: "hidden",
      }}
    >
      {/* Grid overlay for depth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 80px),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 80px)`,
        }}
      />

      {/* Floating circles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.9)",
            opacity: p.opacity,
            filter: "blur(2px)",
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* Radial vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)",
        }}
      />
    </div>
  );
};
