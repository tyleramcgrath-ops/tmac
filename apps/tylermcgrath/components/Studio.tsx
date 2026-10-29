"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { enableTilt, tilt } from "@/lib/motion";
import * as sfx from "@/lib/sound";
import projects, { type Project } from "@/lib/projects";
import tools, { hub } from "@/lib/tools";
import type { CompassState } from "./Compass";
import OrbitField, { type OrbitItem } from "./OrbitField";

const Compass = dynamic(() => import("./Compass"), { ssr: false });

// Pinned to the front of Selected Work.
const FEATURED = ["prescriptivepoolservice.com", "saysites.com", "tamarindomarketing.com", "esenciascr.com", "wehaverehabs.com"];
const ordered: Project[] = [
  ...FEATURED.map((d) => projects.find((p) => p.domain === d)!),
  ...projects.filter((p) => !FEATURED.includes(p.domain)),
];

const SERVICES = [
  { key: "about", title: "About Tyler", label: "THE PERSON BEHIND THE WORK", symbol: "TM", copy: "14+ years in search and digital growth." },
  { key: "marketing", title: "Marketing & SEO", label: "STRATEGY · SEARCH · AI", symbol: "◎", copy: "SEO, GEO, AEO and digital growth." },
  { key: "work", title: "Selected Work", label: `${projects.length} DIGITAL DESTINATIONS`, symbol: "◈", copy: "Explore websites across industries." },
  { key: "tools", title: "North Star HQ", label: `HQ · ${tools.length} SEO TOOLS`, symbol: "✧", copy: "The SEO tools I build, around the Compass." },
  { key: "contact", title: "Let’s Connect", label: "YOUR NEXT DIRECTION", symbol: "↗", copy: "Start a conversation about your business." },
];

const CYCLE: CompassState[] = ["idle", "thinking", "planning", "executing", "success"];
const CYCLE_LINES: Partial<Record<CompassState, string>> = {
  idle: "North Star ready.",
  thinking: "Mapping possibilities.",
  planning: "Plotting a course.",
  executing: "Energy in motion.",
  success: "Direction found.",
};

// Dust caught in the ceiling light; fixed positions so server and client match.
const MOTES = Array.from({ length: 34 }, (_, i) => ({
  left: 30 + ((i * 37) % 40),
  top: 18 + ((i * 53) % 55),
  size: 1 + ((i * 7) % 3),
  delay: (i * 0.73) % 9,
  dur: 9 + ((i * 5) % 8),
}));

// Glints across the constellation ceiling once its lights are on.
const GLINTS = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 41 + 7) % 100,
  top: (i * 29 + 11) % 90,
  delay: ((i * 0.37) % 1.6).toFixed(2),
}));

type Panel = "about" | "seo" | "marketing" | "design" | "contact" | "index" | number | `tool:${string}`;

const MMG = "https://mcgrathmarketinggroup.com";

export default function Studio() {
  const [arrived, setArrived] = useState(false);
  const [entered, setEntered] = useState(false);
  const [opening, setOpening] = useState(false);
  const [awake, setAwake] = useState(false);
  const [waking, setWaking] = useState(false);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState("All");
  const [hovering, setHovering] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [roomLoaded, setRoomLoaded] = useState(false);
  const [mode, setMode] = useState<"studio" | "work" | "tools">("studio");
  const [cycle, setCycle] = useState<CompassState>("idle");
  const [voice, setVoice] = useState(true);
  const [sound, setSound] = useState(true);
  const [pulse, setPulse] = useState(0);
  const room = useRef<HTMLDivElement>(null);
  const torch = useRef<HTMLDivElement>(null);
  const ripples = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<Element | null>(null);

  const perPage = 4;
  const shown = ordered.filter((p) => filter === "All" || p.group === filter);
  const pages = Math.ceil(shown.length / perPage);
  const slice = shown.slice((page % pages) * perPage, (page % pages) * perPage + perPage);
  const project = typeof panel === "number" ? projects[panel] : null;
  const tool = typeof panel === "string" && panel.startsWith("tool:") ? [...tools, hub].find((t) => `tool:${t.key}` === panel) ?? null : null;

  function open(p: Panel) {
    returnFocus.current = document.activeElement;
    sfx.chime();
    setPanel(p);
  }
  function close() {
    setPanel(null);
    requestAnimationFrame(() => (returnFocus.current as HTMLElement | null)?.focus());
  }
  function say(text: string) {
    if (!voice || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.88;
    u.pitch = 0.86;
    u.volume = 0.9;
    window.speechSynthesis.speak(u);
  }
  function directCompass() {
    // In North Star HQ the Compass is the HQ itself.
    if (mode === "tools" && awake) {
      open(`tool:${hub.key}`);
      return;
    }
    setPulse((p) => p + 1);
    sfx.buzz(14);
    setCycle((c) => {
      const next = CYCLE[(CYCLE.indexOf(c) + 1) % CYCLE.length];
      sfx.compass(CYCLE.indexOf(next));
      say(CYCLE_LINES[next]!);
      return next;
    });
  }
  function enter() {
    if (opening) return;
    setOpening(true);
    setEntered(true);
    // Audio and tilt both need this tap to unlock on phones.
    sfx.unlock();
    enableTilt();
    sfx.doors();
    if (!reduced) sfx.lights();
    sfx.ambience(reduced ? 0.2 : 3);
    say("Welcome to Tyler McGrath's portfolio. The studio is open. Click the Compass to find a direction.");
    setTimeout(() => {
      setArrived(true);
      setOpening(false);
    }, reduced ? 0 : 2200);
  }
  function awaken() {
    setAwake(true);
    setWaking(true);
    setCycle("idle");
    setPulse((p) => p + 1);
    sfx.awaken();
    sfx.buzz(20);
    say("The Compass is awake. Choose a direction.");
  }

  useEffect(() => {
    const rm = matchMedia("(prefers-reduced-motion: reduce)");
    const sm = matchMedia("(max-width: 760px)");
    const sync = () => {
      setReduced(rm.matches);
      setPage(0);
    };
    sync();
    rm.addEventListener("change", sync);
    sm.addEventListener("change", sync);
    return () => {
      rm.removeEventListener("change", sync);
      sm.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!waking) return;
    const t = setTimeout(() => setWaking(false), reduced ? 0 : 1500);
    return () => clearTimeout(t);
  }, [waking, reduced]);

  // Room parallax and the light that follows you, eased every frame.
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let tx = 0, ty = 0, x = 0, y = 0;
    let lx = -1, ly = -1, cx = innerWidth / 2, cy = innerHeight * 0.6;
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      tx = (e.clientX / innerWidth - 0.5) * 2;
      ty = (e.clientY / innerHeight - 0.5) * 2;
      lx = e.clientX;
      ly = e.clientY;
    };
    const tick = () => {
      if (!paused) {
        // No mouse on a phone: the room leans with the phone instead.
        if (tilt.has && lx === -1) {
          tx = tilt.x;
          ty = tilt.y;
        }
        x += (tx - x) * 0.05;
        y += (ty - y) * 0.05;
        if (lx !== -1) {
          cx += (lx - cx) * 0.12;
          cy += (ly - cy) * 0.12;
        }
        room.current?.style.setProperty("--px", x.toFixed(4));
        room.current?.style.setProperty("--py", y.toFixed(4));
        torch.current?.style.setProperty("transform", `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`);
      }
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
    };
  }, [reduced, paused]);

  useEffect(() => {
    if (panel === null) return;
    closeBtn.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
      if (e.key === "Tab") {
        const els = Array.from(dialog.current?.querySelectorAll<HTMLElement>("button,a") ?? []).filter((el) => el.offsetParent !== null);
        if (e.shiftKey && document.activeElement === els[0]) {
          e.preventDefault();
          els.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === els.at(-1)) {
          e.preventDefault();
          els[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
    // close() only touches state setters and refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (panel !== null || !awake) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setPage((p) => (p + 1) % pages);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPage((p) => (p + pages - 1) % pages);
      }
      if (e.key === "Escape") setAwake(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [awake, panel, pages]);

  const compassState: CompassState = awake ? (waking ? "wake" : hovering ? "hover" : cycle) : "sleep";

  const serviceItems: OrbitItem[] = SERVICES.map((s) => ({
    key: s.key,
    className: "service-card",
    onClick: () => {
      if (s.key === "work" || s.key === "tools") {
        sfx.chime();
        setMode(s.key);
        setPage(0);
      } else open(s.key as Panel);
    },
    content: (
      <>
        <span className="card-top">
          <b className="live-dot" /> {s.label}
        </span>
        <span className="card-emblem"><span>{s.symbol}</span></span>
        <span className="card-caption">
          <span>
            <strong>{s.title}</strong>
            <small>{s.copy}</small>
          </span>
          <span className="card-arrow">↗</span>
        </span>
      </>
    ),
  }));

  const workItems: OrbitItem[] = slice.map((p) => ({
    key: p.domain,
    className: "work-card",
    ariaLabel: `Explore ${p.name}`,
    onClick: () => open(projects.indexOf(p)),
    content: (
      <>
        <span className="card-top">
          <span>SIGNAL {p.id}</span>
          <i />
          <span>↗</span>
        </span>
        <span className="card-screen">
          {p.image ? <img src={p.image} alt={`${p.name} homepage`} draggable={false} /> : <span className="type-cover">{p.name}</span>}
        </span>
        <span className="card-caption">
          <span>
            <small>{p.category}</small>
            <strong>{p.name}</strong>
          </span>
          <span className="card-arrow">↗</span>
        </span>
      </>
    ),
  }));

  const toolItems: OrbitItem[] = tools.map((t) => ({
    key: t.key,
    className: "service-card tool-card",
    ariaLabel: `${t.name}: ${t.tagline}`,
    onClick: () => open(`tool:${t.key}`),
    content: (
      <>
        <span className="card-top">
          <b className={`live-dot ${t.status === "live" ? "" : "is-offline"}`} /> {t.label}
        </span>
        <span className="card-emblem"><span>{t.symbol}</span></span>
        <span className="card-caption">
          <span>
            <strong>{t.name}</strong>
            <small>{t.tagline}</small>
          </span>
          <span className="card-arrow">↗</span>
        </span>
      </>
    ),
  }));

  function openTools() {
    sfx.chime();
    setAwake(true);
    setMode("tools");
    setPage(0);
  }

  return (
    <main
      onPointerDown={(e) => {
        // On a phone, a tap sends light through the room where you touched.
        if (e.pointerType !== "touch" || reduced || !ripples.current) return;
        const r = document.createElement("i");
        r.style.left = `${e.clientX}px`;
        r.style.top = `${e.clientY}px`;
        r.addEventListener("animationend", () => r.remove());
        ripples.current.append(r);
      }}
      className={`studio ${entered ? "entered" : ""} ${arrived ? "arrived" : ""} ${opening ? "door-opening" : ""} ${awake ? "awakened" : "resting"} ${waking ? "waking" : ""} ${roomLoaded ? "room-loaded" : ""} ${reduced ? "reduced" : ""} compass-${compassState}`}
    >
      <div className="studio-content" inert={!arrived}>
        <div className="office-environment" ref={room}>
          <img
            className="office-plate"
            src="/art/studio-office.webp"
            alt="A black marble studio with a constellation ceiling, brass details, panoramic windows and a circular command desk"
            onLoad={() => setRoomLoaded(true)}
            draggable={false}
          />
          {/* Sensor lights: each zone clicks on as you walk in */}
          <div className="room-lights" aria-hidden="true">
            <i className="zone zone-floor" />
            <i className="zone zone-pillar-l" />
            <i className="zone zone-pillar-r" />
            <i className="zone zone-ceiling" />
            <i className="zone zone-full" />
            <i className="zone zone-desk" />
            <span className="glints">
              {GLINTS.map((g, i) => (
                <b key={i} style={{ left: `${g.left}%`, top: `${g.top}%`, "--d": `${g.delay}s` } as CSSProperties} />
              ))}
            </span>
            <i className="beam beam-a" />
            <i className="beam beam-b" />
            <i className="beam beam-c" />
            <span className="motes">
              {MOTES.map((m, i) => (
                <b key={i} style={{ left: `${m.left}%`, top: `${m.top}%`, width: m.size, height: m.size, animationDelay: `${m.delay}s`, animationDuration: `${m.dur}s` }} />
              ))}
            </span>
          </div>
          <div className="office-shade" />
          <div className="desk-energy" />
          <div className="ceiling-response" />
        </div>
        <div className="room-torch" ref={torch} aria-hidden="true" />
        <div className="touch-lights" ref={ripples} aria-hidden="true" />

        <header className="studio-header">
          <div className="studio-location">
            <i /> INDEPENDENT CREATIVE<span>WEB DESIGN · MARKETING · SEO</span>
          </div>
          <button
            className="studio-brand"
            onClick={() => {
              setAwake(false);
              setPanel(null);
            }}
          >
            TYLER McGRATH<small>THE STUDIO</small>
          </button>
          <nav aria-label="Main navigation">
            <button onClick={() => open("about")}>About</button>
            <button onClick={() => open("seo")}>SEO &amp; AI Search</button>
            <button onClick={() => open("marketing")}>Marketing</button>
            <button onClick={() => open("index")}>
              The portfolio <sup>{projects.length}</sup>
            </button>
            <a href={MMG} target="_blank" rel="noopener noreferrer">
              Connect ↗
            </a>
          </nav>
        </header>

        <div className="studio-intro">
          <span className="studio-eyebrow">SEO &amp; DIGITAL GROWTH LEADER</span>
          <h1>
            Visibility.
            <br />
            Strategy.
            <br />
            <em>Digital growth.</em>
          </h1>
          <p>I’m Tyler McGrath. 14+ years turning digital presence into opportunities for growth.</p>
          <div className="intro-actions">
            <button onClick={() => open("about")}>Meet Tyler ↗</button>
            <button onClick={() => open("design")}>What I do ↗</button>
          </div>
        </div>

        <div
          className="compass-mount"
          onPointerEnter={() => setHovering(true)}
          onPointerLeave={() => setHovering(false)}
          onClick={directCompass}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              directCompass();
            }
          }}
          role="button"
          tabIndex={awake ? 0 : -1}
          aria-label="Direct the Compass. Click to change its state."
        >
          <Compass state={compassState} paused={paused || reduced || !arrived} pulseKey={pulse} />
        </div>

        {!awake && (
          <button className="activate-compass" onClick={awaken}>
            <span className="activation-symbol">✧</span>
            <span>
              AWAKEN THE COMPASS<small>Open a world of work</small>
            </span>
            <i>↑</i>
          </button>
        )}

        <div className="desk-inscription" aria-hidden="true">
          TYLER McGRATH <span>✧</span> CREATIVE DIRECTION
        </div>

        {awake && (
          <>
            <div className="collection-heading">
              <span className="studio-eyebrow">{waking ? "COMPASS AWAKENING" : mode === "studio" ? "WELCOME TO MY STUDIO" : mode === "tools" ? "NORTH STAR HQ" : "THE PORTFOLIO IS OPEN"}</span>
              <p>{mode === "studio" ? "Meet Tyler. Find your next direction." : mode === "tools" ? "The tools around the Compass. Click the Compass for HQ." : "Select a signal. Explore the work."}</p>
            </div>

            <OrbitField
              key={`${mode}-${filter}-${page}-${perPage}`}
              items={mode === "studio" ? serviceItems : mode === "tools" ? toolItems : workItems}
              reduced={reduced}
              onHover={setHovering}
            />

            <div className="portfolio-console">
              <div className="console-filters">
                <button
                  aria-pressed={mode === "studio"}
                  onClick={() => {
                    setMode("studio");
                    setPage(0);
                  }}
                >
                  ← Studio
                </button>
                {mode === "work" ? (
                  ["All", "Websites", "Lifestyle", "Platforms"].map((f) => (
                    <button
                      key={f}
                      aria-pressed={filter === f}
                      onClick={() => {
                        setFilter(f);
                        setPage(0);
                      }}
                    >
                      {f}
                    </button>
                  ))
                ) : mode === "tools" ? (
                  <>
                    <button onClick={() => open(`tool:${hub.key}`)}>About HQ</button>
                    <button onClick={() => { sfx.chime(); setMode("work"); setPage(0); }}>Selected Work</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => open("seo")}>SEO / GEO / AEO</button>
                    <button onClick={() => open("design")}>Web Design</button>
                    <button onClick={openTools}>North Star HQ</button>
                  </>
                )}
              </div>
              {mode === "work" && (
                <div className="console-pager">
                  <button aria-label="Previous signals" onClick={() => setPage((p) => (p + pages - 1) % pages)}>
                    ←
                  </button>
                  <span>
                    {`${(page % pages) * perPage + 1}—${Math.min(((page % pages) + 1) * perPage, shown.length)} / ${shown.length}`}
                  </span>
                  <button aria-label="Next signals" onClick={() => setPage((p) => (p + 1) % pages)}>
                    →
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        <footer className="studio-footer">
          <span>
            <i /> {awake ? "EXPLORING THE COLLECTION" : "THE ROOM IS YOURS"}
          </span>
          <div>
            {awake && <button onClick={() => setAwake(false)}>↓ Lower Compass</button>}
            <button
              aria-label={voice ? "Mute studio narration" : "Enable studio narration"}
              aria-pressed={voice}
              onClick={() => {
                if (voice) window.speechSynthesis.cancel();
                setVoice(!voice);
              }}
            >
              {voice ? "◖ Voice" : "◖ Voice off"}
            </button>
            <button
              aria-label={sound ? "Mute studio sound" : "Enable studio sound"}
              aria-pressed={sound}
              onClick={() => {
                sfx.unlock();
                sfx.setSound(!sound);
                setSound(!sound);
              }}
            >
              {sound ? "♪ Sound" : "♪ Sound off"}
            </button>
            <button aria-label={paused ? "Resume Compass motion" : "Pause Compass motion"} aria-pressed={paused} onClick={() => setPaused(!paused)}>
              {paused ? "▷ Resume" : "Ⅱ Pause"}
            </button>
            <span>© {new Date().getFullYear()} TYLER McGRATH</span>
          </div>
        </footer>

        {panel !== null && (
          <div className="studio-backdrop" onClick={(e) => e.target === e.currentTarget && close()}>
            <div className="studio-dialog" role="dialog" aria-modal="true" aria-labelledby="studio-dialog-title" ref={dialog}>
              <div className="studio-dialog-top">
                <span>THE STUDIO / PORTFOLIO</span>
                <button ref={closeBtn} aria-label="Close portfolio panel" onClick={close}>
                  ×
                </button>
              </div>
              {tool ? (
                <>
                  <span className="studio-eyebrow">NORTH STAR HQ / {tool.label}</span>
                  <h2 id="studio-dialog-title">{tool.name}</h2>
                  <p className="dialog-domain">{tool.home}</p>
                  <div className="expertise-detail">
                    <p className="bio-lead">{tool.lead}</p>
                    <p>{tool.body}</p>
                    <div className="expertise-list">
                      {tool.list.map((item, i) => (
                        <div key={item}>
                          <span>0{i + 1}</span>
                          <h3>{item}</h3>
                        </div>
                      ))}
                    </div>
                  </div>
                  {tool.status === "live" ? (
                    <a className="studio-visit" href={tool.url} target="_blank" rel="noopener noreferrer">
                      Open {tool.name} <span>↗</span>
                    </a>
                  ) : (
                    <p className="tool-offline">
                      <b className="live-dot is-offline" /> {tool.name} is offline for maintenance and back soon.
                    </p>
                  )}
                  <div className="project-switch">
                    {tool === hub ? (
                      tools.map((t) => (
                        <button key={t.key} onClick={() => setPanel(`tool:${t.key}`)}>{t.name} →</button>
                      ))
                    ) : (
                      <>
                        <button onClick={() => setPanel(`tool:${tools[(tools.indexOf(tool) + tools.length - 1) % tools.length].key}`)}>← Previous tool</button>
                        <button onClick={() => setPanel(`tool:${tools[(tools.indexOf(tool) + 1) % tools.length].key}`)}>Next tool →</button>
                      </>
                    )}
                  </div>
                </>
              ) : typeof panel === "string" && panel !== "index" ? (
                <Expertise panel={panel} setPanel={setPanel} exploreWork={() => {
                  setMode("work");
                  setPage(0);
                  setAwake(true);
                  close();
                }} />
              ) : project ? (
                <>
                  <span className="studio-eyebrow">
                    SIGNAL {project.id} / {project.category}
                  </span>
                  <h2 id="studio-dialog-title">{project.name}</h2>
                  <p className="dialog-domain">{project.domain}</p>
                  <div className="studio-project-image">
                    {project.image ? <img src={project.image} alt={`${project.name} website preview`} /> : <span>{project.name}</span>}
                  </div>
                  <a className="studio-visit" href={project.url} target="_blank" rel="noopener noreferrer">
                    Visit the website <span>↗</span>
                  </a>
                  <div className="project-switch">
                    <button onClick={() => setPanel((Number(panel) + projects.length - 1) % projects.length)}>← Previous site</button>
                    <button onClick={() => setPanel((Number(panel) + 1) % projects.length)}>Next site →</button>
                  </div>
                </>
              ) : (
                <>
                  <span className="studio-eyebrow">{projects.length} DIGITAL DESTINATIONS</span>
                  <h2 id="studio-dialog-title">
                    The work.
                    <br />
                    <em>All directions.</em>
                  </h2>
                  <div className="studio-index">
                    {projects.map((p, i) => (
                      <button key={p.domain} onClick={() => setPanel(i)}>
                        <span>{p.id}</span>
                        <div>
                          <strong>{p.name}</strong>
                          <small>{p.category}</small>
                        </div>
                        <span>↗</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {!arrived && (
        <div className={`studio-entrance ${opening ? "opening" : ""}`} role="dialog" aria-modal="true" aria-labelledby="entrance-title">
          <div className="entrance-architecture" />
          <div className="door-leaf door-left" />
          <div className="door-leaf door-right" />
          <div className="door-seam" />
          <div className="entrance-nameplate">
            <h2 id="entrance-title" className="entrance-accessible-name">
              McGrath Private Studio
            </h2>
            <p>Welcome to the studio.</p>
            <button onClick={enter} disabled={opening}>
              {opening ? "WELCOME INSIDE" : "ENTER THE STUDIO"}
              <span>↗</span>
            </button>
          </div>
          <div className="entrance-footer">
            <span>TYLER McGRATH</span>
            <span>{opening ? "OPENING YOUR NEXT PERSPECTIVE" : "THE NEXT GREAT IDEA STARTS HERE"}</span>
          </div>
        </div>
      )}
    </main>
  );
}

const EXPERTISE: Record<string, { title: string; lead: string; body: string; list: string[] }> = {
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

function Expertise({ panel, setPanel, exploreWork }: { panel: string; setPanel: (p: Panel) => void; exploreWork: () => void }) {
  const e = EXPERTISE[panel];
  return (
    <>
      <span className="studio-eyebrow">TYLER McGRATH / {panel === "about" ? "ABOUT" : "EXPERTISE"}</span>
      <h2 id="studio-dialog-title">{panel === "about" ? "About Tyler" : panel === "contact" ? "Let’s Connect" : e.title}</h2>
      {panel === "contact" ? (
        <div className="expertise-detail">
          <p className="bio-lead">Let’s find your next direction.</p>
          <p>Have a website, search visibility, or digital growth project in mind? Tell me what you’re building and where you want to go.</p>
          <a className="studio-visit" href={MMG} target="_blank" rel="noopener noreferrer">
            Connect through McGrath Marketing Group ↗
          </a>
        </div>
      ) : panel === "about" ? (
        <div className="about-editorial">
          <img className="tyler-portrait" src="/art/tyler-portrait.png" alt="Tyler McGrath" />
          <p className="bio-lead">SEO &amp; Digital Growth Leader</p>
          <p>I’m Tyler McGrath. I bring 14+ years of experience transforming digital presence into scalable revenue channels.</p>
          <p>
            My expertise spans SEO, Generative Engine Optimization (GEO), and Answer Engine Optimization (AEO)—positioning brands across traditional search and AI-driven platforms, including ChatGPT and
            Google AI Overviews.
          </p>
          <p>I connect technical SEO, content strategy, and data-driven execution to drive organic traffic, improve visibility, and generate high-quality leads.</p>
          <div className="expertise-tags">
            <span>14+ years of experience</span>
            <span>Search &amp; AI visibility</span>
            <span>Strategy to execution</span>
          </div>
        </div>
      ) : (
        <div className="expertise-detail">
          <p className="bio-lead">{e.lead}</p>
          <p>{e.body}</p>
          <div className="expertise-list">
            {e.list.map((item, i) => (
              <div key={item}>
                <span>0{i + 1}</span>
                <h3>{item}</h3>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="expertise-navigation">
        <button onClick={() => setPanel("about")}>About Tyler</button>
        <button onClick={() => setPanel("design")}>Web Design</button>
        <button onClick={() => setPanel("seo")}>SEO / GEO / AEO</button>
        <button onClick={() => setPanel("marketing")}>Marketing</button>
      </div>
      <button className="studio-visit" onClick={exploreWork}>
        Explore the website collection <span>↗</span>
      </button>
      <a className="contact-direction" href={MMG} target="_blank" rel="noopener noreferrer">
        Let’s talk about your next direction ↗
      </a>
    </>
  );
}

