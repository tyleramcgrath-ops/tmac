      /* ===== Scroll progress bar ===== */
      const scrollBar = document.getElementById("scrollBar");
      function updateScrollBar() {
        const h = document.documentElement;
        const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
        scrollBar.style.width = pct + "%";
      }
      window.addEventListener("scroll", updateScrollBar, { passive: true });
      updateScrollBar();

      /* ===== Reveal on scroll ===== */
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Array.from(e.target.parentNode.children).indexOf(e.target);
            const delay = Math.min(idx, 6) * 70;
            setTimeout(() => e.target.classList.add("in"), delay);
            io.unobserve(e.target);
          }
        });
      }, { rootMargin: "-60px 0px -60px 0px", threshold: 0.04 });
      document.querySelectorAll(".ir").forEach((el) => io.observe(el));

      /* ===== Theme toggle ===== */
      const themeBtn = document.getElementById("themeToggle");
      const savedTheme = localStorage.getItem("centris-theme");
      if (savedTheme === "light") document.documentElement.setAttribute("data-theme", "light");
      themeBtn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        if (current === "light") {
          document.documentElement.removeAttribute("data-theme");
          localStorage.setItem("centris-theme", "dark");
        } else {
          document.documentElement.setAttribute("data-theme", "light");
          localStorage.setItem("centris-theme", "light");
        }
      });

      /* ===== Language toggle (visual only) ===== */
      const langBtn = document.getElementById("langToggle");
      langBtn.addEventListener("click", () => {
        if (langBtn.textContent.trim() === "EN") {
          langBtn.textContent = "ES";
          langBtn.classList.add("es");
        } else {
          langBtn.textContent = "EN";
          langBtn.classList.remove("es");
        }
      });

      /* ===== Live ticker counters ===== */
      (function tickerUpdates() {
        let calls = 12847, agents = 1284, sent = 0.42;
        setInterval(() => {
          calls += Math.floor(Math.random() * 5) + 1;
          if (Math.random() > 0.85) agents += (Math.random() > 0.5 ? 1 : -1);
          sent = Math.max(0.2, Math.min(0.6, sent + (Math.random() - 0.5) * 0.04));
          const c = document.getElementById("tk-calls");
          const a = document.getElementById("tk-agents");
          const s = document.getElementById("tk-sent");
          if (c) c.textContent = calls.toLocaleString();
          if (a) a.textContent = agents.toLocaleString();
          if (s) s.textContent = "+" + sent.toFixed(2);
        }, 1800);
      })();

      /* ===== Sophia stage: bars + counter ===== */
      (function sophiaStage() {
        const barsEl = document.getElementById("sophiaBars");
        if (barsEl) {
          const N = 28;
          for (let i = 0; i < N; i++) {
            const bar = document.createElement("span");
            bar.className = "bar";
            const center = Math.abs(i - (N - 1) / 2) / ((N - 1) / 2);
            const envelope = 1 - center * 0.7;
            const base = 14 + Math.random() * 28;
            const peak = base * envelope;
            bar.style.height = `${peak}px`;
            bar.style.animationDelay = `${(Math.random() * -1.2).toFixed(2)}s`;
            bar.style.animationDuration = `${(0.8 + Math.random() * 0.7).toFixed(2)}s`;
            barsEl.appendChild(bar);
          }
        }
        const counter = document.getElementById("sophiaCounter");
        if (counter) {
          let n = 12481;
          setInterval(() => {
            n += Math.floor(Math.random() * 3) + 1;
            counter.textContent = n.toLocaleString() + " calls";
          }, 1400);
        }
      })();

      /* Bar bounce keyframe */
      (function injectBarKeyframes() {
        const style = document.createElement("style");
        style.textContent = `
          @keyframes barBounce {
            0%, 100% { transform: scaleY(0.25); }
            20% { transform: scaleY(1); }
            40% { transform: scaleY(0.5); }
            60% { transform: scaleY(0.85); }
            80% { transform: scaleY(0.4); }
          }
        `;
        document.head.appendChild(style);
      })();

      /* ===========================================================
       *  INTERACTIVE SOPHIA DEMO
       * =========================================================== */
      const SCENARIOS = {
        insurance: {
          title: "Insurance Claim",
          lines: [
            { t: 0,    kind: "cust",  role: "caller",      text: "I called twice last week. Nobody got back to me." },
            { t: 1500, kind: "note",  text: "tone · frustrated · 2 prior contacts" },
            { t: 2800, kind: "ai",    role: "sophia",      text: "Acknowledge the wait. Offer expedited review with a hard timeline." },
            { t: 4400, kind: "agent", role: "agent",       text: "I hear you — two weeks is too long. Let me mark this expedited, 48 hours." },
            { t: 6200, kind: "es",    role: "caller · es", text: "cliente — gracias, eso me ayuda mucho." },
            { t: 7800, kind: "note",  text: "sentiment shift · −0.4 → +0.3 · language switch · es-MX" },
            { t: 9200, kind: "agent", role: "agent",       text: "I'll send the confirmation in Spanish too. You'll have it by 5pm." },
            { t: 10800, kind: "crm",  text: "CRM logged · coverage-dispute · expedited · es-MX preference set" }
          ],
          sentiment: [-0.4, -0.4, -0.3, -0.1, 0.1, 0.2, 0.3, 0.3],
          finalSignals: { sent: 0.3, lang: "es-MX", qa: 97 },
          suggest: {
            head: "Recommended next line · conf 0.94",
            text: "\"And while we wait, I can connect you with your assigned adjuster for any other questions — would that help?\""
          }
        },
        healthcare: {
          title: "Healthcare Inquiry",
          lines: [
            { t: 0,    kind: "cust",  role: "patient",   text: "I need to reschedule my appointment for next week." },
            { t: 1400, kind: "note",  text: "tone · calm · returning patient · 4 prior visits" },
            { t: 2600, kind: "ai",    role: "sophia",    text: "Pull provider calendar. Offer 3 next-available slots, prioritize morning." },
            { t: 4000, kind: "agent", role: "agent",     text: "Of course. I have Tuesday at 10am, Wednesday at 2pm, or Thursday at 9am." },
            { t: 5600, kind: "cust",  role: "patient",   text: "Tuesday at 10am works for me." },
            { t: 6800, kind: "ai",    role: "sophia",    text: "Confirm slot. Send SMS reminder 24h prior, with parking info." },
            { t: 8400, kind: "agent", role: "agent",     text: "Tuesday 10am confirmed. I'll text you a reminder Monday with the parking details." },
            { t: 10200, kind: "crm", text: "Appointment rescheduled · SMS scheduled · HIPAA-logged" }
          ],
          sentiment: [0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55],
          finalSignals: { sent: 0.55, lang: "en-US", qa: 98 },
          suggest: {
            head: "Follow-up suggestion · conf 0.91",
            text: "\"While you're on, would you like to schedule your annual lab work for the same morning? Saves you a second trip.\""
          }
        },
        billing: {
          title: "Billing Dispute",
          lines: [
            { t: 0,    kind: "cust",  role: "caller",  text: "There's a charge on my bill I don't recognize." },
            { t: 1500, kind: "note",  text: "tone · concerned · first contact this cycle" },
            { t: 2800, kind: "ai",    role: "sophia",  text: "Pull last 90-day statement. Match against subscription renewals." },
            { t: 4200, kind: "agent", role: "agent",   text: "Let me pull up your statement. Which date is the charge from?" },
            { t: 5800, kind: "cust",  role: "caller",  text: "March 14th, for $89.99." },
            { t: 7000, kind: "ai",    role: "sophia",  text: "Match found · auto-renewal · premium plan. Offer cancellation + same-day refund." },
            { t: 8600, kind: "agent", role: "agent",   text: "I see it — that's an auto-renewal for premium. I can cancel it and refund you today." },
            { t: 10200, kind: "note", text: "resolution path · 0 escalations · refund authorized" },
            { t: 11600, kind: "crm", text: "Refund $89.99 issued · auto-renewal cancelled · customer notified" }
          ],
          sentiment: [-0.1, -0.1, 0.0, 0.1, 0.15, 0.25, 0.4, 0.5, 0.55],
          finalSignals: { sent: 0.55, lang: "en-US", qa: 96 },
          suggest: {
            head: "Recommended next line · conf 0.92",
            text: "\"Want me to also turn off auto-renew on your other plans, or just this one?\""
          }
        },
        sales: {
          title: "Inbound Sales",
          lines: [
            { t: 0,    kind: "cust",  role: "caller",  text: "I'm comparing your premium plan against a competitor." },
            { t: 1500, kind: "note",  text: "intent · evaluating · price-sensitive signals detected" },
            { t: 2800, kind: "ai",    role: "sophia",  text: "Surface premium-tier value props. Mention 14-day guarantee. Hold discount until objection #2." },
            { t: 4400, kind: "agent", role: "agent",   text: "Happy to walk through what makes our plan different — what features matter most to you?" },
            { t: 6200, kind: "cust",  role: "caller",  text: "Mostly the bilingual support and reporting. The other quote was 12% less." },
            { t: 7600, kind: "ai",    role: "sophia",  text: "Objection · price. Authorized: 10% loyalty discount + free onboarding ($1.2k value)." },
            { t: 9200, kind: "agent", role: "agent",   text: "I can match that within 2% and include free onboarding — about $1,200 in value on day one." },
            { t: 10800, kind: "note", text: "close probability · 0.74 → 0.86" },
            { t: 12200, kind: "crm", text: "Deal advanced · proposal sent · CSM tagged" }
          ],
          sentiment: [0.1, 0.15, 0.2, 0.2, 0.05, 0.25, 0.4, 0.5, 0.55],
          finalSignals: { sent: 0.55, lang: "en-US", qa: 95 },
          suggest: {
            head: "Closing suggestion · conf 0.88",
            text: "\"If we get the paperwork started today, I can have your first bilingual queue live by Friday — interested?\""
          }
        }
      };

      const demo = (() => {
        let currentKey = "insurance";
        let timers = [];
        let timerId = null;
        let playing = false;

        const $ = (id) => document.getElementById(id);
        const wave = $("demoWave");
        const liveDot = $("demoLiveDot");

        function clearAll() {
          timers.forEach((t) => clearTimeout(t));
          timers = [];
          if (timerId) { clearInterval(timerId); timerId = null; }
          playing = false;
        }

        function resetUI() {
          const convo = $("demoConvo");
          convo.innerHTML = '<div class="convo-empty" id="demoEmpty">Press play to start the call simulation →</div>';
          $("demoTimer").textContent = "00:00";
          $("demoStatus").textContent = "idle";
          liveDot.style.opacity = "0.3";
          wave.classList.remove("active");
          $("demoSent").textContent = "0.0";
          $("demoSent").style.color = "";
          $("demoSentMeter").style.width = "50%";
          $("demoLang").textContent = "—";
          $("demoQa").textContent = "—";
          $("demoQaMeter").style.width = "0%";
          $("demoSparkLine").setAttribute("d", "");
          $("demoSparkFill").setAttribute("d", "");
          $("demoSparkDot").setAttribute("opacity", "0");
          $("demoSuggestRow").hidden = true;
          $("demoPlayLabel").textContent = "Play call";
          $("demoHint").textContent = "Press play to begin.";
        }

        function fmtTime(s) {
          const m = Math.floor(s / 60).toString().padStart(2, "0");
          const sec = Math.floor(s % 60).toString().padStart(2, "0");
          return `${m}:${sec}`;
        }

        function setScenario(key) {
          if (key === currentKey) return;
          currentKey = key;
          document.querySelectorAll(".demo-tab").forEach((t) => {
            t.classList.toggle("active", t.dataset.scenario === key);
          });
          $("demoCallTitle").textContent = SCENARIOS[key].title;
          clearAll();
          resetUI();
        }

        function escapeHtml(s) {
          return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }

        function addMsg(line) {
          const convo = $("demoConvo");
          const empty = $("demoEmpty");
          if (empty) empty.remove();
          const el = document.createElement("div");
          if (line.kind === "note" || line.kind === "crm") {
            el.className = `msg ${line.kind}`;
            el.innerHTML = `<span class="body">${line.text}</span>`;
          } else {
            el.className = `msg ${line.kind}`;
            const role = line.role || line.kind;
            el.innerHTML = `<span class="role">${role}</span><span class="body">${escapeHtml(line.text)}</span>`;
          }
          convo.appendChild(el);
          convo.scrollTop = convo.scrollHeight;
        }

        function drawSparkline(values) {
          const W = 240, H = 60, pad = 6;
          if (!values.length) return;
          const max = Math.max(...values, 0.5);
          const min = Math.min(...values, -0.5);
          const range = Math.max(max - min, 0.5);
          const step = (W - pad * 2) / Math.max(values.length - 1, 1);
          const pts = values.map((v, i) => {
            const x = pad + i * step;
            const y = H - pad - ((v - min) / range) * (H - pad * 2);
            return [x, y];
          });
          const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
          const fill = `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${H} L ${pts[0][0].toFixed(1)} ${H} Z`;
          $("demoSparkLine").setAttribute("d", line);
          $("demoSparkFill").setAttribute("d", fill);
          const last = pts[pts.length - 1];
          $("demoSparkDot").setAttribute("cx", last[0]);
          $("demoSparkDot").setAttribute("cy", last[1]);
          $("demoSparkDot").setAttribute("opacity", "1");
        }

        function updateSignal(progress, scenario) {
          const sentArr = scenario.sentiment;
          const slice = Math.min(sentArr.length, Math.max(1, Math.ceil(progress * sentArr.length)));
          const visible = sentArr.slice(0, slice);
          drawSparkline(visible);
          const cur = visible[visible.length - 1];
          const sentEl = $("demoSent");
          sentEl.textContent = (cur >= 0 ? "+" : "") + cur.toFixed(2);
          sentEl.style.color = cur >= 0.2 ? "var(--emerald)" : (cur <= -0.15 ? "var(--primary-soft)" : "var(--white)");
          $("demoSentMeter").style.width = (50 + cur * 50).toFixed(0) + "%";
          const lang = scenario.finalSignals.lang;
          if (progress > 0.6) $("demoLang").textContent = lang;
          else if (progress > 0.05) $("demoLang").textContent = "en-US";
          const qa = Math.round(progress * scenario.finalSignals.qa);
          if (progress > 0.05) {
            $("demoQa").innerHTML = `${qa}<span style="font-size:0.55em;color:var(--gray-3);font-weight:500;">%</span>`;
            $("demoQaMeter").style.width = qa + "%";
          }
        }

        function play() {
          const scenario = SCENARIOS[currentKey];
          if (playing) return;
          if ($("demoConvo").children.length > 1 && !$("demoEmpty")) {
            resetUI();
          }
          playing = true;
          $("demoPlayLabel").textContent = "Playing…";
          $("demoStatus").textContent = "live";
          liveDot.style.opacity = "1";
          wave.classList.add("active");
          $("demoHint").textContent = "Sophia is listening. Transcript streaming in real-time.";

          const startMs = Date.now();
          timerId = setInterval(() => {
            const elapsed = (Date.now() - startMs) / 1000;
            $("demoTimer").textContent = fmtTime(elapsed);
          }, 100);

          const total = scenario.lines[scenario.lines.length - 1].t + 1400;
          scenario.lines.forEach((line, i) => {
            timers.push(setTimeout(() => {
              addMsg(line);
              updateSignal((i + 1) / scenario.lines.length, scenario);
            }, line.t));
          });

          timers.push(setTimeout(() => {
            playing = false;
            wave.classList.remove("active");
            $("demoStatus").textContent = "wrapped";
            liveDot.style.opacity = "0.6";
            clearInterval(timerId); timerId = null;
            $("demoPlayLabel").textContent = "Replay call";
            $("demoHint").textContent = "Call complete. Sophia is recommending a follow-up.";

            const sg = scenario.suggest;
            $("demoSuggestHead").textContent = sg.head;
            $("demoSuggestText").textContent = sg.text;
            $("demoSuggestRow").hidden = false;
            const sug = document.querySelector(".ai-suggest");
            sug.classList.remove("dismissed", "accepted");
          }, total));
        }

        function init() {
          document.querySelectorAll(".demo-tab").forEach((t) => {
            t.addEventListener("click", () => setScenario(t.dataset.scenario));
          });
          $("demoPlayBtn").addEventListener("click", () => {
            if (playing) return;
            clearAll();
            resetUI();
            play();
          });
          $("demoReplayBtn").addEventListener("click", () => {
            clearAll();
            resetUI();
            setTimeout(play, 200);
          });
          $("demoAcceptBtn").addEventListener("click", () => {
            const sug = document.querySelector(".ai-suggest");
            sug.classList.add("accepted");
            $("demoSuggestHead").textContent = "Accepted · sent to agent script";
            $("demoHint").textContent = "Suggestion accepted. Logged to coaching data.";
          });
          $("demoRewriteBtn").addEventListener("click", () => {
            $("demoSuggestText").textContent = "\"Want me to also queue up a follow-up SMS in 24 hours, just to make sure nothing slipped?\"";
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
