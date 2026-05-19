(() => {
  const html = document.documentElement;

  /* ---------- Language toggle ---------- */
  const storedLang = localStorage.getItem("envue-lang");
  const initialLang = storedLang === "en" || storedLang === "es" ? storedLang : "es";
  setLang(initialLang);

  document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.dataset.langBtn));
  });

  function setLang(lang) {
    html.setAttribute("lang", lang);
    html.dataset.lang = lang;
    document.querySelectorAll("[data-es]").forEach((el) => {
      const val = el.getAttribute(`data-${lang}`);
      if (val == null) return;
      if (el.tagName === "META") {
        el.setAttribute("content", val);
      } else if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.setAttribute("placeholder", val);
      } else {
        el.textContent = val;
      }
    });
    document.querySelectorAll("[data-lang-btn]").forEach((b) => {
      const active = b.dataset.langBtn === lang;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", active ? "true" : "false");
    });
    try { localStorage.setItem("envue-lang", lang); } catch (e) {}
  }

  /* ---------- Sticky-nav state + mobile toggle ---------- */
  const nav = document.getElementById("nav");
  const navToggle = nav.querySelector(".nav__toggle");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  nav.querySelectorAll(".nav__links a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    })
  );

  /* ---------- Reveal on scroll ---------- */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -60px 0px", threshold: 0.05 }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Year ---------- */
  const yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();
})();
