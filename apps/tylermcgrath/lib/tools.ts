// Tools: the Compass is North Star HQ, and these tools orbit it (the
// third ring, next to Studio and Selected Work). `hub` is North Star HQ itself,
// opened by clicking the Compass while that ring is showing.
//
// status: "live" opens the tool; "offline" still shows the card but says it's
// coming back instead of sending visitors to an error page. Flip it back to
// "live" once the host is serving again (RankForge, Citation Gap and North Star
// HQ sit on Vercel, which is paused until the account's billing is settled).
export type Tool = {
  key: string;
  name: string;
  symbol: string;
  label: string;
  tagline: string;
  lead: string;
  body: string;
  list: string[];
  url: string;
  status: "live" | "offline";
  home: string;
};

const tools: Tool[] = [
  {
    key: "serp-quake",
    name: "SERP Quake",
    symbol: "≋",
    label: "ALGORITHM SEISMOGRAPH",
    tagline: "Feel every Google update before your traffic does.",
    lead: "Google updates, measured like earthquakes.",
    body: "48 keywords across 8 industries are read every six hours, and how hard their results moved becomes a magnitude. A normal day is M2 and core updates land at M7 and up. Results Google poisons for rank trackers are filtered out before they count.",
    list: ["Live magnitude with Richter, the mascot", "Quake log matched to Google-confirmed updates", "Fault lines by industry", "7-day free trial"],
    url: "https://tylermcgrath.com/serp-quake/",
    status: "live",
    home: "tylermcgrath.com/serp-quake",
  },
  {
    key: "rankforge",
    name: "RankForge",
    symbol: "⚒",
    label: "WORDPRESS SEO AUTOPILOT",
    tagline: "The SEO tool that safely does the work on your WordPress site.",
    lead: "Audit, fix, deploy, verify, measure.",
    body: "RankForge audits a WordPress site, writes the fixes, deploys them through Yoast, Rank Math or AIOSEO with a safe diff and rollback, then measures whether rankings moved.",
    list: ["Site audits with prioritised recommendations", "Fixes deployed to WordPress, with rollback", "Internal linking and content opportunities", "Search Console and Analytics connected"],
    url: "https://tmac-nu.vercel.app/",
    status: "offline",
    home: "tmac-nu.vercel.app",
  },
  {
    key: "citation-gap",
    name: "Citation Gap",
    symbol: "❝",
    label: "AI OVERVIEW CITATIONS",
    tagline: "Rank in the top 10, get cited by the AI Overview too.",
    lead: "You rank third and the AI Overview quotes someone else.",
    body: "Citation Gap scores your page against the live top 10 and Google's AI Overview, then hands back a ranked work order. Every fix is costed and comes with a prompt to paste into Claude.",
    list: ["Live top 10 and AI Overview comparison", "A ranked, costed work order", "Ready-to-paste prompts for every fix", "Free on your own search key"],
    url: "https://citation-gap.vercel.app/",
    status: "offline",
    home: "citation-gap.vercel.app",
  },
  {
    key: "seo-intel",
    name: "Competitor Intel",
    symbol: "⌖",
    label: "TOP 10 GAP ANALYSIS",
    tagline: "See exactly what the top 10 has that your page doesn't.",
    lead: "Your page against the live top 10, side by side.",
    body: "Enter a page and a keyword. It pulls the live Google top 10, crawls every result and your page, and compares content, headings, schema, links, keyword placement and page speed, then hands back a prioritised action plan.",
    list: ["Live top 10, featured snippets and People Also Ask", "Content, schema and heading gaps, with ready-to-paste JSON-LD", "Internal and external link comparison", "PageSpeed and Core Web Vitals against competitors"],
    url: "https://seo-competitor-intelligence.vercel.app/",
    status: "offline",
    home: "seo-competitor-intelligence.vercel.app",
  },
  {
    key: "shorts-studio",
    name: "Viral Shorts Studio",
    symbol: "▶",
    label: "AI VIDEO BUILDER",
    tagline: "A topic in, a finished vertical short out.",
    lead: "Script, voice, footage and captions, in your browser.",
    body: "Give it a topic and it writes the script, voices it, finds matching footage, syncs word-by-word captions and exports a vertical video ready for Shorts, Reels or TikTok. It runs entirely in the browser on free services, with your own keys optional.",
    list: ["AI script and hook writing", "Voiceover with synced captions", "Stock footage matched to every line", "Exports a full-length vertical video"],
    url: "https://tylermcgrath.com/shorts-studio/",
    status: "live",
    home: "tylermcgrath.com/shorts-studio",
  },
];

export const hub: Tool =
{
    key: "north-star",
    name: "North Star HQ",
    symbol: "✧",
    label: "AI AGENT MISSION CONTROL",
    tagline: "Watch a team of AI SEO agents work a project.",
    lead: "One compass. Endless clarity.",
    body: "A live 3D mission-control dashboard with a Compass, agent roster, mission queue, command bar and executive brief, for watching coordinated AI SEO agents work a site.",
    list: ["Live agent roster and mission queue", "Command bar for directing the team", "Executive brief of what changed and why"],
    url: "https://north-star-hq.vercel.app/",
    status: "offline",
    home: "north-star-hq.vercel.app",
  };

export default tools;
