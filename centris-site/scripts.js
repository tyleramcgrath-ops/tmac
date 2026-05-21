// Scroll reveals
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Array.from(e.target.parentNode.children).indexOf(e.target);
            const delay = Math.min(idx, 8) * 60;
            setTimeout(() => e.target.classList.add("in"), delay);
            io.unobserve(e.target);
          }
        });
      }, { rootMargin: "-60px 0px -60px 0px", threshold: 0.04 });
      document.querySelectorAll(".ir").forEach((el) => io.observe(el));

      // INTERACTIVE SOPHIA DEMO
      const SCENARIOS = {
        insurance: {
          title: "Insurance Claim",
          lines: [
            { t: 0, kind: "cust", role: "caller", text: "I called twice last week. Nobody got back to me." },
            { t: 1500, kind: "note", text: "tone · frustrated · 2 prior contacts" },
            { t: 2800, kind: "ai", role: "sophia", text: "Acknowledge the wait. Offer expedited review with a hard timeline." },
            { t: 4400, kind: "agent", role: "agent", text: "I hear you — two weeks is too long. Let me mark this expedited, 48 hours." },
            { t: 6200, kind: "es cust", role: "caller · es", text: "cliente — gracias, eso me ayuda mucho." },
            { t: 7800, kind: "note", text: "sentiment shift · −0.4 → +0.3 · language es-MX" },
            { t: 9200, kind: "agent", role: "agent", text: "I'll send the confirmation in Spanish too. You'll have it by 5pm." },
            { t: 10800, kind: "crm", text: "CRM logged · expedited · es-MX preference set" }
          ],
          sentiment: [-0.4, -0.4, -0.3, -0.1, 0.1, 0.2, 0.3, 0.3],
          finalSignals: { lang: "es-MX", qa: 97 },
          suggest: { head: "Recommended next line · conf 0.94", text: '"And while we wait, I can connect you with your assigned adjuster for any other questions — would that help?"' }
        },
        healthcare: {
          title: "Healthcare Inquiry",
          lines: [
            { t: 0, kind: "cust", role: "patient", text: "I need to reschedule my appointment for next week." },
            { t: 1400, kind: "note", text: "tone · calm · returning patient · 4 prior visits" },
            { t: 2600, kind: "ai", role: "sophia", text: "Pull provider calendar. Offer 3 next-available slots, prioritize morning." },
            { t: 4000, kind: "agent", role: "agent", text: "Of course. I have Tuesday at 10am, Wednesday at 2pm, or Thursday at 9am." },
            { t: 5600, kind: "cust", role: "patient", text: "Tuesday at 10am works for me." },
            { t: 6800, kind: "ai", role: "sophia", text: "Confirm slot. Send SMS reminder 24h prior with parking info." },
            { t: 8400, kind: "agent", role: "agent", text: "Tuesday 10am confirmed. I'll text you a reminder Monday with parking details." },
            { t: 10200, kind: "crm", text: "Appointment rescheduled · SMS scheduled · HIPAA-logged" }
          ],
          sentiment: [0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55],
          finalSignals: { lang: "en-US", qa: 98 },
          suggest: { head: "Follow-up suggestion · conf 0.91", text: '"While you\'re on, would you like to schedule your annual lab work for the same morning? Saves you a second trip."' }
        },
        billing: {
          title: "Billing Dispute",
          lines: [
            { t: 0, kind: "cust", role: "caller", text: "There's a charge on my bill I don't recognize." },
            { t: 1500, kind: "note", text: "tone · concerned · first contact this cycle" },
            { t: 2800, kind: "ai", role: "sophia", text: "Pull last 90-day statement. Match against subscription renewals." },
            { t: 4200, kind: "agent", role: "agent", text: "Let me pull up your statement. Which date is the charge from?" },
            { t: 5800, kind: "cust", role: "caller", text: "March 14th, for $89.99." },
            { t: 7000, kind: "ai", role: "sophia", text: "Match found · auto-renewal · premium plan. Offer cancellation + same-day refund." },
            { t: 8600, kind: "agent", role: "agent", text: "I see it — that's an auto-renewal for premium. I can cancel it and refund you today." },
            { t: 10200, kind: "note", text: "resolution path · 0 escalations · refund authorized" },
            { t: 11600, kind: "crm", text: "Refund $89.99 issued · auto-renewal cancelled · customer notified" }
          ],
          sentiment: [-0.1, -0.1, 0.0, 0.1, 0.15, 0.25, 0.4, 0.5, 0.55],
          finalSignals: { lang: "en-US", qa: 96 },
          suggest: { head: "Recommended next line · conf 0.92", text: '"Want me to also turn off auto-renew on your other plans, or just this one?"' }
        },
        sales: {
          title: "Inbound Sales",
          lines: [
            { t: 0, kind: "cust", role: "caller", text: "I'm comparing your premium plan against a competitor." },
            { t: 1500, kind: "note", text: "intent · evaluating · price-sensitive signals detected" },
            { t: 2800, kind: "ai", role: "sophia", text: "Surface premium-tier value props. Mention 14-day guarantee. Hold discount until objection #2." },
            { t: 4400, kind: "agent", role: "agent", text: "Happy to walk through what makes our plan different — what features matter most to you?" },
            { t: 6200, kind: "cust", role: "caller", text: "Mostly the bilingual support and reporting. The other quote was 12% less." },
            { t: 7600, kind: "ai", role: "sophia", text: "Objection · price. Authorized: 10% loyalty discount + free onboarding ($1.2k value)." },
            { t: 9200, kind: "agent", role: "agent", text: "I can match that within 2% and include free onboarding — about $1,200 in value on day one." },
            { t: 10800, kind: "note", text: "close probability · 0.74 → 0.86" },
            { t: 12200, kind: "crm", text: "Deal advanced · proposal sent · CSM tagged" }
          ],
          sentiment: [0.1, 0.15, 0.2, 0.2, 0.05, 0.25, 0.4, 0.5, 0.55],
          finalSignals: { lang: "en-US", qa: 95 },
          suggest: { head: "Closing suggestion · conf 0.88", text: '"If we get the paperwork started today, I can have your first bilingual queue live by Friday — interested?"' }
        }
      };

      const demo = (() => {
        let currentKey = "insurance", timers = [], timerId = null, playing = false;
        const $ = (id) => document.getElementById(id);
        const wave = $("demoWave"), liveDot = $("demoLiveDot");

        function clearAll() {
          timers.forEach((t) => clearTimeout(t));
          timers = [];
          if (timerId) { clearInterval(timerId); timerId = null; }
          playing = false;
        }
        function resetUI() {
          $("demoConvo").innerHTML = '<div class="dt-empty" id="demoEmpty">Press play to start the call simulation →</div>';
          $("demoTimer").textContent = "00:00";
          $("demoStatus").textContent = "idle";
          liveDot.style.opacity = "0.3";
          wave.classList.remove("active");
          $("demoSent").textContent = "0.0";
          $("demoSent").classList.remove("up");
          $("demoSentMeter").style.width = "50%";
          $("demoLang").textContent = "—";
          $("demoQa").textContent = "—";
          $("demoQaMeter").style.width = "0%";
          $("demoSparkLine").setAttribute("d", "");
          $("demoSparkFill").setAttribute("d", "");
          $("demoSuggestRow").hidden = true;
          $("demoPlayLabel").textContent = "Play call";
          $("demoHint").textContent = "Press play to begin.";
        }
        function fmtTime(s) {
          const m = Math.floor(s / 60).toString().padStart(2, "0");
          const sec = Math.floor(s % 60).toString().padStart(2, "0");
          return m + ":" + sec;
        }
        function setScenario(key) {
          if (key === currentKey) return;
          currentKey = key;
          document.querySelectorAll(".dash-tab").forEach((t) => {
            t.classList.toggle("active", t.dataset.scenario === key);
          });
          $("demoCallTitle").textContent = SCENARIOS[key].title;
          clearAll();
          resetUI();
        }
        function addMsg(line) {
          const convo = $("demoConvo");
          const empty = $("demoEmpty");
          if (empty) empty.remove();
          const el = document.createElement("div");
          el.className = "dt-line " + line.kind;
          if (line.kind === "note" || line.kind === "crm") {
            el.innerHTML = '<span class="role"></span><span class="body">' + line.text + '</span>';
          } else {
            const role = line.role || line.kind;
            el.innerHTML = '<span class="role">' + role + '</span><span class="body">' + line.text.replace(/&/g,"&amp;").replace(/</g,"&lt;") + '</span>';
          }
          convo.appendChild(el);
          convo.scrollTop = convo.scrollHeight;
        }
        function drawSparkline(values) {
          if (!values.length) return;
          const W = 240, H = 60, pad = 6;
          const max = Math.max(...values, 0.5);
          const min = Math.min(...values, -0.5);
          const range = Math.max(max - min, 0.5);
          const step = (W - pad * 2) / Math.max(values.length - 1, 1);
          const pts = values.map((v, i) => [pad + i * step, H - pad - ((v - min) / range) * (H - pad * 2)]);
          const line = pts.map((p, i) => (i === 0 ? "M" : "L") + " " + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
          const fill = line + " L " + pts[pts.length - 1][0].toFixed(1) + " " + H + " L " + pts[0][0].toFixed(1) + " " + H + " Z";
          $("demoSparkLine").setAttribute("d", line);
          $("demoSparkFill").setAttribute("d", fill);
        }
        function updateSignal(progress, scenario) {
          const sentArr = scenario.sentiment;
          const slice = Math.min(sentArr.length, Math.max(1, Math.ceil(progress * sentArr.length)));
          const visible = sentArr.slice(0, slice);
          drawSparkline(visible);
          const cur = visible[visible.length - 1];
          const sentEl = $("demoSent");
          sentEl.textContent = (cur >= 0 ? "+" : "") + cur.toFixed(2);
          sentEl.classList.toggle("up", cur >= 0.2);
          $("demoSentMeter").style.width = (50 + cur * 50).toFixed(0) + "%";
          if (progress > 0.6) $("demoLang").textContent = scenario.finalSignals.lang;
          else if (progress > 0.05) $("demoLang").textContent = "en-US";
          const qa = Math.round(progress * scenario.finalSignals.qa);
          if (progress > 0.05) {
            $("demoQa").innerHTML = qa + '<span style="font-size:0.55em;color:var(--muted);">%</span>';
            $("demoQaMeter").style.width = qa + "%";
          }
        }
        function play() {
          const scenario = SCENARIOS[currentKey];
          if (playing) return;
          if ($("demoConvo").children.length > 1 && !$("demoEmpty")) resetUI();
          playing = true;
          $("demoPlayLabel").textContent = "Playing…";
          $("demoStatus").textContent = "live";
          liveDot.style.opacity = "1";
          wave.classList.add("active");
          $("demoHint").textContent = "Sophia is listening. Transcript streaming.";
          const startMs = Date.now();
          timerId = setInterval(() => {
            $("demoTimer").textContent = fmtTime((Date.now() - startMs) / 1000);
          }, 100);
          const total = scenario.lines[scenario.lines.length - 1].t + 1400;
          scenario.lines.forEach((line, i) => {
            timers.push(setTimeout(() => {
              addMsg(line);
              updateSignal((i + 1) / scenario.lines.length, scenario);
              speakLine(line);
            }, line.t));
          });
          timers.push(setTimeout(() => {
            playing = false;
            wave.classList.remove("active");
            $("demoStatus").textContent = "wrapped";
            liveDot.style.opacity = "0.6";
            clearInterval(timerId); timerId = null;
            $("demoPlayLabel").textContent = "Replay call";
            $("demoHint").textContent = "Call complete. Sophia recommending follow-up.";
            $("demoSuggestHead").textContent = scenario.suggest.head;
            $("demoSuggestText").textContent = scenario.suggest.text;
            $("demoSuggestRow").hidden = false;
            const sug = document.querySelector(".ai-suggest");
            sug.classList.remove("dismissed", "accepted");
          }, total));
        }
        function init() {
          document.querySelectorAll(".dash-tab").forEach((t) => {
            t.addEventListener("click", () => setScenario(t.dataset.scenario));
          });
          $("demoPlayBtn").addEventListener("click", () => {
            if (playing) return;
            clearAll(); resetUI(); play();
          });
          $("demoReplayBtn").addEventListener("click", () => {
            clearAll(); resetUI(); setTimeout(play, 200);
          });
          $("demoAcceptBtn").addEventListener("click", () => {
            const sug = document.querySelector(".ai-suggest");
            sug.classList.add("accepted");
            $("demoSuggestHead").textContent = "Accepted · sent to agent script";
            $("demoHint").textContent = "Suggestion accepted. Logged to coaching data.";
          });
          $("demoRewriteBtn").addEventListener("click", () => {
            $("demoSuggestText").textContent = '"Want me to also queue up a follow-up SMS in 24 hours, just to make sure nothing slipped?"';
            $("demoSuggestHead").textContent = "Rewritten alternative · conf 0.89";
          });
          $("demoSkipBtn").addEventListener("click", () => {
            const sug = document.querySelector(".ai-suggest");
            sug.classList.add("dismissed");
            $("demoHint").textContent = "Suggestion skipped. Agent improvising.";
          });
        }
        return { init };
      })();
      demo.init();

      // ====== VOICE PLAYBACK (Web Speech API) for the Sophia demo
      const voice = (() => {
        let enabled = true;
        let voices = [];
        const synth = window.speechSynthesis;
        function load() {
          voices = synth ? synth.getVoices() : [];
        }
        function pick(lang, preferFemale) {
          if (!voices.length) return null;
          const langMatches = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(lang.toLowerCase()));
          const pool = langMatches.length ? langMatches : voices;
          const fem = pool.find((v) => /female|samantha|victoria|karen|tessa|moira|fiona|paulina|monica/i.test(v.name));
          const masc = pool.find((v) => /male|daniel|alex|fred|aaron|jorge|diego|carlos/i.test(v.name));
          return (preferFemale ? fem || pool[0] : masc || pool[1] || pool[0]) || null;
        }
        if (synth) {
          load();
          synth.onvoiceschanged = load;
        }
        function speakLine(line) {
          if (!enabled || !synth) return;
          if (line.kind === "note" || line.kind === "crm") return;
          synth.cancel(); // overlap-safe: drop previous if still talking
          const u = new SpeechSynthesisUtterance(line.text);
          const isSpanish = (line.kind || "").includes("es") || /[áéíóúñ¿¡]/.test(line.text);
          const lang = isSpanish ? "es" : "en";
          const isAgent = line.kind === "agent";
          const isSophia = line.kind === "ai";
          const isCustomer = line.kind === "cust" || (line.kind || "").startsWith("es ");
          // caller=male english, agent=female english, sophia=female english (slightly faster, higher pitch)
          const v = pick(lang, isAgent || isSophia);
          if (v) u.voice = v;
          u.lang = isSpanish ? "es-MX" : "en-US";
          u.rate = isSophia ? 1.05 : 0.95;
          u.pitch = isSophia ? 1.15 : isAgent ? 1.0 : 0.92;
          u.volume = 0.9;
          synth.speak(u);
        }
        function stop() { if (synth) synth.cancel(); }
        function toggle() {
          enabled = !enabled;
          if (!enabled) stop();
          return enabled;
        }
        return { speakLine, stop, toggle, isEnabled: () => enabled };
      })();
      // expose speakLine for the demo play loop
      function speakLine(line) { voice.speakLine(line); }
      // voice toggle UI
      (function wireVoice() {
        const btn = document.getElementById("demoVoiceBtn");
        const lbl = document.getElementById("demoVoiceLabel");
        if (!btn) return;
        btn.addEventListener("click", () => {
          const on = voice.toggle();
          btn.setAttribute("aria-pressed", on ? "true" : "false");
          lbl.textContent = on ? "Voice on" : "Voice off";
        });
        // stop voice when scenario changes or replay
        document.querySelectorAll(".dash-tab, #demoPlayBtn, #demoReplayBtn").forEach((el) => {
          el.addEventListener("click", () => voice.stop());
        });
      })();

      // ====== SCROLL PROGRESS BAR
      (function scrollProgress() {
        const bar = document.getElementById("scrollBar");
        if (!bar) return;
        function update() {
          const h = document.documentElement;
          const sc = (h.scrollTop || document.body.scrollTop);
          const max = (h.scrollHeight - h.clientHeight) || 1;
          bar.style.width = ((sc / max) * 100).toFixed(2) + "%";
        }
        window.addEventListener("scroll", update, { passive: true });
        update();
      })();

      // ====== ANIMATED COUNTERS
      (function counters() {
        const els = document.querySelectorAll("[data-count]");
        if (!els.length) return;
        const animate = (el) => {
          const target = +el.dataset.count;
          const suffix = el.dataset.suffix || "";
          const dur = 1400;
          const start = performance.now();
          function tick(now) {
            const t = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - t, 3);
            const val = Math.round(target * eased);
            el.textContent = val + suffix;
            if (t < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        };
        const obs = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) { animate(e.target); obs.unobserve(e.target); }
          });
        }, { threshold: 0.5 });
        els.forEach((el) => obs.observe(el));
      })();

      // ====== 3D TILT ON SERVICE CARDS
      (function tilt() {
        document.querySelectorAll("[data-tilt]").forEach((card) => {
          card.addEventListener("mousemove", (e) => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width;
            const y = (e.clientY - r.top) / r.height;
            const rx = (0.5 - y) * 6;
            const ry = (x - 0.5) * 8;
            card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
          });
          card.addEventListener("mouseleave", () => {
            card.style.transform = "";
          });
        });
      })();

      // ====== FLOATING SOPHIA CHAT WIDGET
      (function sophiaWidget() {
        const fab = document.getElementById("sophiaFab");
        const panel = document.getElementById("sophiaPanel");
        const close = document.getElementById("sophiaClose");
        const msgs = document.getElementById("sophiaMsgs");
        const form = document.getElementById("sophiaForm");
        const input = document.getElementById("sophiaInput");
        const quick = document.getElementById("sophiaQuick");
        if (!fab) return;
        const KB = [
          { keys: ["ramp","fast","live","launch","start","timeline","go live"], a: "Pilots typically go live in 30–45 days. Weeks 1–2: knowledge transfer. Weeks 3–4: training & shadowing. Week 5: soft launch with double QA. Full ramp at 60–90 days." },
          { keys: ["price","pricing","cost","rate","fee","budget"], a: "Most engagements are per-hour FTE or per-call. Expect 40–50% below comparable U.S. centers fully loaded. Pilots start at 10–25 seats. Try the ROI calculator on this page for a directional number." },
          { keys: ["security","compliance","soc","hipaa","pci","gdpr","data"], a: "We're SOC 2 Type II, HIPAA, PCI-DSS, and GDPR-aligned. PII never leaves controlled environments. Encrypted at rest and in transit. Happy to walk through the controls matrix during procurement." },
          { keys: ["language","spanish","bilingual","english","es","translate"], a: "English and Spanish are native across both centers — every agent is fully bilingual EN/ES. I can also surface real-time translation cues for 30+ additional languages on demand." },
          { keys: ["qa","quality","score","coaching","assurance"], a: "I auto-score 100% of calls on adherence, empathy, resolution, and compliance — versus the typical 2–3% manual sample. Human QA analysts review flagged calls weekly. You get a live dashboard plus a weekly digest." },
          { keys: ["ai","sophia","artificial","replace","robot"], a: "I don't replace agents — I assist them. I listen, draft suggested responses, track sentiment, and run real-time translation cues. The human decides. Customers always talk to a person." },
          { keys: ["integrate","crm","integration","salesforce","zendesk","tool"], a: "Standard integrations: Salesforce, Zendesk, HubSpot, ServiceNow, Genesys, NICE CXone, Five9, AWS Connect, Twilio Flex. Custom CRMs connect via REST/webhook in roughly two weeks." },
          { keys: ["where","location","mexico","monterrey","aguascalientes","timezone","tz"], a: "Two nearshore hubs: Monterrey (Nuevo León) and Aguascalientes. Both run on Central Time, so no overnight gap. ~1,280 bilingual agents online right now." },
          { keys: ["call","contact","demo","talk","schedule","sales","book"], a: "Easiest: book a 15-minute demo from the CTA at the bottom of the page, or call 1-800-530-4897. Either way, we'll come ready with numbers for your call mix." },
          { keys: ["exit","leave","contract","cancel","term"], a: "Standard contracts are annual with 90-day notice. We hand over knowledge artifacts and recordings (where contractually retained), plus a structured transition playbook. No exit fees." },
          { keys: ["industry","insurance","healthcare","retail","utilities","industries"], a: "Strongest in insurance, healthcare, retail, security, utilities, finance, restaurant, and warranty & claims. The 'Industries' section above goes deeper." },
        ];
        function reply(q) {
          const lower = q.toLowerCase();
          for (const item of KB) {
            if (item.keys.some((k) => lower.includes(k))) return item.a;
          }
          return "Great question — I'd love to answer that in detail. The fastest path is to book a 15-minute demo (CTA at the bottom of the page) or call 1-800-530-4897. I'll forward this question so we come prepared.";
        }
        function addMsg(text, who) {
          const el = document.createElement("div");
          el.className = "sp-msg " + who;
          el.textContent = text;
          msgs.appendChild(el);
          msgs.scrollTop = msgs.scrollHeight;
        }
        function ask(q) {
          addMsg(q, "you");
          setTimeout(() => addMsg(reply(q), "bot"), 500 + Math.random() * 400);
        }
        fab.addEventListener("click", () => panel.classList.toggle("open"));
        close.addEventListener("click", () => panel.classList.remove("open"));
        quick.querySelectorAll("button").forEach((b) => {
          b.addEventListener("click", () => ask(b.dataset.q));
        });
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          const v = input.value.trim();
          if (!v) return;
          ask(v);
          input.value = "";
        });
      })();

      // ====== LIVE TICKER — gentle wiggle on the numbers
      (function ticker() {
        const calls = document.getElementById("tk-calls");
        const sent = document.getElementById("tk-sent");
        const aht = document.getElementById("tk-aht");
        const agents = document.getElementById("tk-agents");
        if (!calls) return;
        let n = 12847;
        setInterval(() => {
          n += Math.floor(Math.random() * 4) + 1;
          calls.textContent = n.toLocaleString();
          sent.textContent = "+" + (0.38 + Math.random() * 0.10).toFixed(2);
          const ahtMin = 3 + Math.floor(Math.random() * 2);
          const ahtSec = Math.floor(Math.random() * 60).toString().padStart(2, "0");
          aht.textContent = ahtMin + "m " + ahtSec + "s";
          agents.textContent = (1240 + Math.floor(Math.random() * 80)).toLocaleString();
        }, 2400);
      })();

      // ====== ROI CALCULATOR
      (function roi() {
        const vol = document.getElementById("roi-vol");
        const aht = document.getElementById("roi-aht");
        const rate = document.getElementById("roi-rate");
        const mix = document.getElementById("roi-mix");
        if (!vol) return;
        const volV = document.getElementById("roi-vol-v");
        const ahtV = document.getElementById("roi-aht-v");
        const rateV = document.getElementById("roi-rate-v");
        const mixV = document.getElementById("roi-mix-v");
        const savings = document.getElementById("roi-savings");
        const curr = document.getElementById("roi-current");
        const newC = document.getElementById("roi-new");
        const qa = document.getElementById("roi-qa");
        const total = document.getElementById("roi-total");
        const fmtMoney = (n) => {
          if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
          if (n >= 1e3) return "$" + Math.round(n / 1e3) + "K";
          return "$" + Math.round(n);
        };
        function update() {
          const v = +vol.value, a = +aht.value, r = +rate.value, m = +mix.value;
          volV.textContent = (+v).toLocaleString();
          ahtV.textContent = a.toFixed(1);
          rateV.textContent = "$" + r.toFixed(2);
          mixV.textContent = m + "%";
          // current annual: 12 * volume * rate, with a small bilingual penalty for US centers
          const usPenalty = 1 + (m / 100) * 0.12;
          const current = 12 * v * r * usPenalty;
          // centris: ~55% of US cost-per-call (45% savings on labor + real estate, but slight AI infra cost)
          const centrisRate = r * 0.55;
          const newCost = 12 * v * centrisRate;
          const saved = current - newCost;
          const pct = Math.round((saved / current) * 100);
          curr.textContent = fmtMoney(current);
          newC.textContent = fmtMoney(newCost);
          qa.textContent = "+97 pts";
          savings.innerHTML = fmtMoney(saved) + '<span class="unit">/ yr saved</span>';
          total.textContent = fmtMoney(saved) + " · " + pct + "%";
        }
        [vol, aht, rate, mix].forEach((el) => el.addEventListener("input", update));
        update();
      })();

      // ====== COVERAGE MAP
      (function map() {
        const cards = document.querySelectorAll(".map-card");
        const pins = document.querySelectorAll(".map-svg .pin");
        function activate(city) {
          cards.forEach((c) => c.classList.toggle("active", c.dataset.city === city));
        }
        cards.forEach((c) => c.addEventListener("click", () => activate(c.dataset.city)));
        pins.forEach((p) => p.addEventListener("click", () => activate(p.dataset.city)));
      })();

      // ====== FAQ ACCORDION
      (function faq() {
        document.querySelectorAll(".faq-item").forEach((item) => {
          const btn = item.querySelector(".faq-q");
          btn.addEventListener("click", () => {
            const open = item.classList.toggle("open");
            btn.setAttribute("aria-expanded", open ? "true" : "false");
          });
        });
      })();

// ====== THEME TOGGLE
(function theme() {
  const KEY = "centris-theme";
  const btn = document.querySelector(".theme-toggle");
  function apply(t) {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(KEY, t);
  }
  const stored = localStorage.getItem(KEY);
  if (stored) apply(stored);
  else apply("dark");
  if (btn) {
    btn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme") || "dark";
      apply(cur === "dark" ? "light" : "dark");
    });
  }
})();

// ====== LANGUAGE TOGGLE (EN/ES)
(function lang() {
  const KEY = "centris-lang";
  const I18N = window.__I18N__ || {};
  const btn = document.querySelector(".lang-toggle");
  function apply(l) {
    document.documentElement.setAttribute("lang", l);
    localStorage.setItem(KEY, l);
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const fallback = el.getAttribute("data-i18n-fallback") || el.textContent;
      if (!el.hasAttribute("data-i18n-fallback")) el.setAttribute("data-i18n-fallback", el.textContent);
      const dict = I18N[l] || {};
      const val = dict[key];
      if (val !== undefined) el.textContent = val;
      else if (l === "en") el.textContent = el.getAttribute("data-i18n-fallback");
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      if (!el.hasAttribute("data-i18n-html-fallback")) el.setAttribute("data-i18n-html-fallback", el.innerHTML);
      const dict = I18N[l] || {};
      const val = dict[key];
      if (val !== undefined) el.innerHTML = val;
      else if (l === "en") el.innerHTML = el.getAttribute("data-i18n-html-fallback");
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (!el.hasAttribute("data-i18n-placeholder-fallback")) el.setAttribute("data-i18n-placeholder-fallback", el.getAttribute("placeholder") || "");
      const dict = I18N[l] || {};
      const val = dict[key];
      if (val !== undefined) el.setAttribute("placeholder", val);
      else if (l === "en") el.setAttribute("placeholder", el.getAttribute("data-i18n-placeholder-fallback"));
    });
    const lbl = document.querySelector(".active-lang");
    if (lbl) lbl.textContent = l.toUpperCase();
  }
  const stored = localStorage.getItem(KEY) || "es";
  apply(stored);
  if (btn) {
    btn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("lang") || "en";
      apply(cur === "en" ? "es" : "en");
    });
  }
})();
