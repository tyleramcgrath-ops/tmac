import { AbsoluteFill, useVideoConfig, staticFile } from "remotion";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { AnimatedTitle } from "../components/AnimatedTitle";
import { ListItems, ListItem } from "../components/ListItems";
import { ProgressBar } from "../components/ProgressBar";

export interface ShortData {
  title: string;
  subtitle?: string;
  accentColor: string;
  gradientColors: [string, string, string];
  items: ListItem[];
  /** Frame at which list items start appearing (default 45) */
  listStartFrame?: number;
  /** Frames between each item entry (default 40) */
  itemDuration?: number;
}

export const ListicleShort: React.FC<{ data: ShortData }> = ({ data }) => {
  const { fps } = useVideoConfig();

  const listStartFrame = data.listStartFrame ?? Math.round(fps * 1.5);
  const itemDuration = data.itemDuration ?? Math.round(fps * 1.2);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* ── Layer 0: Animated background ── */}
      <AnimatedBackground colors={data.gradientColors} />

      {/* ── Layout: flex column top→bottom ── */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 120,
          paddingBottom: 80,
        }}
      >
        {/* Top third: title block */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            flex: "0 0 auto",
            paddingBottom: 40,
          }}
        >
          <AnimatedTitle
            title={data.title}
            subtitle={data.subtitle}
            accentColor={data.accentColor}
          />
        </div>

        {/* Middle: list items */}
        <div
          style={{
            flex: 1,
            width: "100%",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <ListItems
            items={data.items}
            accentColor={data.accentColor}
            startFrame={listStartFrame}
            itemDuration={itemDuration}
          />
        </div>

        {/* Bottom: progress bar */}
        <div
          style={{
            width: "100%",
            flex: "0 0 auto",
            paddingTop: 16,
          }}
        >
          <ProgressBar accentColor={data.accentColor} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
