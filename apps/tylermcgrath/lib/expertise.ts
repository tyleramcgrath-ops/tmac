// What Tyler does, shared by the desktop panels and the phone app.
export type Expertise = { title: string; lead: string; body: string; list: string[] };

const EXPERTISE: Record<string, Expertise> = {
  seo: {
    title: "SEO · GEO · AEO",
    lead: "Be discovered wherever people search.",
    body: "I connect traditional SEO with GEO and AEO to position brands across search engines and AI-driven discovery.",
    list: ["Technical SEO and site structure", "Content strategy and search intent", "Generative Engine Optimization (GEO)", "Answer Engine Optimization (AEO)"],
  },
  marketing: {
    title: "Marketing & SEO",
    lead: "Turn attention into opportunity.",
    body: "Clear messaging, useful content, and data-driven execution help turn digital visibility into high-quality leads and opportunities to grow.",
    list: ["SEO, GEO and AEO strategy", "Content planning and execution", "Lead generation journeys", "Data-driven improvement"],
  },
  design: {
    title: "Web Design",
    lead: "A stronger digital foundation.",
    body: "I bring web design, content, and search strategy together to create a clear presence online and guide visitors toward the next step.",
    list: ["Brand-led website design", "Clear navigation and user journeys", "Content and search foundations"],
  },
};

export default EXPERTISE;
