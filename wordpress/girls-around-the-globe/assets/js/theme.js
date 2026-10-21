/* Girls Around the Globe theme: menu, "I'm looking for" picker, swipe demo, city explorer. */
(function () {
  "use strict";

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") node.textContent = attrs[k];
      else if (k === "class") node.className = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function readJSON(root, selector) {
    var node = root.querySelector(selector);
    try { return node ? JSON.parse(node.textContent) : null; } catch (e) { return null; }
  }

  var HEART = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20.5s-7-4.3-9.2-8.7A5.3 5.3 0 0 1 12 6.4a5.3 5.3 0 0 1 9.2 5.4c-2.2 4.4-9.2 8.7-9.2 8.7z"/></svg>';

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- "I'm looking for" picker ---------- */
  var picker = document.querySelector("[data-picker]");
  if (picker) {
    var base = picker.getAttribute("data-join-base");
    var cta = picker.querySelector("[data-cta]");
    var label = picker.querySelector("[data-cta-label]");
    var select = document.querySelector("[data-looking-select]");
    picker.querySelectorAll("[data-looking]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        picker.querySelectorAll("[data-looking]").forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
        var looking = chip.getAttribute("data-looking");
        label.textContent = chip.getAttribute("data-cta");
        if (base) {
          var url = new URL(base, window.location.href);
          url.searchParams.set("looking", looking);
          cta.href = url.toString();
        }
        // Carry the choice into the sign-up form on this page.
        if (select) select.value = looking;
      });
    });
  }

  /* ---------- Swipe demo ---------- */
  var demo = document.querySelector("[data-demo]");
  if (demo) {
    var profiles = readJSON(demo, "[data-demo-profiles]") || [];
    var strings = readJSON(demo, "[data-demo-strings]") || {};
    var deck = demo.querySelector("[data-deck]");
    var likeBtn = demo.querySelector("[data-like]");
    var passBtn = demo.querySelector("[data-pass]");
    var count = demo.querySelector("[data-count]");
    var index = 0;
    var busy = false;
    var SWIPE_AT = 110;

    function cardFor(p, i, isNext) {
      var bars = profiles.map(function (_, k) { return el("span", { class: k <= i ? "on" : "" }); });
      var img = el("img", { src: p.photo, alt: isNext ? "" : p.alt, draggable: "false" });
      img.style.objectPosition = p.pos;
      var card = el("article", { class: "card" + (isNext ? " is-next" : ""), "aria-label": p.name + ", " + p.age + ", " + p.city }, [
        img,
        el("div", { class: "card-shade", "aria-hidden": "true" }),
        el("span", { class: "stamp stamp-like", "aria-hidden": "true", text: "LIKE" }),
        el("span", { class: "stamp stamp-pass", "aria-hidden": "true", text: "PASS" }),
        el("div", { class: "progress", "aria-hidden": "true" }, bars),
        el("div", { class: "card-info" }, [
          el("p", { class: "card-name" }, [el("strong", { text: p.name }), el("span", { text: String(p.age) }), el("i", { text: "✓", title: "Verified" })]),
          el("p", { class: "card-city", text: p.city + " · " + p.langs }),
          el("div", { class: "tags" }, [el("span", { class: "tag tag-gold", text: p.wants }), el("span", { class: "tag", text: p.tag })]),
          el("p", { class: "card-quote", text: "“" + p.quote + "”" })
        ])
      ]);
      if (isNext) card.setAttribute("aria-hidden", "true");
      return card;
    }

    function endCard() {
      var restart = el("button", { type: "button", class: "text-btn", text: "Start over" });
      restart.addEventListener("click", function () { index = 0; render(); });
      return el("div", { class: "deck-end pop" }, [
        el("img", { src: strings.logo, alt: "" }),
        el("h3", { class: "serif", text: "That’s today’s preview." }),
        el("p", { class: "dim", text: "Make a free profile to meet real women and see who has already liked you." }),
        el("a", { class: "btn btn-gold", href: strings.join, text: "Create my free profile" }),
        restart
      ]);
    }

    function showMatch(p) {
      var faceImg = el("img", { src: p.photo, alt: "" });
      faceImg.style.objectPosition = p.pos;
      var heart = el("span", { class: "match-heart" });
      heart.innerHTML = HEART;
      var keep = el("button", { type: "button", class: "text-btn", text: "Keep browsing" });
      var dialog = el("div", { class: "match pop", role: "dialog", "aria-label": "It’s mutual" }, [
        el("div", { class: "match-faces" }, [el("span", { class: "match-face" }, [faceImg]), heart, el("span", { class: "match-face you", text: "You" })]),
        el("h3", { class: "gold", text: "It’s mutual." }),
        el("p", { class: "dim", text: "You and " + p.name + " liked each other. Say hello, or ask for a video date." }),
        el("a", { class: "btn btn-gold", href: strings.join, text: "Ask " + p.name + " for a video date" }),
        keep
      ]);
      keep.addEventListener("click", function () { dialog.remove(); likeBtn.focus(); });
      deck.appendChild(dialog);
      keep.focus();
    }

    function render() {
      deck.textContent = "";
      var done = index >= profiles.length;
      likeBtn.disabled = passBtn.disabled = done;
      count.textContent = Math.min(index + 1, profiles.length) + " / " + profiles.length;
      if (done) { deck.appendChild(endCard()); return; }
      if (profiles[index + 1]) deck.appendChild(cardFor(profiles[index + 1], index + 1, true));
      var top = cardFor(profiles[index], index, false);
      deck.appendChild(top);
      enableDrag(top);
    }

    function decide(liked, card) {
      if (busy || index >= profiles.length) return;
      busy = true;
      var p = profiles[index];
      card = card || deck.querySelector(".card:not(.is-next)");
      card.classList.remove("is-dragging");
      card.style.transform = liked ? "translateX(140%) rotate(22deg)" : "translateX(-140%) rotate(-22deg)";
      card.style.opacity = "0";
      window.setTimeout(function () {
        index += 1;
        busy = false;
        render();
        if (liked && p.likesBack) showMatch(p);
      }, 320);
    }

    function enableDrag(card) {
      var startX = 0, dx = 0, dragging = false;
      var like = card.querySelector(".stamp-like");
      var pass = card.querySelector(".stamp-pass");
      card.addEventListener("pointerdown", function (e) {
        if (busy) return;
        dragging = true; startX = e.clientX; dx = 0;
        card.setPointerCapture(e.pointerId);
        card.classList.add("is-dragging");
      });
      card.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        dx = e.clientX - startX;
        card.style.transform = "translateX(" + dx + "px) rotate(" + dx / 18 + "deg)";
        like.style.opacity = Math.max(0, Math.min(1, dx / SWIPE_AT));
        pass.style.opacity = Math.max(0, Math.min(1, -dx / SWIPE_AT));
      });
      function end() {
        if (!dragging) return;
        dragging = false;
        if (Math.abs(dx) > SWIPE_AT) { decide(dx > 0, card); return; }
        card.classList.remove("is-dragging");
        card.style.transform = "";
        like.style.opacity = pass.style.opacity = 0;
      }
      card.addEventListener("pointerup", end);
      card.addEventListener("pointercancel", end);
    }

    likeBtn.addEventListener("click", function () { decide(true); });
    passBtn.addEventListener("click", function () { decide(false); });
    if (profiles.length) render();
  }

  /* ---------- City explorer ---------- */
  var cities = document.querySelector("[data-cities]");
  if (cities) {
    var data = readJSON(cities, "[data-cities-json]") || [];
    var buttons = cities.querySelectorAll(".city");
    var fields = {};
    cities.querySelectorAll("[data-f]").forEach(function (n) { fields[n.getAttribute("data-f")] = n; });
    var selected = 0;

    function timeIn(tz, at) {
      return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(at).toLowerCase();
    }
    function hourIn(tz, at) {
      return Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(at)) % 24;
    }
    function mood(city, h) {
      if (h >= 18 && h < 23) return "It’s evening in " + city + ". The perfect time for a video date.";
      if (h >= 23 || h < 6) return "It’s late in " + city + ". Leave her a message to wake up to.";
      if (h < 12) return "It’s morning in " + city + ". Say good morning before her coffee gets cold.";
      return "It’s afternoon in " + city + ". Plan something for tonight.";
    }
    function paint() {
      var now = new Date();
      buttons.forEach(function (b, i) {
        b.querySelector("[data-time]").textContent = timeIn(data[i].tz, now);
        b.setAttribute("aria-pressed", i === selected ? "true" : "false");
      });
      var c = data[selected];
      fields.city.textContent = c.city;
      fields.city2.textContent = c.city;
      fields.country.textContent = c.country;
      fields.lang.textContent = c.lang;
      fields.date.textContent = c.date;
      fields.time.textContent = timeIn(c.tz, now);
      fields.mood.textContent = mood(c.city, hourIn(c.tz, now));
    }
    buttons.forEach(function (b, i) {
      b.addEventListener("click", function () {
        selected = i;
        paint();
        var panel = cities.querySelector(".city-panel");
        panel.classList.remove("pop"); void panel.offsetWidth; panel.classList.add("pop");
      });
    });
    if (data.length) { paint(); window.setInterval(paint, 20000); }
  }
})();
