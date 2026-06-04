// Build the Centris blog post as a polished .docx that pastes cleanly into WordPress.
// - Featured image at top
// - SEO-optimized heading hierarchy (H1 -> H2 -> H3)
// - Humanized voice, scannable structure, FAQ section
// - Tables, bulleted/numbered lists with real Word numbering (not unicode bullets)

const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType, ShadingType,
  ExternalHyperlink, PageBreak,
} = require("docx");

// ---------- helpers ----------
const P = (text, opts = {}) =>
  new Paragraph({
    spacing: { before: 80, after: 120, line: 320 },
    ...opts,
    children: opts.children || [new TextRun({ text })],
  });

const H1 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text })],
  });

const H2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text })],
  });

const H3 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text })],
  });

const Bullet = (text) =>
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40, line: 300 },
    children: [new TextRun({ text })],
  });

const Italic = (text) =>
  new Paragraph({
    spacing: { before: 80, after: 120, line: 320 },
    children: [new TextRun({ text, italics: true, color: "525866" })],
  });

const Quote = (text) =>
  new Paragraph({
    spacing: { before: 120, after: 160, line: 320 },
    indent: { left: 360 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: "3FA8A0", space: 12 } },
    children: [new TextRun({ text, italics: true, color: "1F2937" })],
  });

const Mixed = (runs) =>
  new Paragraph({
    spacing: { before: 80, after: 120, line: 320 },
    children: runs,
  });

const Run = (text, opts = {}) => new TextRun({ text, ...opts });

// ---------- featured image ----------
const featured = new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 0, after: 160 },
  children: [
    new ImageRun({
      type: "png",
      data: fs.readFileSync("/home/user/tmac/centris-featured-image.png"),
      transformation: { width: 600, height: 315 }, // 1200x630 scaled
      altText: {
        title: "From Keywords to Customers: Centris 2026 SEO Momentum",
        description:
          "Centris Information Services featured graphic depicting the SEO-to-BPO pipeline — a query lattice on the left connecting through a signal line to a customer point-of-contact response topology on the right.",
        name: "centris-2026-seo-bpo-featured",
      },
    }),
  ],
});

const featuredCaption = new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 0, after: 240 },
  children: [
    new TextRun({
      text:
        "Centris 2026 SEO Momentum — mapping the path from a customer's search query to a real human conversation.",
      italics: true,
      size: 20,
      color: "525866",
    }),
  ],
});

// ---------- table: data & proof points ----------
const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: "D6DBE3" };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

const tableCell = (text, opts = {}) =>
  new TableCell({
    borders: cellBorders,
    width: { size: opts.width, type: WidthType.DXA },
    shading: opts.header
      ? { fill: "0F2742", type: ShadingType.CLEAR }
      : opts.alt
        ? { fill: "F4F6FA", type: ShadingType.CLEAR }
        : { fill: "FFFFFF", type: ShadingType.CLEAR },
    margins: { top: 120, bottom: 120, left: 160, right: 160 },
    children: [
      new Paragraph({
        spacing: { before: 0, after: 0, line: 280 },
        children: [
          new TextRun({
            text,
            bold: !!opts.header,
            color: opts.header ? "FFFFFF" : "1F2937",
          }),
        ],
      }),
    ],
  });

const proofRows = [
  [
    "Search drives the majority of online experiences",
    "Businesses that show up early in the search journey have a real shot at qualified traffic — and at converting it before competitors do.",
  ],
  [
    "Traffic is rising, but conversions are flat for many teams",
    "Slow follow-up, disconnected support, and rigid scripts leak high-intent leads. The fix is operational, not editorial.",
  ],
  [
    "Customer support teams are absorbing the new demand",
    "Higher inquiry volume, bilingual expectations, and real-time engagement are stretching internal teams thin and degrading experience.",
  ],
  [
    "Engagement metrics are the new SEO scoreboard",
    "Reply speed, chat resolution, and post-click satisfaction now influence rankings and revenue more than raw traffic ever did.",
  ],
];

const TABLE_W = 9360; // US Letter content width
const COL_A = 3360;
const COL_B = 6000;

const proofTable = new Table({
  width: { size: TABLE_W, type: WidthType.DXA },
  columnWidths: [COL_A, COL_B],
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        tableCell("Proof Point", { width: COL_A, header: true }),
        tableCell("Why It Matters for Your Business", { width: COL_B, header: true }),
      ],
    }),
    ...proofRows.map(
      ([a, b], i) =>
        new TableRow({
          children: [
            tableCell(a, { width: COL_A, alt: i % 2 === 0 }),
            tableCell(b, { width: COL_B, alt: i % 2 === 0 }),
          ],
        })
    ),
  ],
});

// ---------- body content ----------
const children = [
  // Title (H1) — the indexable headline
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.LEFT,
    spacing: { before: 0, after: 160 },
    children: [
      new TextRun({
        text:
          "From Keywords to Customers: How Centris' 2026 SEO Momentum Reflects Real BPO Results",
      }),
    ],
  }),

  // Byline / meta
  Mixed([
    Run("By Centris Information Services  ·  ", { color: "525866", size: 20 }),
    Run("Updated June 2026  ·  ", { color: "525866", size: 20 }),
    Run("Reading time: 7 minutes", { color: "525866", size: 20 }),
  ]),

  // Featured image block
  featured,
  featuredCaption,

  // Lede — humanized hook
  P(
    "Search has gotten louder in 2026, but conversion hasn't. Most companies we talk to are seeing more clicks than ever — and watching most of them slip away before a single sales conversation begins. The gap isn't an SEO problem in the old sense. It's the seam between marketing and the people who pick up the phone."
  ),
  P(
    "This post is a working playbook for closing that seam. It covers what's actually changing in search behavior this year, which metrics now correlate with revenue, and how a connected SEO-to-BPO pipeline — search visibility tied to bilingual, nearshore customer support — quietly outperforms strategies that stop at the click."
  ),

  // Key insights box (the scannable summary Google loves)
  H2("Key Takeaways"),
  Bullet(
    "Search behavior in 2026 favors conversational, intent-rich queries — context now matters more than keyword density."
  ),
  Bullet(
    "Traffic is a vanity metric without engagement; conversion rate, reply time, and post-click experience are the new scoreboard."
  ),
  Bullet(
    "An SEO-to-BPO pipeline connects what people search for with how your team answers — closing the conversion gap in one motion."
  ),
  Bullet(
    "Bilingual customer support is one of the highest-leverage moves a U.S. brand can make in 2026 to reach underserved buyers."
  ),
  Bullet(
    "Loyalty is built after the first click — by consistent, human, well-staffed support that matches the rising expectations of search."
  ),

  // Table of Contents (plain text — WordPress will rebuild from the H2s)
  H2("Table of Contents"),
  Bullet("Search keyword trends for 2026"),
  Bullet("SEO metrics that actually reflect growth"),
  Bullet("Defining the SEO-to-BPO pipeline"),
  Bullet("Bilingual search: tapping new markets"),
  Bullet("From clicks to customer loyalty"),
  Bullet("Data and proof points"),
  Bullet("How Centris helps teams scale support"),
  Bullet("Frequently asked questions"),

  // ---------- Section 1 ----------
  H2("What Are the Top Search Engine Keyword Trends for 2026?"),
  P(
    "If your SEO playbook still revolves around volume, you're playing the 2018 game. The shift this year is unmistakable: people search the way they talk. A query that used to read \"BPO services\" now reads \"how do I scale bilingual support without hiring 40 people?\" That sentence is a brief, a budget signal, and a buying intent in one breath."
  ),
  P(
    "For operations leaders, that change has a downstream consequence most teams underestimate. A more qualified visitor is also a more impatient one. They've already done the comparison, narrowed the field, and arrived expecting a real answer. If your support team can't respond in their language, in their timezone, in the next few minutes, you've already lost them — not to a competitor's content, but to a competitor's pickup time."
  ),
  P(
    "The companies pulling ahead in 2026 are treating SEO and customer experience as one system. They build content around the questions a buyer actually asks at 9:47 a.m. on a Tuesday, then make sure the team behind the contact form is staffed to answer it before 9:51."
  ),
  Quote(
    "Direct answer: 2026 search trends reward conversational intent, real-time relevance, and content built around the customer's actual question — not around the keyword."
  ),

  // ---------- Section 2 ----------
  H2("Which SEO Metrics Best Reflect Real Business Growth?"),
  P(
    "Clicks, impressions, and average position are easy to chart and easy to lie with. We've sat across the table from teams hitting record traffic in the same quarter they missed every revenue target. Visibility without conversion is just a more efficient way to leak budget."
  ),
  P(
    "The metrics that actually correlate with growth in 2026 sit downstream of the click. They include lead quality, time-to-first-response, chat resolution rate, repeat-contact rate, and post-purchase satisfaction. None of these are SEO metrics in the strict sense — and that's the point. The audit that matters is the one that follows a real customer through the whole journey, not the one that stops at GA4."
  ),

  H3("Use this lens if any of these sound familiar"),
  Bullet("Your traffic is climbing but conversion stays flat or slips quarter over quarter."),
  Bullet("Support inquiries are arriving faster than your internal team can answer them."),
  Bullet("Lead quality is invisible — your marketing dashboard ends at the form submission."),
  Bullet("A meaningful share of your buyers speak Spanish or Portuguese as their first language."),
  Bullet("You can't draw a straight line from an SEO investment to a revenue outcome."),

  P(
    "The teams getting this right are pulling SEO data and contact-center data into the same view. The result is a clearer picture of what people search for, what they ask once they arrive, where they get stuck, and which of those moments turns into revenue."
  ),
  Quote(
    "Direct answer: The most valuable SEO metrics in 2026 are the ones tied to engagement, lead quality, and conversion — not traffic in isolation."
  ),

  // ---------- Section 3: pipeline ----------
  H2("Defining the SEO-to-BPO Pipeline"),
  P(
    "Most companies think of SEO and customer support as separate budgets, separate teams, and separate quarterly goals. The SEO-to-BPO pipeline is the simple, structural decision to stop treating them that way."
  ),
  P(
    "In practice, it means three things. First, your search content is built from the actual questions your support team is hearing this week — not last year's keyword research. Second, your support coverage matches the demand the content creates: enough agents, in the right languages, on the right hours, to answer within the window high-intent buyers will tolerate. Third, the data flows in both directions: support sees what's converting, search sees what's confusing, and both adjust."
  ),
  P(
    "It's not a tool. It's an operating posture. And it's why companies that wire it up tend to convert more from the same traffic — sometimes substantially more — without paying for another channel."
  ),

  H3("Why most teams struggle to convert SEO traffic into customers"),
  P(
    "The honest answer is rarely the website. It's the seam after the click — slow follow-up on a form submission, a chat that takes nine minutes to staff, a Spanish-speaking buyer who reaches a monolingual queue, an overnight inquiry that waits until morning. Every one of those frictions is invisible in a traffic report and obvious in a churn curve."
  ),
  P(
    "The other common failure mode is treating search intent as a marketing artifact instead of a customer-experience signal. Your search queries are the single best inventory of what your buyers don't yet understand. If that inventory never reaches the support and sales teams that talk to those buyers, you're paying twice for the same insight and using it once."
  ),

  H3("What to look for in an SEO and customer support partner"),
  P(
    "A strong partner should compress the distance between a search query and a confident human answer. That means structured onboarding, clear performance reporting, real bilingual capability (not Google Translate with a smile), quality-assurance discipline, and the operational flexibility to scale up for a campaign or absorb seasonal overflow without burning out the in-house team."
  ),
  Bullet("Bilingual fluency in English and Spanish — and ideally Portuguese — with cultural fluency to match."),
  Bullet("Time-zone overlap with your customer base, not your vendor's."),
  Bullet("QA scoring, recorded calibration, and weekly performance visibility."),
  Bullet("A staffing model that flexes with demand instead of forcing demand to flex with staffing."),
  Bullet("Tight integration with your CRM, ticketing, and analytics — so the data round-trips back to marketing."),

  // ---------- Section 4: bilingual ----------
  H2("Bilingual Search: Tapping New Markets"),
  P(
    "Bilingual SEO is one of the most under-priced opportunities in the U.S. market in 2026. Search demand in Spanish is growing across nearly every consumer category, and the keyword landscape is still markedly less competitive than its English equivalent. Translation matters, but cultural and regional nuance matters more — costo, precio, and tarifa are not interchangeable for the buyer typing them, and the page that proves it earns the click."
  ),
  P(
    "The pipeline argument applies double here. Ranking for a Spanish-language query is a hollow victory if the buyer arrives at a contact form, fills it out, and gets a follow-up call in English the next afternoon. Bilingual content earns trust at the search layer; bilingual support earns the customer."
  ),

  // ---------- Section 5: loyalty ----------
  H2("From Clicks to Customer Loyalty"),
  P(
    "Loyalty is a post-click discipline. It's the second call answered as quickly as the first, the agent who remembers the previous conversation, the chat that picks up where the email left off. Search can deliver the buyer to your door — only operations can convince them to stay."
  ),
  P(
    "The companies winning long-term retention in 2026 are doing something unglamorous: they're treating every customer interaction as a ranking signal of its own. Good support raises lifetime value, which raises tolerance for premium pricing, which funds the next round of SEO investment. The flywheel turns whether you set it up intentionally or not — the only question is which direction."
  ),

  // ---------- Proof points table ----------
  H2("Data and Proof Points"),
  P(
    "If you need to make the case internally, here is the short version — the proof points decision-makers tend to act on."
  ),
  proofTable,
  P(""),

  // ---------- Centris CTA ----------
  H2("How Centris Helps Teams Scale Support"),
  P(
    "Centris Information Services exists for the exact moment described above — the one where SEO finally works, inquiries are climbing, and the internal team can feel the strain. We extend your team with nearshore, bilingual agents trained on your brand, your product, and your tone. Onboarding is structured, performance is visible, and the model flexes with demand instead of forcing you to over-hire or under-serve."
  ),
  P(
    "If your marketing is starting to outrun your operations, this is the lane we build in. The result our clients describe most often: response times drop, conversion lifts, and the in-house team stops drowning in tickets it shouldn't have to own."
  ),
  Mixed([
    Run("Ready to talk it through? ", { bold: true }),
    new ExternalHyperlink({
      link: "https://www.centriscorp.com/contact",
      children: [Run("Contact Centris", { color: "1E5AA8", underline: { type: "single" } })],
    }),
    Run(" to see how nearshore support can extend your team — not your budget."),
  ]),

  // ---------- FAQ (rich-result friendly) ----------
  H2("Frequently Asked Questions"),

  H3("How does SEO actually help with customer acquisition?"),
  P(
    "SEO puts you in front of buyers who are already searching for what you sell. Done well, it pulls in higher-intent traffic than paid channels, lowers your cost per acquisition over time, and gives your support and sales teams a steady inflow of self-qualified conversations."
  ),

  H3("Why is bilingual customer support so important in 2026?"),
  P(
    "Because a meaningful share of U.S. buyers prefer to do business in Spanish, and they remember the brands that meet them there. Bilingual support raises trust, lifts conversion on Spanish-language traffic, and quietly increases retention — three returns from the same investment."
  ),

  H3("Which SEO metrics matter most in 2026?"),
  P(
    "Lead quality, time-to-first-response, chat or call resolution rate, and conversion-to-revenue. Traffic and rankings still matter as leading indicators, but they no longer pay the bills on their own."
  ),

  H3("Why do businesses struggle to convert website traffic into customers?"),
  P(
    "Almost always because marketing and operations are running on separate clocks. The website fills the pipeline faster than the support team can drain it, and high-intent leads cool off in the gap. The fix is structural, not creative."
  ),

  H3("How does nearshore support help a growing business?"),
  P(
    "Nearshore gives you bilingual coverage in your time zones at a fraction of the cost of expanding domestically — and without the long ramp of building it yourself. It's the fastest way we know of to add real capacity to a stretched in-house team."
  ),

  H3("What should you look for in a customer support partner?"),
  P(
    "Bilingual fluency, time-zone alignment, transparent QA, integration with your existing systems, and the operational flexibility to scale up and down without renegotiating the relationship every quarter."
  ),

  // ---------- About / E-E-A-T signal ----------
  H2("About Centris Information Services"),
  P(
    "Centris is a nearshore BPO partner for U.S. brands that need bilingual, customer-facing support without the overhead of building it in-house. We've spent more than two decades building contact-center teams that act like an extension of yours — answering on the second ring, in the right language, with the context your customers expect."
  ),
];

// ---------- assemble ----------
const doc = new Document({
  creator: "Centris Information Services",
  title: "From Keywords to Customers: How Centris' 2026 SEO Momentum Reflects Real BPO Results",
  description:
    "Traffic alone doesn't grow a business in 2026. See how a connected SEO-to-BPO pipeline — bilingual nearshore support tied to search intent — turns search visibility into measurable customer growth.",
  keywords:
    "SEO 2026, BPO, contact center outsourcing, nearshore support, bilingual customer support, SEO to BPO pipeline, Centris Information Services, customer experience, conversion optimization",
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 44, bold: true, font: "Calibri", color: "0F2742" },
        paragraph: { spacing: { before: 320, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 32, bold: true, font: "Calibri", color: "0F2742" },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 26, bold: true, font: "Calibri", color: "1F2937" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 }, // US Letter
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  const out = "/home/user/tmac/Centris-2026-SEO-Momentum-BPO.docx";
  fs.writeFileSync(out, buf);
  console.log("Wrote:", out, buf.length, "bytes");
});
