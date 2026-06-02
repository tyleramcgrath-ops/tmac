import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

interface Props {
  title: string;
  subtitle?: string;
  accentColor: string;
}

export const AnimatedTitle: React.FC<Props> = ({
  title,
  subtitle,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 180, mass: 0.8 },
    from: 0.6,
    to: 1,
  });

  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Subtle perpetual breathe after entry
  const breathe =
    frame > 20
      ? 1 + Math.sin(((frame - 20) * Math.PI) / 90) * 0.015
      : 1;

  const subtitleY = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 18, stiffness: 120 },
    from: 30,
    to: 0,
  });

  const subtitleOpacity = interpolate(frame, [8, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        transform: `scale(${scale * breathe})`,
        padding: "0 60px",
        textAlign: "center",
      }}
    >
      {subtitle && (
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: accentColor,
            marginBottom: 16,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            textShadow: `0 0 20px ${accentColor}80`,
          }}
        >
          {subtitle}
        </div>
      )}
      <div
        style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 88,
          fontWeight: 900,
          lineHeight: 1.05,
          color: "#FFFFFF",
          textShadow: "0 4px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.8)",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </div>
    </div>
  );
};
