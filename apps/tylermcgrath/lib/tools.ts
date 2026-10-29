// The SEO tools shown in The Lab (the third ring around the Compass).
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
  },
  {
    key: "saysites",
    name: "SaySites",
    symbol: "◐",
    label: "WEBSITES THAT RANK",
    tagline: "Say it, and your website does it.",
    lead: "Tell Sofie about your business.",
    body: "Describe your business and watch the website appear, then change anything by saying so. Every site is fast and built to Google's Search Essentials from the first page.",
    list: ["A full site from a conversation", "SEO foundations built in", "Edit by saying what to change"],
    url: "https://saysites.com",
    status: "live",
    home: "saysites.com",
  },
];

export default tools;
