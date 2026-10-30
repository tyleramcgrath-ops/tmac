"use client";

// The phone version of the studio: once the doors open, phones get an app
// rather than a shrunken desktop. Five places, reached from a tab bar with
// the Compass raised in the middle:
// - Home: the Compass as a live hero, the headline, a stat readout and a
//   swipeable strip of featured sites. Tapping a site locks the Compass onto
//   it, says its name and opens it in the Work feed.
// - Work: every site as a full-screen card in a vertical swipe feed, with
//   filters, a position rail and a Visit button.
// - About: the dossier (portrait, stats, story, expertise you open).
// - Tools: the SEO tools and North Star HQ.
// - Connect: how to start a conversation.
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import EXPERTISE from "@/lib/expertise";
import { focus } from "@/lib/focus";
import type { Project } from "@/lib/projects";
import * as sfx from "@/lib/sound";
import tools, { hub, type Tool } from "@/lib/tools";
import type { CompassState } from "./Compass";

const Compass = dynamic(() => import("./Compass"), { ssr: false });

type Tab = "home" | "work" | "about" | "tools" | "connect";
const TAB_NAMES: Record<Tab, string> = {
  home: "The Studio",
  work: "Selected Work",
  about: "About Tyler",
  tools: "Tools",
  connect: "Let’s Connect",
};
const GROUPS = ["All", "Websites", "Lifestyle", "Platforms"] as const;
const MMG = "https://mcgrathmarketinggroup.com";

function aimAt(el: Element | null | undefined) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  focus.x = r.left + r.width / 2;
  focus.y = r.top + r.height / 2;
  focus.active = true;
}

export default function MobileShell({
  ordered,
  compassState,
  pulse,
  paused,
  reduced,
  voice,
  sound,
  onCompass,
  onVoice,
  onSound,
  say,
}: {
  ordered: Project[];
  compassState: CompassState;
  pulse: number;
  paused: boolean;
  reduced: boolean;
  voice: boolean;
  sound: boolean;
  onCompass: () => void;
  onVoice: () => void;
  onSound: () => void;
  say: (text: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("home");
  const [group, setGroup] = useState<(typeof GROUPS)[number]>("All");
  const [slide, setSlide] = useState(0);
  const [locked, setLocked] = useState<string | null>(null);
  const [openSkill, setOpenSkill] = useState<string | null>(null);
  const [openTool, setOpenTool] = useState<string | null>(null);
  const feed = useRef<HTMLDivElement>(null);
  const pane = useRef<HTMLDivElement>(null);
  const jumpTo = useRef<string | null>(null);
  // A site the Compass has just named; the feed doesn't say it again on arrival.
  const named = useRef<string | null>(null);
  const shown = ordered.filter((p) => group === "All" || p.group === group);

  function go(next: Tab, speak = true) {
    if (next === tab) {
      pane.current?.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      return;
    }
    sfx.tick(Object.keys(TAB_NAMES).indexOf(next));
    sfx.buzz(8);
    setTab(next);
    if (speak) say(TAB_NAMES[next]);
  }

  // Tap a featured site: the Compass locks onto it and says its name, then
  // the Work feed opens on that site.
  function openSite(p: Project, el: HTMLElement) {
    aimAt(el);
    setLocked(p.name);
    sfx.lock();
    sfx.buzz(10);
    say(p.name);
    named.current = p.name;
    jumpTo.current = p.domain;
    setTimeout(
      () => {
        focus.active = false;
        setLocked(null);
        setGroup("All");
        go("work", false);
      },
      reduced ? 0 : 700,
    );
  }

  // Land the Work feed on the site that was tapped, or at the top.
  useEffect(() => {
    if (tab !== "work") return;
    const el = feed.current;
    if (!el) return;
    const i = jumpTo.current ? Math.max(0, shown.findIndex((p) => p.domain === jumpTo.current)) : 0;
    jumpTo.current = null;
    el.scrollTo({ top: i * el.clientHeight });
    setSlide(i);
    // only when the tab or the filter changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, group]);

  // Which site is on screen in the feed: tick, buzz, and say its name once it
  // settles. Read through refs so re-renders don't rebind the listener.
  const shownRef = useRef(shown);
  const sayRef = useRef(say);
  shownRef.current = shown;
  sayRef.current = say;
  useEffect(() => {
    if (tab !== "work") return;
    const el = feed.current;
    if (!el) return;
    let t = 0;
    let last = Math.round(el.scrollTop / el.clientHeight);
    const onScroll = () => {
      const i = Math.round(el.scrollTop / el.clientHeight);
      if (i !== last) {
        sfx.tick(i % 6);
        sfx.buzz(6);
        last = i;
        setSlide(i);
      }
      clearTimeout(t);
      t = window.setTimeout(() => {
        const p = shownRef.current[i];
        if (p && p.name !== named.current) sayRef.current(p.name);
        named.current = null;
      }, 650);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(t);
    };
  }, [tab, group]);

  useEffect(() => () => void (focus.active = false), []);

  return (
    <div className="m-shell">
      <header className="m-top">
        <button className="m-brand" onClick={() => go("home")} aria-label="The Studio">
          <span className="m-mono">TM</span>
          <span>
            TYLER McGRATH
            <small>THE STUDIO</small>
          </span>
        </button>
        <div className="m-toggles">
          <button aria-pressed={voice} aria-label={voice ? "Mute the Compass voice" : "Turn on the Compass voice"} onClick={onVoice}>
            {voice ? "◖ Voice" : "◖ Off"}
          </button>
          <button aria-pressed={sound} aria-label={sound ? "Mute sound" : "Turn on sound"} onClick={onSound}>
            {sound ? "♪ Sound" : "♪ Off"}
          </button>
        </div>
      </header>

      {tab === "work" ? (
        <WorkFeed
          feedRef={feed}
          shown={shown}
          slide={slide}
          group={group}
          setGroup={(g) => {
            sfx.tick(1);
            setGroup(g);
          }}
          counts={Object.fromEntries(GROUPS.map((g) => [g, ordered.filter((p) => g === "All" || p.group === g).length]))}
        />
      ) : (
        <div className="m-pane" ref={pane} key={tab}>
          {tab === "home" && (
            <Home
              ordered={ordered}
              compass={<Compass state={compassState} paused={paused} pulseKey={pulse} />}
              locked={locked}
              onCompass={onCompass}
              openSite={openSite}
              go={go}
              setOpenSkill={setOpenSkill}
            />
          )}
          {tab === "about" && <About ordered={ordered} openSkill={openSkill} setOpenSkill={setOpenSkill} go={go} />}
          {tab === "tools" && <Tools openTool={openTool} setOpenTool={setOpenTool} />}
          {tab === "connect" && <Connect go={go} count={ordered.length} />}
        </div>
      )}

      <nav className="m-tabs" aria-label="Studio">
        <TabButton tab="work" cur={tab} go={go} icon="◈" label="Work" />
        <TabButton tab="about" cur={tab} go={go} icon="TM" label="About" />
        <button className={`m-tab-compass ${tab === "home" ? "on" : ""}`} onClick={() => go("home")} aria-label="Home: the Studio" aria-current={tab === "home" ? "page" : undefined}>
          <span className="m-tab-compass-ring" aria-hidden="true">
            <span className="m-tab-compass-needle" />
          </span>
        </button>
        <TabButton tab="tools" cur={tab} go={go} icon="✧" label="Tools" />
        <TabButton tab="connect" cur={tab} go={go} icon="↗" label="Connect" />
      </nav>
    </div>
  );
}

function TabButton({ tab, cur, go, icon, label }: { tab: Tab; cur: Tab; go: (t: Tab) => void; icon: string; label: string }) {
  return (
    <button className={`m-tab ${cur === tab ? "on" : ""}`} onClick={() => go(tab)} aria-current={cur === tab ? "page" : undefined}>
      <span className="m-tab-icon" aria-hidden="true">{icon}</span>
      <span className="m-tab-label">{label}</span>
    </button>
  );
}

function Home({
  ordered,
  compass,
  locked,
  onCompass,
  openSite,
  go,
  setOpenSkill,
}: {
  ordered: Project[];
  compass: ReactNode;
  locked: string | null;
  onCompass: () => void;
  openSite: (p: Project, el: HTMLElement) => void;
  go: (t: Tab) => void;
  setOpenSkill: (k: string) => void;
}) {
  const featured = ordered.filter((p) => p.image).slice(0, 8);
  return (
    <>
      <section className="m-hero">
        <button className="m-compass" onClick={onCompass} aria-label="Tap the Compass">
          <span className="m-compass-rings" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          {compass}
        </button>
        <div className={`m-locked ${locked ? "on" : ""}`} aria-live="polite">
          <span className="m-locked-tag">
            <b className="live-dot" /> LOCKED
          </span>
          <span className="m-locked-name">{locked ?? ""}</span>
        </div>
        <p className="m-kicker">SEO &amp; DIGITAL GROWTH LEADER</p>
        <h1 className="m-headline">
          Visibility. Strategy. <em>Digital growth.</em>
        </h1>
        <p className="m-lede">I’m Tyler McGrath. 14+ years turning digital presence into opportunities for growth.</p>
        <div className="m-stats">
          <div>
            <b>14+</b>
            <span>YEARS IN SEARCH</span>
          </div>
          <div>
            <b>{ordered.length}</b>
            <span>WEBSITES</span>
          </div>
          <div>
            <b>{tools.length}</b>
            <span>SEO TOOLS</span>
          </div>
        </div>
        <div className="m-actions">
          <button className="m-btn m-btn--primary" onClick={() => go("work")}>
            Explore the work <span>↗</span>
          </button>
          <button className="m-btn" onClick={() => go("about")}>
            Meet Tyler
          </button>
        </div>
      </section>

      <section className="m-section">
        <div className="m-section-head">
          <span>SELECTED WORK</span>
          <button onClick={() => go("work")}>All {ordered.length} →</button>
        </div>
        <div className="m-strip">
          {featured.map((p, i) => (
            <button key={p.domain} className="m-strip-card" style={{ "--i": i } as CSSProperties} onClick={(e) => openSite(p, e.currentTarget)}>
              <span className="m-strip-shot">
                <img src={p.image!} alt={`${p.name} homepage`} loading={i < 2 ? "eager" : "lazy"} draggable={false} />
                <span className="m-badge">№ {p.id}</span>
              </span>
              <span className="m-strip-cap">
                <small>{p.category}</small>
                <strong>{p.name}</strong>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="m-section">
        <div className="m-section-head">
          <span>WHAT I DO</span>
        </div>
        <div className="m-skills">
          {Object.entries(EXPERTISE).map(([k, e], i) => (
            <button
              key={k}
              className="m-skill"
              onClick={() => {
                setOpenSkill(k);
                go("about");
              }}
            >
              <span className="m-skill-n">0{i + 1}</span>
              <span>
                <strong>{e.title}</strong>
                <small>{e.lead}</small>
              </span>
              <span className="m-arrow">→</span>
            </button>
          ))}
        </div>
      </section>

      <section className="m-section m-cta">
        <p>Have a website, search visibility or growth project in mind?</p>
        <button className="m-btn m-btn--primary" onClick={() => go("connect")}>
          Let’s talk <span>↗</span>
        </button>
      </section>
    </>
  );
}

function WorkFeed({
  feedRef,
  shown,
  slide,
  group,
  setGroup,
  counts,
}: {
  feedRef: React.RefObject<HTMLDivElement | null>;
  shown: Project[];
  slide: number;
  group: string;
  setGroup: (g: (typeof GROUPS)[number]) => void;
  counts: Record<string, number>;
}) {
  return (
    <div className="m-work">
      <div className="m-filters" role="tablist" aria-label="Filter the work">
        {GROUPS.map((g) => (
          <button key={g} role="tab" aria-selected={group === g} className={group === g ? "on" : ""} onClick={() => setGroup(g)}>
            {g} <small>{counts[g]}</small>
          </button>
        ))}
      </div>
      <div className="m-rail" aria-hidden="true">
        <i style={{ height: `${((slide + 1) / Math.max(shown.length, 1)) * 100}%` }} />
      </div>
      <div className="m-count" aria-live="polite">
        {String(slide + 1).padStart(2, "0")} <span>/ {String(shown.length).padStart(2, "0")}</span>
      </div>
      <div className="m-feed" ref={feedRef}>
        {shown.map((p, i) => (
          <article key={p.domain} className={`m-slide ${i === slide ? "is-on" : ""}`}>
            <div className="m-slide-shot">
              {p.image ? (
                <>
                  <img className="m-slide-glow" src={p.image} alt="" aria-hidden="true" loading={i < 2 ? "eager" : "lazy"} draggable={false} />
                  <img className="m-slide-img" src={p.image} alt={`${p.name} homepage`} loading={i < 2 ? "eager" : "lazy"} draggable={false} />
                </>
              ) : (
                <span className="m-slide-type">{p.name}</span>
              )}
              <i className="hud-corners" aria-hidden="true" />
              <span className="m-badge">SIG·{p.id}</span>
            </div>
            <div className="m-slide-info">
              <small>{p.category}</small>
              <h2>{p.name}</h2>
              <p>{p.domain}</p>
              <a className="m-btn m-btn--primary" href={p.url} target="_blank" rel="noopener noreferrer" onClick={() => sfx.chime()}>
                Visit the website <span>↗</span>
              </a>
            </div>
            {i === 0 && shown.length > 1 && (
              <div className="m-swipe-hint" aria-hidden="true">
                <span>⌃</span>
                SWIPE UP
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function About({
  ordered,
  openSkill,
  setOpenSkill,
  go,
}: {
  ordered: Project[];
  openSkill: string | null;
  setOpenSkill: (k: string | null) => void;
  go: (t: Tab) => void;
}) {
  const skills = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (openSkill) skills.current?.scrollIntoView({ block: "start" });
    // only on arrival from the Home skills list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <section className="m-dossier">
        <span className="m-portrait">
          <img src="/art/tyler-portrait.png" alt="Tyler McGrath" />
          <i className="hud-corners" aria-hidden="true" />
          <span className="m-badge m-badge--bottom">ID · TYLER McGRATH</span>
        </span>
        <p className="m-kicker">TYLER McGRATH // DOSSIER</p>
        <h1 className="m-title">About Tyler</h1>
        <p className="m-lead">SEO &amp; Digital Growth Leader</p>
        <div className="m-stats">
          <div>
            <b>14+</b>
            <span>YEARS IN SEARCH</span>
          </div>
          <div>
            <b>{ordered.length}</b>
            <span>WEBSITES</span>
          </div>
          <div>
            <b>{tools.length}</b>
            <span>SEO TOOLS</span>
          </div>
        </div>
        <div className="m-prose">
          <p>I’m Tyler McGrath. I bring 14+ years of experience transforming digital presence into scalable revenue channels.</p>
          <p>
            My expertise spans SEO, Generative Engine Optimization (GEO), and Answer Engine Optimization (AEO)—positioning brands across traditional search and AI-driven platforms, including ChatGPT and
            Google AI Overviews.
          </p>
          <p>I connect technical SEO, content strategy, and data-driven execution to drive organic traffic, improve visibility, and generate high-quality leads.</p>
        </div>
      </section>
      <section className="m-section" ref={skills}>
        <div className="m-section-head">
          <span>EXPERTISE</span>
        </div>
        <div className="m-accordion">
          {Object.entries(EXPERTISE).map(([k, e], i) => {
            const on = openSkill === k;
            return (
              <div key={k} className={`m-acc ${on ? "on" : ""}`}>
                <button
                  aria-expanded={on}
                  onClick={() => {
                    sfx.tick(i);
                    setOpenSkill(on ? null : k);
                  }}
                >
                  <span className="m-skill-n">0{i + 1}</span>
                  <strong>{e.title}</strong>
                  <span className="m-acc-plus" aria-hidden="true">+</span>
                </button>
                <div className="m-acc-body">
                  <div>
                    <p className="m-lead">{e.lead}</p>
                    <p>{e.body}</p>
                    <ul>
                      {e.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="m-section m-cta">
        <button className="m-btn m-btn--primary" onClick={() => go("work")}>
          See the work <span>↗</span>
        </button>
        <button className="m-btn" onClick={() => go("connect")}>
          Start a conversation
        </button>
      </section>
    </>
  );
}

function ToolCard({ t, open, toggle, hubCard }: { t: Tool; open: boolean; toggle: () => void; hubCard?: boolean }) {
  return (
    <div className={`m-tool ${open ? "on" : ""} ${hubCard ? "m-tool--hub" : ""}`}>
      <button className="m-tool-head" onClick={toggle} aria-expanded={open}>
        <span className="m-tool-sym" aria-hidden="true">{t.symbol}</span>
        <span>
          <small>
            <b className={`live-dot ${t.status === "live" ? "" : "is-offline"}`} /> {t.status === "live" ? "ONLINE" : "BACK SOON"} · {t.label}
          </small>
          <strong>{t.name}</strong>
          <em>{t.tagline}</em>
        </span>
      </button>
      <div className="m-acc-body">
        <div>
          <p className="m-lead">{t.lead}</p>
          <p>{t.body}</p>
          <ul>
            {t.list.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {t.status === "live" ? (
            <a className="m-btn m-btn--primary" href={t.url} target="_blank" rel="noopener noreferrer">
              Open {t.name} <span>↗</span>
            </a>
          ) : (
            <p className="m-note">
              <b className="live-dot is-offline" /> {t.name} is offline for maintenance and back soon.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Tools({ openTool, setOpenTool }: { openTool: string | null; setOpenTool: (k: string | null) => void }) {
  const toggle = (k: string) => {
    sfx.tick(1);
    setOpenTool(openTool === k ? null : k);
  };
  return (
    <>
      <section className="m-section m-page-head">
        <p className="m-kicker">NORTH STAR HQ</p>
        <h1 className="m-title">The tools I build</h1>
        <p className="m-lede">SEO tools that do the work, around the Compass.</p>
      </section>
      <section className="m-section">
        <ToolCard t={hub} open={openTool === hub.key} toggle={() => toggle(hub.key)} hubCard />
        {tools.map((t) => (
          <ToolCard key={t.key} t={t} open={openTool === t.key} toggle={() => toggle(t.key)} />
        ))}
      </section>
    </>
  );
}

function Connect({ go, count }: { go: (t: Tab) => void; count: number }) {
  return (
    <section className="m-section m-connect">
      <span className="m-connect-orb" aria-hidden="true" />
      <p className="m-kicker">OPEN CHANNEL</p>
      <h1 className="m-title">
        Let’s find your <em>next direction.</em>
      </h1>
      <p className="m-lede">Have a website, search visibility, or digital growth project in mind? Tell me what you’re building and where you want to go.</p>
      <a className="m-btn m-btn--primary m-btn--big" href={MMG} target="_blank" rel="noopener noreferrer" onClick={() => sfx.chime()}>
        Connect through McGrath Marketing Group <span>↗</span>
      </a>
      <button className="m-btn" onClick={() => go("work")}>
        Explore all {count} websites
      </button>
    </section>
  );
}
