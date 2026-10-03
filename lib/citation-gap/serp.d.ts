// Types for the vendored serp.js (apps/citation-gap): one Google query via SerpApi or Serper.
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const handler: (req: { query: Record<string, string> }, res: { setHeader(k: string, v: string): void; status(n: number): { json(o: any): void } }) => Promise<void>
export default handler
