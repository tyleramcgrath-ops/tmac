import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface Props {
  accentColor: string;
}

export const ProgressBar: React.FC<Props> = ({ accentColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
    extrapolateRight: "clamp",
  });

  const entryScale = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 200 },
    from: 0,
    to: 1,
  });

  // Glow pulse
  const glow = 0.7 + Math.sin((frame * Math.PI) / 20) * 0.3;

  return (
    <div
      style={{
        position: "relative",
        width: "calc(100% - 96px)",
        margin: "0 48px",
        transform: `scaleY(${entryScale})`,
      }}
    >
      {/* Track */}
      <div
        style={{
          height: 12,
          borderRadius: 8,
          background: "rgba(255,255,255,0.18)",
          overflow: "hidden",
        }}
      >
        {/* Fill */}
        <div
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            borderRadius: 8,
            background: `linear-gradient(90deg, ${accentColor}, #ffffff)`,
            boxShadow: `0 0 ${12 * glow}px ${accentColor}, 0 0 ${24 * glow}px ${accentColor}60`,
            transition: "width 0s",
          }}
        />
      </div>

      {/* Time label */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
          fontFamily: "'Inter', sans-serif",
          fontSize: 24,
          fontWeight: 600,
          color: "rgba(255,255,255,0.55)",
          letterSpacing: "0.06em",
        }}
      >
        <span>{formatTime(frame, fps)}</span>
        <span>{formatTime(durationInFrames, fps)}</span>
      </div>
    </div>
  );
};

function formatTime(frames: number, fps: number): string {
  const secs = Math.floor(frames / fps);
  const ms = Math.floor(((frames % fps) / fps) * 10);
  return `0:${String(secs).padStart(2, "0")}.${ms}`;
}
