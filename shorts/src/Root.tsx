import { Composition } from "remotion";
import { ListicleShort, ShortData } from "./compositions/ListicleShort";

// Load data.json at bundle time (Node/webpack resolves this)
// In the render script we pass inputProps to override this.
import defaultData from "../data.json";

export const RemotionRoot: React.FC = () => {
  const data = defaultData as ShortData;

  // Duration: derive from item count so it fills exactly
  // title (1.5s) + items (1.2s each) + 1s outro
  const fps = 30;
  const listStart = Math.round(fps * 1.5);
  const itemDuration = Math.round(fps * 1.2);
  const durationInFrames =
    listStart + data.items.length * itemDuration + fps * 2;

  return (
    <Composition
      id="ListicleShort"
      component={ListicleShort}
      durationInFrames={Math.min(durationInFrames, fps * 60)}
      fps={fps}
      width={1080}
      height={1920}
      defaultProps={{ data }}
    />
  );
};
