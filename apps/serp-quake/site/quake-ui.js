// Shared UI pieces for the SERP Quake site.
//
//   Richter.mount(el)     the mascot. .set(magnitude) changes his mood:
//                          < 3 zen · 3–5 alert · 5–7 nervous · 7+ panic
//   Helicorder.mount(cv)  a drum-recorder seismograph drawn live on a canvas.
//                          .set(magnitude) changes how hard the pen swings.
//
// Both honour prefers-reduced-motion: the mood still shows, the shaking stops.
(function () {
  'use strict';

  const MOODS = [
    { min: 7, key: 'panic', name: 'Panicking', color: '#e2483d', line: 'Core-update-level shaking. Richter is not okay.' },
    { min: 5, key: 'nervous', name: 'Nervous', color: '#ef8a3a', line: 'Something big is rolling out. Richter is sweating.' },
    { min: 3, key: 'alert', name: 'Alert', color: '#e7b53c', line: 'Above-normal churn. Richter has one eye open.' },
    { min: 0, key: 'zen', name: 'Chilling', color: '#3aa883', line: 'Normal churn. Richter is chilling.' },
  ];
  const moodOf = (m) => MOODS.find((x) => (m || 0) >= x.min);
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CSS = `
  .rq{width:100%;height:auto;overflow:visible;display:block}
  .rq .mv{display:none}
  .rq[data-mood=zen] .m-zen,.rq[data-mood=alert] .m-alert,.rq[data-mood=nervous] .m-nervous,.rq[data-mood=panic] .m-panic,
  .rq[data-mood=nervous] .m-worry,.rq[data-mood=panic] .m-worry,.rq[data-mood=alert] .m-open,.rq[data-mood=nervous] .m-open{display:inline}
  .rq .body{fill:var(--rq-c);transition:fill .6s ease}
  .rq .ball{fill:var(--rq-c);transition:fill .6s ease}
  .rq .bob{transform-origin:120px 200px;transform-box:view-box}
  .rq .ant{transform-origin:120px 62px;transform-box:view-box}
  .rq .shadow{transform-origin:120px 216px;transform-box:view-box}
  .rq .trace{stroke-dasharray:6 200;}
  @keyframes rq-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
  @keyframes rq-shadow{0%,100%{transform:scaleX(1);opacity:.25}50%{transform:scaleX(.86);opacity:.16}}
  @keyframes rq-sway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
  @keyframes rq-jitter{0%{transform:translate(0,0)}25%{transform:translate(1.6px,-.6px)}50%{transform:translate(-1.4px,.8px)}75%{transform:translate(.9px,1px)}100%{transform:translate(0,0)}}
  @keyframes rq-shake{0%{transform:translate(0,0) rotate(0)}20%{transform:translate(-4px,1px) rotate(-3deg)}40%{transform:translate(4px,-2px) rotate(3deg)}60%{transform:translate(-3px,2px) rotate(-2deg)}80%{transform:translate(3px,-1px) rotate(2deg)}100%{transform:translate(0,0) rotate(0)}}
  @keyframes rq-ant{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}
  @keyframes rq-ant-fast{0%,100%{transform:rotate(-22deg)}50%{transform:rotate(22deg)}}
  @keyframes rq-z{0%{opacity:0;transform:translate(0,0) scale(.6)}30%{opacity:1}100%{opacity:0;transform:translate(14px,-34px) scale(1.15)}}
  @keyframes rq-drop{0%{opacity:0;transform:translateY(-4px)}20%{opacity:1}100%{opacity:0;transform:translateY(22px)}}
  @keyframes rq-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
  @keyframes rq-pop{0%,100%{opacity:0;transform:scale(.5)}30%,70%{opacity:1;transform:scale(1)}}
  @keyframes rq-pen{to{stroke-dashoffset:-206}}
  .rq[data-mood=zen] .bob{animation:rq-float 4.2s ease-in-out infinite}
  .rq[data-mood=zen] .shadow{animation:rq-shadow 4.2s ease-in-out infinite}
  .rq[data-mood=zen] .ant{animation:rq-ant 5s ease-in-out infinite}
  .rq[data-mood=alert] .bob{animation:rq-sway 3s ease-in-out infinite}
  .rq[data-mood=alert] .ant{animation:rq-ant 2.2s ease-in-out infinite}
  .rq[data-mood=nervous] .bob{animation:rq-jitter .22s linear infinite}
  .rq[data-mood=nervous] .ant{animation:rq-ant 0.7s ease-in-out infinite}
  .rq[data-mood=panic] .bob{animation:rq-shake .14s linear infinite}
  .rq[data-mood=panic] .ant{animation:rq-ant-fast .25s ease-in-out infinite}
  .rq .z{animation:rq-z 3s ease-out infinite;transform-box:fill-box}
  .rq .z.d2{animation-delay:1s}.rq .z.d3{animation-delay:2s}
  .rq .drop{animation:rq-drop 1.3s ease-in infinite;transform-box:fill-box}
  .rq .drop.d2{animation-delay:.6s}
  .rq .eyes-open{animation:rq-blink 4s infinite;transform-origin:120px 108px;transform-box:view-box}
  .rq .bang{animation:rq-pop .8s ease-in-out infinite;transform-origin:center;transform-box:fill-box}
  .rq .bang.d2{animation-delay:.4s}
  .rq .trace{animation:rq-pen var(--rq-pen,3s) linear infinite}
  .night .rq .limb,.on-dark .rq .limb{stroke:#cfc4b2}
  .night .rq .foot,.on-dark .rq .foot{fill:#cfc4b2}
  .night .rq .shadow,.on-dark .rq .shadow{opacity:.55}
  @media (prefers-reduced-motion: reduce){.rq *{animation:none!important}}
  `;

  function injectCss() {
    if (document.getElementById('rq-css')) return;
    const s = document.createElement('style');
    s.id = 'rq-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  // The little drum window on his belly draws a trace whose swing follows the mood.
  const TRACES = {
    zen: 'M84 172 h12 l3 -2 l3 3 l3 -1 h12 l3 -2 l3 2 h12 l3 -1 l3 1 h12 l3 -2 l3 2 h12',
    alert: 'M84 172 h8 l4 -6 l4 9 l4 -4 h10 l4 -7 l4 10 l4 -4 h8 l4 -6 l4 8 l4 -3 h8 l4 -6 l4 6 h6',
    nervous: 'M84 172 l4 -10 l4 16 l4 -14 l4 12 l4 -16 l4 18 l4 -12 l4 10 l4 -16 l4 16 l4 -12 l4 14 l4 -14 l4 10 l4 -8 l4 6 h4',
    panic: 'M84 172 l3 -16 l3 24 l3 -22 l3 20 l3 -24 l3 26 l3 -20 l3 22 l3 -26 l3 24 l3 -22 l3 24 l3 -20 l3 22 l3 -24 l3 20 l3 -16 l3 12 l3 -8 h3',
  };

  let uidSeq = 0;
  function svg() {
    const uid = ++uidSeq;
    return `
<svg class="rq" viewBox="0 0 240 240" role="img" aria-label="Richter the seismometer">
  <ellipse class="shadow" cx="120" cy="216" rx="58" ry="8" fill="#000" opacity=".22"/>
  <g class="bob">
    <g class="ant">
      <path class="limb" d="M120 62 C 112 52, 128 44, 120 34 S 128 18, 120 12" fill="none" stroke="#2a2520" stroke-width="4" stroke-linecap="round"/>
      <circle class="ball" cx="120" cy="11" r="8" stroke="#2a2520" stroke-width="3"/>
    </g>
    <g class="mv m-panic">
      <path class="limb" d="M44 120 C 26 104, 22 84, 30 70" fill="none" stroke="#2a2520" stroke-width="7" stroke-linecap="round"/>
      <path class="limb" d="M196 120 C 214 104, 218 84, 210 70" fill="none" stroke="#2a2520" stroke-width="7" stroke-linecap="round"/>
    </g>
    <g class="mv m-zen m-alert m-nervous">
      <path class="limb" d="M50 132 C 36 140, 36 156, 46 162" fill="none" stroke="#2a2520" stroke-width="7" stroke-linecap="round"/>
      <path class="limb" d="M190 132 C 204 140, 204 156, 194 162" fill="none" stroke="#2a2520" stroke-width="7" stroke-linecap="round"/>
    </g>
    <ellipse class="foot" cx="94" cy="204" rx="17" ry="9" fill="#2a2520"/>
    <ellipse class="foot" cx="146" cy="204" rx="17" ry="9" fill="#2a2520"/>
    <rect class="body" x="48" y="58" width="144" height="146" rx="58" stroke="#2a2520" stroke-width="4"/>
    <rect x="66" y="78" width="108" height="72" rx="30" fill="#fffaf0" stroke="#2a2520" stroke-width="3.5"/>
    <rect x="76" y="156" width="88" height="32" rx="9" fill="#fffaf0" stroke="#2a2520" stroke-width="3"/>
    <clipPath id="rq-win-${uid}"><rect x="78" y="158" width="84" height="28" rx="7"/></clipPath>
    <path class="trace" clip-path="url(#rq-win-${uid})" d="${TRACES.zen}" fill="none" stroke="#d6402b" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" pathLength="200" style="stroke-dasharray:200 6"/>
    <ellipse cx="84" cy="132" rx="8" ry="4.5" fill="#f2a08f" opacity=".7"/>
    <ellipse cx="156" cy="132" rx="8" ry="4.5" fill="#f2a08f" opacity=".7"/>

    <!-- zen: happy closed eyes, smile, rising z's -->
    <g class="mv m-zen">
      <path d="M92 110 q9 -10 18 0 M130 110 q9 -10 18 0" fill="none" stroke="#2a2520" stroke-width="4" stroke-linecap="round"/>
      <path d="M106 126 q14 14 28 0" fill="none" stroke="#2a2520" stroke-width="4" stroke-linecap="round"/>
      <text class="z" x="178" y="66" font-family="Georgia,serif" font-weight="700" font-size="18" fill="#2a2520">z</text>
      <text class="z d2" x="186" y="56" font-family="Georgia,serif" font-weight="700" font-size="14" fill="#2a2520">z</text>
      <text class="z d3" x="194" y="48" font-family="Georgia,serif" font-weight="700" font-size="11" fill="#2a2520">z</text>
    </g>
    <!-- alert + nervous: open eyes that blink -->
    <g class="mv m-open eyes-open">
      <circle cx="101" cy="108" r="8" fill="#2a2520"/><circle cx="139" cy="108" r="8" fill="#2a2520"/>
      <circle cx="104" cy="105" r="2.6" fill="#fff"/><circle cx="142" cy="105" r="2.6" fill="#fff"/>
    </g>
    <g class="mv m-alert">
      <path d="M90 92 l20 -3 M130 86 l20 4" stroke="#2a2520" stroke-width="4" stroke-linecap="round"/>
      <path d="M110 132 h20" stroke="#2a2520" stroke-width="4" stroke-linecap="round"/>
    </g>
    <!-- nervous + panic: worried brows, sweat -->
    <g class="mv m-worry">
      <path d="M90 96 l20 -7 M150 96 l-20 -7" stroke="#2a2520" stroke-width="4" stroke-linecap="round"/>
      <path class="drop" d="M178 76 q6 9 0 13 q-6 -4 0 -13z" fill="#7cc6f0" stroke="#2a2520" stroke-width="2"/>
      <path class="drop d2" d="M60 88 q5 8 0 11 q-5 -3 0 -11z" fill="#7cc6f0" stroke="#2a2520" stroke-width="2"/>
    </g>
    <g class="mv m-nervous">
      <path d="M104 134 q4 -5 8 0 t8 0 t8 0 t8 0" fill="none" stroke="#2a2520" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <!-- panic: huge eyes, tiny pupils, screaming mouth, !! -->
    <g class="mv m-panic">
      <circle cx="100" cy="106" r="13" fill="#fff" stroke="#2a2520" stroke-width="3.5"/><circle cx="140" cy="106" r="13" fill="#fff" stroke="#2a2520" stroke-width="3.5"/>
      <circle cx="100" cy="106" r="3.5" fill="#2a2520"/><circle cx="140" cy="106" r="3.5" fill="#2a2520"/>
      <ellipse cx="120" cy="134" rx="10" ry="9" fill="#2a2520"/>
      <text class="bang" x="20" y="62" font-family="Georgia,serif" font-weight="900" font-size="30" fill="#e2483d">!</text>
      <text class="bang d2" x="206" y="56" font-family="Georgia,serif" font-weight="900" font-size="30" fill="#e2483d">!</text>
    </g>
  </g>
</svg>`;
  }

  const Richter = {
    moods: MOODS,
    moodOf,
    mount(el) {
      injectCss();
      el.innerHTML = svg();
      const root = el.querySelector('.rq');
      const trace = root.querySelector('.trace');
      const api = {
        mood: null,
        set(m) {
          const md = moodOf(m);
          if (md.key !== api.mood) {
            root.setAttribute('data-mood', md.key);
            trace.setAttribute('d', TRACES[md.key]);
            api.mood = md.key;
          }
          root.style.setProperty('--rq-c', md.color);
          // The pen runs faster the harder the ground moves.
          root.style.setProperty('--rq-pen', Math.max(0.6, 3.4 - (m || 0) * 0.28).toFixed(2) + 's');
          return md;
        },
      };
      api.set(0);
      return api;
    },
  };

  // ---------------------------------------------------------------- helicorder
  // Rows of ink like a drum recorder: each row is a span of time, the newest row
  // is drawn live at the pen. Swing scales the way the magnitude does:
  // 2^((M-2)/3) — every +3 doubles the amplitude.
  const Helicorder = {
    mount(canvas, opts = {}) {
      const ctx = canvas.getContext('2d');
      const rows = opts.rows || 9;
      const ink = opts.ink || '#d6402b';
      const old = opts.oldInk || 'rgba(42,37,32,.55)';
      const grid = opts.grid || 'rgba(42,37,32,.08)';
      let mag = opts.magnitude != null ? opts.magnitude : 2;
      let W = 0, H = 0, dpr = 1;
      const hist = [];       // finished rows: arrays of y-offsets
      let cur = [];          // the row being drawn
      let burst = 0;
      let raf = 0; let last = 0;

      function resize() {
        dpr = Math.min(2, window.devicePixelRatio || 1);
        const r = canvas.getBoundingClientRect();
        W = Math.max(1, r.width); H = Math.max(1, r.height);
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      const amp = () => Math.pow(2, (mag - 2) / 3);
      function sample() {
        const rowH = H / rows;
        const base = rowH * 0.07 * amp();
        if (Math.random() < 0.004 * (1 + mag)) burst = 18 + Math.random() * 40;
        const b = burst > 0 ? (burst--, 2.4) : 1;
        return (Math.random() - 0.5) * 2 * base * b + Math.sin(performance.now() / 900) * rowH * 0.02;
      }
      function seed() {
        hist.length = 0;
        for (let i = 0; i < rows - 1; i++) {
          const row = [];
          for (let x = 0; x < W; x += 2) row.push(sample());
          hist.push(row);
        }
        cur = [];
      }
      function draw() {
        ctx.clearRect(0, 0, W, H);
        const rowH = H / rows;
        ctx.strokeStyle = grid; ctx.lineWidth = 1;
        for (let i = 0; i <= rows; i++) { ctx.beginPath(); ctx.moveTo(0, i * rowH + 0.5); ctx.lineTo(W, i * rowH + 0.5); ctx.stroke(); }
        for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); ctx.stroke(); }
        const line = (row, y0, color, w) => {
          ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineJoin = 'round';
          ctx.beginPath();
          row.forEach((v, k) => { const x = k * 2; const y = y0 + Math.max(-rowH * 0.9, Math.min(rowH * 0.9, v)); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
          ctx.stroke();
        };
        hist.forEach((row, i) => line(row, (i + 0.5) * rowH, old, 1.1));
        const y0 = (rows - 0.5) * rowH;
        line(cur, y0, ink, 1.8);
        const px = cur.length * 2;
        ctx.fillStyle = ink;
        ctx.beginPath(); ctx.arc(px, y0 + (cur[cur.length - 1] || 0), 3.2, 0, Math.PI * 2); ctx.fill();
      }
      function tick(t) {
        const dt = Math.min(64, t - (last || t)); last = t;
        const steps = Math.max(1, Math.round(dt / 16));
        for (let i = 0; i < steps; i++) {
          cur.push(sample());
          if (cur.length * 2 >= W) { hist.push(cur); if (hist.length > rows - 1) hist.shift(); cur = []; }
        }
        draw();
        raf = requestAnimationFrame(tick);
      }
      resize(); seed();
      if (reduced()) { for (let x = 0; x < W * 0.6; x += 2) cur.push(sample()); draw(); }
      else raf = requestAnimationFrame(tick);
      const ro = new ResizeObserver(() => { resize(); seed(); if (reduced()) draw(); });
      ro.observe(canvas);
      return {
        set(m) { mag = Math.max(0, Math.min(10, m || 0)); if (reduced()) { seed(); for (let x = 0; x < W * 0.6; x += 2) cur.push(sample()); draw(); } },
        stop() { cancelAnimationFrame(raf); ro.disconnect(); },
      };
    },
  };

  window.Richter = Richter;
  window.Helicorder = Helicorder;
})();
