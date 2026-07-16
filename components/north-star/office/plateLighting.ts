// Image-based lighting: the interior is CAUSED by the environment. On plate
// activation we sample the plate itself — average color, luminance, warm/cool
// balance — and the room derives its interior compensation, ambient cast,
// reflections, and Compass warmth from what the world actually looks like.
// Ported verbatim from the confirmed North Star Executive Office baseline
// (north-star-station @ 546fb87).

export type PlateLight = {
  r: number;
  g: number;
  b: number;
  /** 0..1 average luminance of the world */
  lum: number;
  /** -1..1, cool → warm balance */
  warmth: number;
  /** 0..1 colorfulness — flat grey light reads ~0, saturated light ~1 */
  sat: number;
};

const cache = new Map<string, PlateLight>();

export function samplePlate(src: string): Promise<PlateLight> {
  const cached = cache.get(src);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const w = 24;
        const h = 12;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no 2d context");
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let colorfulness = 0;
        const n = w * h;
        for (let i = 0; i < n * 4; i += 4) {
          const pr = data[i];
          const pg = data[i + 1];
          const pb = data[i + 2];
          r += pr;
          g += pg;
          b += pb;
          colorfulness += Math.max(pr, pg, pb) - Math.min(pr, pg, pb);
        }
        r /= n;
        g /= n;
        b /= n;
        colorfulness /= n;
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        const warmth = Math.max(-1, Math.min(1, (r - b) / 96));
        const light: PlateLight = {
          r: Math.round(r),
          g: Math.round(g),
          b: Math.round(b),
          lum,
          warmth,
          sat: Math.min(1, colorfulness / 70),
        };
        cache.set(src, light);
        resolve(light);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error(`plate failed to load: ${src}`));
    img.src = src;
  });
}
