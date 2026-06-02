import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export interface ListItem {
  emoji: string;
  heading: string;
  body: string;
}

interface Props {
  items: ListItem[];
  accentColor: string;
  /** Frame at which the first item starts animating in */
  startFrame: number;
  /** Frames each item is visible before the next appears */
  itemDuration: number;
}

const SingleItem: React.FC<{
  item: ListItem;
  accentColor: string;
  index: number;
  entryFrame: number;
}> = ({ item, accentColor, index, entryFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = Math.max(0, frame - entryFrame);

  const x = spring({
    frame: localFrame,
    fps,
    config: { damping: 16, stiffness: 140, mass: 0.9 },
    from: -120,
    to: 0,
  });

  const opacity = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Number badge pulse
  const pulse =
    localFrame > 5
      ? 1 + Math.sin(((localFrame - 5) * Math.PI) / 40) * 0.06
      : 1;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 28,
        opacity,
        transform: `translateX(${x}px)`,
        marginBottom: 36,
        padding: "28px 36px",
        background: "rgba(0,0,0,0.38)",
        backdropFilter: "blur(12px)",
        borderRadius: 28,
        border: `2px solid rgba(255,255,255,0.12)`,
        boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
      }}
    >
      {/* Number badge */}
      <div
        style={{
          minWidth: 72,
          height: 72,
          borderRadius: "50%",
          background: accentColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
          fontWeight: 900,
          color: "#fff",
          flexShrink: 0,
          transform: `scale(${pulse})`,
          boxShadow: `0 0 24px ${accentColor}80`,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {index + 1}
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 52,
            fontWeight: 800,
            color: "#FFFFFF",
            lineHeight: 1.1,
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <span style={{ fontSize: 52 }}>{item.emoji}</span>
          {item.heading}
        </div>
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 36,
            fontWeight: 400,
            color: "rgba(255,255,255,0.82)",
            lineHeight: 1.4,
          }}
        >
          {item.body}
        </div>
      </div>
    </div>
  );
};

export const ListItems: React.FC<Props> = ({
  items,
  accentColor,
  startFrame,
  itemDuration,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        padding: "0 48px",
      }}
    >
      {items.map((item, i) => (
        <SingleItem
          key={i}
          item={item}
          accentColor={accentColor}
          index={i}
          entryFrame={startFrame + i * itemDuration}
        />
      ))}
    </div>
  );
};
