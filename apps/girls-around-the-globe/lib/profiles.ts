// Sample members for the prototype. These are fictional people — there is no
// backend yet, so swiping, matches and chat run on this seed data plus the
// visitor's browser storage. Swap this module for real API calls later.

export type Gender = "woman" | "man";
export type Vibe = "tonight" | "this-weekend" | "while-traveling" | "casual-ongoing";

export type Profile = {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  city: string;
  country: string;
  flag: string;
  km: number;
  vibe: Vibe;
  // Set when the member is visiting somewhere, e.g. "In Lisbon until Sunday".
  traveling?: string;
  languages: string[];
  occupation: string;
  bio: string;
  interests: string[];
  prompts: { q: string; a: string }[];
  verified: boolean;
  lastActive: string;
  // Demo stand-in for the other side's swipe: true means a right swipe matches.
  likesYou: boolean;
  // Two colors for the generated avatar, since the prototype ships no photos.
  palette: [string, string];
};

export const VIBE_LABEL: Record<Vibe, string> = {
  tonight: "Free tonight",
  "this-weekend": "This weekend",
  "while-traveling": "While I'm traveling",
  "casual-ongoing": "Casual, ongoing",
};

export const VIBE_EMOJI: Record<Vibe, string> = {
  tonight: "🔥",
  "this-weekend": "🍸",
  "while-traveling": "✈️",
  "casual-ongoing": "😏",
};

// Cities available in Passport mode (swipe somewhere before you land), with
// their time zone for the "where it's night right now" clock.
export const PASSPORT_CITIES = [
  { city: "Medellín", flag: "🇨🇴", tz: "America/Bogota" },
  { city: "Mexico City", flag: "🇲🇽", tz: "America/Mexico_City" },
  { city: "Rio de Janeiro", flag: "🇧🇷", tz: "America/Sao_Paulo" },
  { city: "Lisbon", flag: "🇵🇹", tz: "Europe/Lisbon" },
  { city: "Berlin", flag: "🇩🇪", tz: "Europe/Berlin" },
  { city: "Cape Town", flag: "🇿🇦", tz: "Africa/Johannesburg" },
  { city: "Bangkok", flag: "🇹🇭", tz: "Asia/Bangkok" },
  { city: "Tokyo", flag: "🇯🇵", tz: "Asia/Tokyo" },
];

export const PROFILES: Profile[] = [
  {
    id: "valentina",
    name: "Valentina",
    age: 27,
    gender: "woman",
    city: "Medellín",
    country: "Colombia",
    flag: "🇨🇴",
    km: 3,
    vibe: "tonight",
    languages: ["Spanish", "English"],
    occupation: "Architect",
    bio: "Salsa on Thursdays, rooftops on Fridays. Not looking for a boyfriend, looking for a good night.",
    interests: ["Salsa", "Rooftop bars", "Mezcal", "Live music"],
    prompts: [
      { q: "Green flag", a: "You can actually dance. Or at least you try." },
      { q: "Let's skip the small talk and", a: "Meet for one drink. If there's a spark, there's a second." },
    ],
    verified: true,
    lastActive: "Active now",
    likesYou: true,
    palette: ["#f59e0b", "#be185d"],
  },
  {
    id: "elena",
    name: "Elena",
    age: 29,
    gender: "woman",
    city: "Lisbon",
    country: "Portugal",
    flag: "🇵🇹",
    km: 5,
    vibe: "casual-ongoing",
    languages: ["Portuguese", "English", "French"],
    occupation: "Marine biologist",
    bio: "Boat by day, Bairro Alto by night. Something fun and easy, no labels.",
    interests: ["Surfing", "Wine", "Sunsets", "Fado"],
    prompts: [{ q: "Typical Saturday", a: "Surf, nap, vinho verde, see where the night goes." }],
    verified: true,
    lastActive: "Active 20m ago",
    likesYou: true,
    palette: ["#0ea5e9", "#1e3a8a"],
  },
  {
    id: "sakura",
    name: "Sakura",
    age: 26,
    gender: "woman",
    city: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    km: 8,
    vibe: "this-weekend",
    languages: ["Japanese", "English"],
    occupation: "Photographer",
    bio: "Shy for five minutes, then trouble. Show me a bar I haven't been to in Shibuya.",
    interests: ["Film photography", "Karaoke", "Whisky", "Night walks"],
    prompts: [{ q: "Karaoke song", a: "Anything by Utada Hikaru, badly, with confidence." }],
    verified: true,
    lastActive: "Active 1h ago",
    likesYou: false,
    palette: ["#f472b6", "#7c3aed"],
  },
  {
    id: "isabela",
    name: "Isabela",
    age: 25,
    gender: "woman",
    city: "Rio de Janeiro",
    country: "Brazil",
    flag: "🇧🇷",
    km: 2,
    vibe: "tonight",
    languages: ["Portuguese", "Spanish", "English"],
    occupation: "Physiotherapist",
    bio: "Beach volleyball, caipirinhas, zero drama. If you're in Ipanema tonight, say hi.",
    interests: ["Volleyball", "Samba", "Beach", "Travel"],
    prompts: [{ q: "Ideal first meet", a: "Sunset at Arpoador, then wherever the music is." }],
    verified: true,
    lastActive: "Active now",
    likesYou: true,
    palette: ["#22c55e", "#eab308"],
  },
  {
    id: "maja",
    name: "Maja",
    age: 30,
    gender: "woman",
    city: "Berlin",
    country: "Germany",
    flag: "🇩🇪",
    km: 4,
    vibe: "while-traveling",
    traveling: "In Berlin until Sunday",
    languages: ["Polish", "English", "German"],
    occupation: "Translator",
    bio: "Visiting from Kraków for a long weekend. Techno, currywurst, and a little adventure.",
    interests: ["Techno", "Art galleries", "Late nights", "Languages"],
    prompts: [{ q: "I'll fall for you if", a: "You know a club with no queue." }],
    verified: true,
    lastActive: "Active 10m ago",
    likesYou: true,
    palette: ["#e11d48", "#4c1d95"],
  },
  {
    id: "linh",
    name: "Linh",
    age: 28,
    gender: "woman",
    city: "Bangkok",
    country: "Thailand",
    flag: "🇹🇭",
    km: 6,
    vibe: "this-weekend",
    traveling: "Visiting from Hanoi",
    languages: ["Vietnamese", "Thai", "English"],
    occupation: "Chef",
    bio: "Here for a food festival and some fun. Night markets and rooftop bars, you pick.",
    interests: ["Street food", "Motorbikes", "Karaoke", "Cocktails"],
    prompts: [{ q: "Dealbreaker", a: "Not eating spicy food. Sorry." }],
    verified: false,
    lastActive: "Active 3h ago",
    likesYou: false,
    palette: ["#f43f5e", "#f59e0b"],
  },
  {
    id: "zanele",
    name: "Zanele",
    age: 32,
    gender: "woman",
    city: "Cape Town",
    country: "South Africa",
    flag: "🇿🇦",
    km: 7,
    vibe: "casual-ongoing",
    languages: ["English", "isiXhosa", "Afrikaans"],
    occupation: "Sommelier",
    bio: "I know wine and I know what I want. Confident people only.",
    interests: ["Wine", "Trail running", "Jazz", "Beach"],
    prompts: [{ q: "Order for me", a: "Chenin blanc. Then we'll see." }],
    verified: true,
    lastActive: "Active today",
    likesYou: true,
    palette: ["#a855f7", "#be123c"],
  },
  {
    id: "camila",
    name: "Camila",
    age: 24,
    gender: "woman",
    city: "Mexico City",
    country: "Mexico",
    flag: "🇲🇽",
    km: 1,
    vibe: "tonight",
    languages: ["Spanish", "English"],
    occupation: "Graphic designer",
    bio: "Roma Norte local. Tacos al pastor at 2am is my love language.",
    interests: ["Tacos", "Lucha libre", "Design", "Mezcal"],
    prompts: [{ q: "Hot take", a: "Best tacos are from a street stand, not a restaurant." }],
    verified: true,
    lastActive: "Active now",
    likesYou: false,
    palette: ["#ef4444", "#16a34a"],
  },
  {
    id: "amara",
    name: "Amara",
    age: 29,
    gender: "woman",
    city: "Lisbon",
    country: "Portugal",
    flag: "🇵🇹",
    km: 9,
    vibe: "while-traveling",
    traveling: "Visiting from Lagos",
    languages: ["English", "Yoruba"],
    occupation: "Product manager",
    bio: "Work trip, free evenings. Show me your Lisbon and I'll tell you about mine.",
    interests: ["Afrobeats", "Dancing", "Travel", "Tech"],
    prompts: [{ q: "Two truths and a lie", a: "I've been to 14 countries, I can't swim, I once met Burna Boy." }],
    verified: true,
    lastActive: "Active 30m ago",
    likesYou: true,
    palette: ["#16a34a", "#0f766e"],
  },
  {
    id: "chloe",
    name: "Chloé",
    age: 27,
    gender: "woman",
    city: "Berlin",
    country: "Germany",
    flag: "🇩🇪",
    km: 3,
    vibe: "casual-ongoing",
    traveling: "Here from Montréal for the summer",
    languages: ["French", "English"],
    occupation: "Nurse",
    bio: "Night shifts mean my weekends start on Tuesday. Keep it light, keep it fun.",
    interests: ["Skating", "Indie music", "Bagels", "Lakes"],
    prompts: [{ q: "Winter or summer?", a: "Summer. I'm escaping Montréal winters for a reason." }],
    verified: false,
    lastActive: "Active yesterday",
    likesYou: false,
    palette: ["#ef4444", "#1d4ed8"],
  },
  {
    id: "mateo",
    name: "Mateo",
    age: 31,
    gender: "man",
    city: "Medellín",
    country: "Colombia",
    flag: "🇨🇴",
    km: 4,
    vibe: "this-weekend",
    traveling: "Visiting from Buenos Aires",
    languages: ["Spanish", "English", "Italian"],
    occupation: "Chef",
    bio: "I'll cook, you pick the wine.",
    interests: ["Cooking", "Tango", "Football", "Wine"],
    prompts: [{ q: "Signature move", a: "Asado for two." }],
    verified: true,
    lastActive: "Active today",
    likesYou: true,
    palette: ["#38bdf8", "#0f172a"],
  },
  {
    id: "liam",
    name: "Liam",
    age: 29,
    gender: "man",
    city: "Bangkok",
    country: "Thailand",
    flag: "🇹🇭",
    km: 2,
    vibe: "while-traveling",
    traveling: "Backpacking from Melbourne",
    languages: ["English"],
    occupation: "Teacher",
    bio: "Two weeks in Thailand, no plans, good vibes.",
    interests: ["Surfing", "Hostels", "Muay Thai", "Beaches"],
    prompts: [{ q: "Ideal night", a: "Rooftop, then street food, then whatever." }],
    verified: true,
    lastActive: "Active 2h ago",
    likesYou: true,
    palette: ["#0d9488", "#facc15"],
  },
];

export function getProfile(id: string): Profile | undefined {
  return PROFILES.find((p) => p.id === id);
}

export function initials(name: string): string {
  return name.slice(0, 1).toUpperCase();
}
