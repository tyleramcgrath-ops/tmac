// Fictional sample members, loaded into the database on start (see seed.ts) so
// a fresh install has people to swipe on. They are labelled "Sample profile"
// in the app, can't log in, and are turned off with SEED_MEMBERS=off.

export type Gender = "woman" | "man";
// What someone is looking for. Shown on every card, so nobody wastes a flight.
export type Vibe = "relationship" | "marriage" | "dating";

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
  // Two colors for the generated avatar; sample members have no photos.
  palette: [string, string];
  into?: string[];
  discreet?: boolean;
};

export const VIBES: Vibe[] = ["relationship", "marriage", "dating"];

export const VIBE_LABEL: Record<Vibe, string> = {
  relationship: "Looking for a relationship",
  marriage: "Marriage & family",
  dating: "Dating to see where it goes",
};

// The short form, for chips and pickers.
export const VIBE_SHORT: Record<Vibe, string> = {
  relationship: "A relationship",
  marriage: "Marriage & family",
  dating: "Dating to see",
};

// "Free to video chat" lengths a member can pick, in hours.
export const FREE_NOW_HOURS = [2, 4, 6] as const;

// Life & plans tags, so the big questions are answered before the first hello.
export const INTO_TAGS = [
  "Wants kids",
  "Has kids",
  "Family first",
  "Open to relocating",
  "Loves to travel",
  "Faith matters",
  "Dancing",
  "Foodie",
  "Fitness",
  "Beach lover",
  "Homebody",
  "Night owl",
] as const;

// Cities available in Passport mode (match somewhere before you land), with
// their time zone for the live local-time clocks.
export const PASSPORT_CITIES = [
  { city: "Medellín", flag: "🇨🇴", tz: "America/Bogota" },
  { city: "Cartagena", flag: "🇨🇴", tz: "America/Bogota" },
  { city: "Mexico City", flag: "🇲🇽", tz: "America/Mexico_City" },
  { city: "Rio de Janeiro", flag: "🇧🇷", tz: "America/Sao_Paulo" },
  { city: "Buenos Aires", flag: "🇦🇷", tz: "America/Argentina/Buenos_Aires" },
  { city: "Lima", flag: "🇵🇪", tz: "America/Lima" },
  { city: "San Juan", flag: "🇵🇷", tz: "America/Puerto_Rico" },
  { city: "Santo Domingo", flag: "🇩🇴", tz: "America/Santo_Domingo" },
  { city: "Lisbon", flag: "🇵🇹", tz: "Europe/Lisbon" },
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
    vibe: "relationship",
    languages: ["Spanish", "English"],
    occupation: "Architect",
    bio: "Salsa on Thursdays, family lunch on Sundays. Looking for someone kind, curious and ready for something real.",
    interests: ["Salsa", "Coffee farms", "Live music", "Architecture"],
    prompts: [
      { q: "The life I want", a: "A home full of music, a garden, and someone to dance with in the kitchen." },
      { q: "Green flag", a: "You call when you say you will." },
    ],
    verified: true,
    lastActive: "Active now",
    likesYou: true,
    palette: ["#c49a55", "#3b2a1a"],
    into: ["Dancing", "Family first", "Wants kids"],
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
    vibe: "marriage",
    languages: ["Portuguese", "Spanish", "English"],
    occupation: "Physiotherapist",
    bio: "Beach mornings, big family, bigger heart. I want to build a life with someone who shows up.",
    interests: ["Volleyball", "Samba", "Beach", "Travel"],
    prompts: [
      { q: "Perfect first date", a: "Sunset at Arpoador, then dinner where we can actually talk." },
      { q: "Non-negotiable", a: "Sunday lunch with my family." },
    ],
    verified: true,
    lastActive: "Active now",
    likesYou: true,
    palette: ["#d4b06a", "#1f3b2c"],
    into: ["Beach lover", "Wants kids", "Family first"],
  },
  {
    id: "camila",
    name: "Camila",
    age: 29,
    gender: "woman",
    city: "Mexico City",
    country: "Mexico",
    flag: "🇲🇽",
    km: 1,
    vibe: "relationship",
    languages: ["Spanish", "English"],
    occupation: "Graphic designer",
    bio: "Roma Norte local. Museums on Sunday, tacos at midnight. Open to moving for the right person.",
    interests: ["Design", "Tacos", "Museums", "Mezcal"],
    prompts: [
      { q: "Hot take", a: "The best tacos come from a street stand." },
      { q: "I'm looking for", a: "Someone who travels well and laughs easily." },
    ],
    verified: true,
    lastActive: "Active today",
    likesYou: false,
    palette: ["#b5874a", "#3a1f1f"],
    into: ["Open to relocating", "Foodie", "Loves to travel"],
  },
  {
    id: "daniela",
    name: "Daniela",
    age: 26,
    gender: "woman",
    city: "Barranquilla",
    country: "Colombia",
    flag: "🇨🇴",
    km: 4,
    vibe: "dating",
    languages: ["Spanish"],
    occupation: "Dance teacher",
    bio: "Carnaval every year, beach every weekend. Let's talk, video chat, and see where it goes.",
    interests: ["Carnaval", "Beach", "Cumbia", "Cooking"],
    prompts: [
      { q: "Teach me", a: "Your favorite song, and I'll teach you to dance to it." },
    ],
    verified: true,
    lastActive: "Active now",
    likesYou: true,
    palette: ["#e2c487", "#2a2440"],
    into: ["Dancing", "Beach lover", "Night owl"],
  },
  {
    id: "lucia",
    name: "Lucía",
    age: 30,
    gender: "woman",
    city: "Buenos Aires",
    country: "Argentina",
    flag: "🇦🇷",
    km: 5,
    vibe: "relationship",
    languages: ["Spanish", "English", "Italian"],
    occupation: "Lawyer",
    bio: "Malbec, bookshops and long dinners. I'm serious about finding my person, and I'm patient about it.",
    interests: ["Books", "Tango", "Wine", "Running"],
    prompts: [
      { q: "Ideal Sunday", a: "Feria in San Telmo, then asado with friends." },
      { q: "Dealbreaker", a: "Not reading at all. Even one book a year." },
    ],
    verified: true,
    lastActive: "Active today",
    likesYou: true,
    palette: ["#a87b45", "#25262e"],
    into: ["Fitness", "Loves to travel", "Family first"],
  },
  {
    id: "mariana",
    name: "Mariana",
    age: 28,
    gender: "woman",
    city: "Lima",
    country: "Peru",
    flag: "🇵🇪",
    km: 3,
    vibe: "marriage",
    languages: ["Spanish", "English"],
    occupation: "Pediatric nurse",
    bio: "Ceviche by the sea, church on Sunday, and a lot of love to give. Looking for a husband, not a pen pal.",
    interests: ["Cooking", "Hiking", "Church choir", "Surfing"],
    prompts: [
      { q: "What matters most", a: "Faith, family and honesty." },
      { q: "Perfect first date", a: "Lunch in Barranco, then a walk on the malecón." },
    ],
    verified: true,
    lastActive: "Active today",
    likesYou: true,
    palette: ["#c9a46a", "#1e3330"],
    into: ["Faith matters", "Wants kids", "Family first"],
    discreet: true,
  },
  {
    id: "sofia",
    name: "Sofía",
    age: 27,
    gender: "woman",
    city: "Cartagena",
    country: "Colombia",
    flag: "🇨🇴",
    km: 2,
    vibe: "relationship",
    languages: ["Spanish", "English"],
    occupation: "Hotel manager",
    bio: "I meet travelers every day. Now I want one who stays. Rooftops, old town walks, and honest conversation.",
    interests: ["Travel", "Rooftops", "Yoga", "Photography"],
    prompts: [
      { q: "Green flag", a: "You ask good questions and remember the answers." },
    ],
    verified: true,
    lastActive: "Active now",
    likesYou: true,
    palette: ["#d8b878", "#3b1d2b"],
    into: ["Loves to travel", "Open to relocating", "Fitness"],
    discreet: true,
  },
  {
    id: "gabriela",
    name: "Gabriela",
    age: 31,
    gender: "woman",
    city: "San Juan",
    country: "Puerto Rico",
    flag: "🇵🇷",
    km: 6,
    vibe: "dating",
    languages: ["Spanish", "English"],
    occupation: "Pharmacist",
    bio: "Single mom to one amazing kid. Old San Juan, salsa, and slow Sundays. Let's start with a video date.",
    interests: ["Salsa", "Beach", "Cooking", "Volunteering"],
    prompts: [
      { q: "You should know", a: "My daughter comes first. The right man will love that." },
    ],
    verified: true,
    lastActive: "Active today",
    likesYou: false,
    palette: ["#bf9455", "#202a3a"],
    into: ["Has kids", "Family first", "Dancing"],
  },
  {
    id: "ana",
    name: "Ana",
    age: 26,
    gender: "woman",
    city: "Santo Domingo",
    country: "Dominican Republic",
    flag: "🇩🇴",
    km: 3,
    vibe: "relationship",
    languages: ["Spanish", "English"],
    occupation: "Accountant",
    bio: "Bachata, beaches and my grandmother's sancocho. Looking for loyalty and a lot of laughter.",
    interests: ["Bachata", "Beach", "Baseball", "Cooking"],
    prompts: [
      { q: "Ideal first date", a: "Bachata night in the Zona Colonial." },
    ],
    verified: false,
    lastActive: "Active this week",
    likesYou: true,
    palette: ["#e2c487", "#3a2a1e"],
    into: ["Dancing", "Beach lover", "Wants kids"],
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
    vibe: "dating",
    languages: ["Portuguese", "English", "Spanish"],
    occupation: "Marine biologist",
    bio: "Boat by day, fado by night. Curious about someone from far away who doesn't mind a long flight.",
    interests: ["Surfing", "Wine", "Sunsets", "Fado"],
    prompts: [
      { q: "Typical Saturday", a: "Surf, nap, vinho verde, then dinner with friends." },
    ],
    verified: true,
    lastActive: "Active today",
    likesYou: true,
    palette: ["#b48a52", "#16303a"],
    into: ["Loves to travel", "Beach lover", "Homebody"],
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
    vibe: "relationship",
    languages: ["Spanish", "English", "Italian"],
    occupation: "Chef",
    bio: "I'll cook, you pick the wine. Ready for something serious.",
    interests: ["Cooking", "Tango", "Football", "Wine"],
    prompts: [
      { q: "Signature move", a: "Asado for two." },
    ],
    verified: true,
    lastActive: "Active today",
    likesYou: true,
    palette: ["#8a6a3a", "#0f172a"],
    into: ["Foodie", "Family first", "Wants kids"],
  },
  {
    id: "liam",
    name: "Liam",
    age: 33,
    gender: "man",
    city: "Austin",
    country: "United States",
    flag: "🇺🇸",
    km: 7,
    vibe: "relationship",
    languages: ["English", "Spanish"],
    occupation: "Software engineer",
    bio: "Learning Spanish, planning a year in Latin America, and hoping to meet someone worth staying for.",
    interests: ["Hiking", "BBQ", "Live music", "Travel"],
    prompts: [
      { q: "Currently", a: "Duolingo streak of 212 days." },
    ],
    verified: true,
    lastActive: "Active today",
    likesYou: true,
    palette: ["#6f5a3a", "#14232e"],
    into: ["Loves to travel", "Open to relocating", "Fitness"],
  },
];

export function getProfile(id: string): Profile | undefined {
  return PROFILES.find((p) => p.id === id);
}

export function initials(name: string): string {
  return name.slice(0, 1).toUpperCase();
}
