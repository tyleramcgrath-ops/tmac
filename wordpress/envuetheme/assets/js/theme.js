document.addEventListener('DOMContentLoaded', function() {
  // ── Nav scroll state
  const nav = document.querySelector('.nav');
  const heroSection = document.querySelector('.hero');
  const heroIsDark = heroSection && heroSection.classList.contains('hero');
  const updateNav = () => {
    const scrolled = window.scrollY > 60;
    nav.classList.toggle('nav--scrolled', scrolled);
  };
  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });

  // ── Scroll fade-in (Emil stagger)
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: 0.07 }
  );
  document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));

  // ── Count-up
  function countUp(el) {
    const target = +el.dataset.t, dur = 1400;
    const step = target / (dur / 16); let v = 0;
    const t = setInterval(() => {
      v = Math.min(v + step, target);
      el.textContent = Math.round(v);
      if (v >= target) clearInterval(t);
    }, 16);
  }
  const heroObs = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.querySelectorAll('.cu').forEach(countUp); heroObs.unobserve(e.target); }
  }), { threshold: 0.4 });
  const hs = document.querySelector('.hero-strip') || document.querySelector('.hero-stats');
  if (hs) heroObs.observe(hs);

  // ── Hero slider
  (function() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots   = document.querySelectorAll('.hero-dot');
    let current  = 0, timer;

    function goTo(i) {
      slides[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = (i + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
    }

    function startTimer() {
      clearInterval(timer);
      timer = setInterval(() => goTo(current + 1), 6000);
    }

    dots.forEach(dot => {
      dot.addEventListener('click', () => { goTo(+dot.dataset.slide); startTimer(); });
    });

    startTimer();
  })();

  // ── Platform section tabs (top nav + sidebar sync)
  function activatePanel(i) {
    document.querySelectorAll('.hp-tab').forEach(t => t.classList.remove('is-on'));
    document.querySelectorAll('.hp-sitem').forEach(s => s.classList.remove('is-on'));
    document.querySelectorAll('.hp-panel').forEach(p => p.classList.remove('is-open'));
    const tab = document.querySelector('.hp-tab[data-panel="' + i + '"]');
    const sitem = document.querySelector('.hp-sitem[data-target="' + i + '"]');
    const panel = document.getElementById('hp-panel-' + i);
    if (tab) tab.classList.add('is-on');
    if (sitem) sitem.classList.add('is-on');
    if (panel) panel.classList.add('is-open');
  }
  document.querySelectorAll('.hp-tab').forEach(t => {
    t.addEventListener('click', () => activatePanel(t.dataset.panel));
  });
  document.querySelectorAll('.hp-sitem').forEach(s => {
    s.addEventListener('click', () => activatePanel(s.dataset.target));
  });

  // ── Results tabs
  const CHECK = `<span class="check-icon"><svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#1366DF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
  const panels = {
    safety:        { stat:'31%',  img:'https://envuetelematics.com/wp-content/uploads/2024/12/Greater-Visibility-into-Your-Operation-panorama-635x0-1.webp', label:'Reduction in Annual Reportable Accidents', desc:'AI dash cams build a documented record that protects your company in litigation and coaches drivers before incidents happen.', bullets:['AI-triggered video on every hard event','Real-time in-cab distracted driving alerts','Automated scorecards and coaching queues','Exonerating footage delivered in seconds'] },
    productivity:  { stat:'40%',  img:'https://tyleramcgrath-ops.github.io/tmac/images/hero-truck-sunset.webp', label:'Improvement in Dispatch Efficiency', desc:'Real-time visibility, dynamic dispatching, and route optimization eliminate wasted miles and make every driver a high-output field asset.', bullets:['Live location on one unified map','Dynamic job assignment by proximity','Automated trip reporting and time tracking','Customer ETA notifications built in'] },
    optimization:  { stat:'7%',   img:'https://tyleramcgrath-ops.github.io/tmac/images/delivery-van.jpg', label:'Fuel Economy Improvement Fleet-Wide', desc:'Idle reduction, fuel card integration, and MPG benchmarking turn fuel spend from a black hole into a reportable, controllable cost.', bullets:['Per-driver idle time and dollar cost reporting','Fuel card fraud detection and spend controls','Diagnostic alerts before costly breakdowns','Cost-per-mile benchmarking by vehicle'] },
    sustainability:{ stat:'15%',  img:'https://envuetelematics.com/wp-content/uploads/2024/12/construction.jpg', label:'Reduction in Fleet Carbon Emissions', desc:'Identify your highest-emitting vehicles, plan your EV transition with real utilization data, and report sustainability metrics automatically.', bullets:['Emissions tracking by vehicle and route','EV range and charge status monitoring','Carbon footprint dashboards for stakeholders','Sustainability reporting built into the platform'] },
    compliance:    { stat:'100%', img:'https://tyleramcgrath-ops.github.io/tmac/images/truck-driver.jpg', label:'Audit-Ready Every Single Day', desc:'Automated HOS tracking, FMCSA/DOT reporting, and pre/post-trip inspection management keep your fleet compliant without manual paperwork.', bullets:['ELD and hours-of-service automation','DOT/FMCSA/FDA regulation tracking','Electronic DVIR and inspection logs','Automated IFTA fuel tax reporting'] },
    expandability: { stat:'300+', img:'https://tyleramcgrath-ops.github.io/tmac/images/hero-network.webp', label:'Software and Hardware Integrations', desc:"Built on the world's largest open telematics platform. Connect dispatch, ERP, fuel cards, and cameras; add hardware any time.", bullets:['Open API with 300+ software integrations','Plug-and-play hardware extensibility','Consolidated multi-system reporting','Custom dashboards and alert configurations'] },
  };
  document.querySelectorAll('.rtab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.rtab').forEach(t => t.classList.remove('on'));
      tab.classList.add('on');
      const p = panels[tab.dataset.p];
      document.getElementById('rpStat').textContent  = p.stat;
      document.getElementById('rpLabel').textContent = p.label;
      document.getElementById('rpDesc').textContent  = p.desc;
      document.getElementById('rpImg').src           = p.img;
      document.getElementById('rpBullets').innerHTML = p.bullets.map(b => `<li>${CHECK}${b}</li>`).join('');
    });
  });

  // ── Inner page: fade-up scroll animations
  const fadeUpObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        fadeUpObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fade-up').forEach(el => fadeUpObs.observe(el));
});
