// The website collection shown in Selected Work and the portfolio index.
export type Project = {
  id: string;
  name: string;
  domain: string;
  url: string;
  group: "Websites" | "Lifestyle" | "Platforms";
  category: string;
  image: string | null;
};

const projects: Project[] = [
  { id: "01", name: "SaySites", domain: "saysites.com", url: "https://saysites.com", group: "Websites", category: "Websites & digital services", image: "/projects/saysites.com-hero.webp" },
  { id: "02", name: "Law Match Now", domain: "lawmatchnow.com", url: "https://lawmatchnow.com", group: "Websites", category: "Legal services", image: "/projects/lawmatchnow.com-hero.webp" },
  { id: "03", name: "USAttorneys", domain: "usattorneys.com", url: "https://usattorneys.com", group: "Websites", category: "Legal directory", image: null },
  { id: "04", name: "We Have Rehabs", domain: "wehaverehabs.com", url: "https://wehaverehabs.com", group: "Websites", category: "Recovery & wellness", image: "/projects/wehaverehabs.com-hero.webp" },
  { id: "05", name: "Tamarindo Marketing", domain: "tamarindomarketing.com", url: "https://tamarindomarketing.com", group: "Websites", category: "Marketing", image: "/projects/tamarindomarketing.com-hero.webp" },
  { id: "06", name: "Palm Tree Surf", domain: "palmtreesurf.com", url: "https://palmtreesurf.com", group: "Lifestyle", category: "Surf & lifestyle", image: "/projects/palmtreesurf.com-hero.webp" },
  { id: "07", name: "McGrath Marketing Group", domain: "mcgrathmarketinggroup.com", url: "https://mcgrathmarketinggroup.com", group: "Websites", category: "Marketing", image: "/projects/mcgrathmarketinggroup.com-hero.webp" },
  { id: "08", name: "Comfy Humans", domain: "comfyhumans.com", url: "https://comfyhumans.com", group: "Lifestyle", category: "Lifestyle & commerce", image: "/projects/comfyhumans.com-hero.webp" },
  { id: "09", name: "Esencia Costa Rica", domain: "esenciascr.com", url: "https://esenciascr.com", group: "Lifestyle", category: "Costa Rica", image: "/projects/esenciascr.com-hero.webp" },
  { id: "10", name: "Coastline Builders", domain: "coastlinebuildersfl.com", url: "https://coastlinebuildersfl.com", group: "Websites", category: "Building & construction", image: "/projects/coastlinebuildersfl.com-hero.webp" },
  { id: "11", name: "EnVue Telematics", domain: "envuetelematics.com", url: "https://envuetelematics.com", group: "Platforms", category: "Telematics", image: "/projects/envuetelematics.com-hero.webp" },
  { id: "12", name: "EnVue Mexico", domain: "envuemex.com", url: "https://envuemex.com", group: "Platforms", category: "Telematics", image: "/projects/envuemex.com-hero.webp" },
  { id: "13", name: "Centris Info", domain: "centrisinfo.com", url: "https://centrisinfo.com", group: "Platforms", category: "Information & technology", image: "/projects/centrisinfo.com-hero.webp" },
  { id: "14", name: "Centris Intelligence", domain: "centrisintelligence.com", url: "https://centrisintelligence.com", group: "Platforms", category: "Intelligence & technology", image: "/projects/centrisintelligence.com-hero.webp" },
  { id: "15", name: "Southern Charm Luxury Charter", domain: "southerncharmluxurycharter.com", url: "https://southerncharmluxurycharter.com", group: "Lifestyle", category: "Charter experiences", image: "/projects/southerncharmluxurycharter.com-hero.webp" },
  { id: "16", name: "NetworkIP", domain: "networkip.net", url: "https://networkip.net", group: "Platforms", category: "Communications", image: "/projects/networkip.net-hero.webp" },
  { id: "17", name: "TruePoint Systems", domain: "truepointsystems.com", url: "https://truepointsystems.com", group: "Platforms", category: "Systems & technology", image: "/projects/truepointsystems.com-hero.webp" },
  { id: "18", name: "Charleston Popeye Charters", domain: "charlestonpopeyecharters.com", url: "https://charlestonpopeyecharters.com", group: "Lifestyle", category: "Fishing charters", image: "/projects/charlestonpopeyecharters.com-hero.webp" },
  { id: "19", name: "Kinoko", domain: "eatkinoko.com", url: "https://eatkinoko.com", group: "Lifestyle", category: "Food & dining", image: "/projects/eatkinoko.com-hero.webp" },
  { id: "20", name: "EEC", domain: "eec-fl.com", url: "https://eec-fl.com", group: "Websites", category: "Business & services", image: "/projects/eec-fl.com-hero.webp" },
  { id: "21", name: "Prescriptive Pool Service", domain: "prescriptivepoolservice.com", url: "https://prescriptivepoolservice.com", group: "Websites", category: "Pool service", image: "/projects/prescriptivepoolservice.com-hero.webp" },
];

export default projects;
