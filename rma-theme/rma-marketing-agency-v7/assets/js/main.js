/* RMA Marketing Agency v7 — no dependencies. */
(() => {
	const root = document.documentElement;
	const motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const store = {
		get(key) {
			try { return window.sessionStorage.getItem(key); } catch (e) { return null; }
		},
		set(key, value) {
			try { window.sessionStorage.setItem(key, value); } catch (e) { /* private mode */ }
		},
	};

	/* ---------- Intro: the web, 1990 to now ---------- */

	const ready = () => root.classList.add("is-ready");
	const intro = document.querySelector("[data-intro]");

	if (!intro || root.classList.contains("intro-done")) {
		intro?.remove();
		ready();
	} else {
		const scenes = [...intro.querySelectorAll("[data-scene]")];
		const years = [...intro.querySelectorAll(".intro-years li")];
		const bar = intro.querySelector("[data-intro-bar]");
		const skip = intro.querySelector("[data-intro-skip]");
		const STEP = 560;
		let index = -1;
		let timer = 0;
		let done = false;

		root.classList.add("intro-running");

		const finish = () => {
			if (done) return;
			done = true;
			window.clearTimeout(timer);
			store.set("rmaIntroSeen", "1");
			intro.classList.add("is-leaving");
			root.classList.remove("intro-running");
			window.setTimeout(ready, 250);
			window.setTimeout(() => intro.remove(), 950);
		};

		const show = (i) => {
			scenes.forEach((scene, n) => scene.classList.toggle("is-active", n === i));
			years.forEach((year, n) => year.classList.toggle("is-on", n <= i));
			bar.style.setProperty("--p", `${((i + 1) / scenes.length) * 100}%`);
		};

		const next = () => {
			index += 1;
			if (index >= scenes.length) {
				finish();
				return;
			}
			show(index);
			// The last era lingers so the answer has time to land.
			timer = window.setTimeout(next, index === scenes.length - 1 ? 1500 : STEP);
		};

		skip.addEventListener("click", finish);
		document.addEventListener("keydown", (e) => {
			if (e.key === "Escape") finish();
		});
		next();
	}

	/* ---------- Header ---------- */

	const header = document.querySelector("[data-header]");
	const onScroll = () => header?.classList.toggle("is-scrolled", window.scrollY > 24);
	window.addEventListener("scroll", onScroll, { passive: true });
	onScroll();

	const toggle = document.querySelector("[data-nav-toggle]");
	const links = document.querySelector("[data-nav-links]");
	if (toggle && links) {
		const setOpen = (open) => {
			toggle.setAttribute("aria-expanded", String(open));
			links.classList.toggle("is-open", open);
		};
		toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
		document.addEventListener("keydown", (e) => {
			if (e.key === "Escape") setOpen(false);
		});
		links.addEventListener("click", (e) => {
			if (e.target.closest("a")) setOpen(false);
		});
	}

	/* ---------- Reveals, counters, charts ---------- */

	const countUp = (el) => {
		const target = parseFloat(el.dataset.count);
		const decimals = Number(el.dataset.decimals || 0);
		const prefix = el.dataset.prefix || "";
		const suffix = el.dataset.suffix || "";
		const start = performance.now();
		const tick = (now) => {
			const t = Math.min((now - start) / 1400, 1);
			const eased = 1 - Math.pow(1 - t, 4);
			el.textContent = `${prefix}${(target * eased).toFixed(decimals)}${suffix}`;
			if (t < 1) requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	};

	const revealables = document.querySelectorAll(".reveal");
	if ("IntersectionObserver" in window) {
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (!entry.isIntersecting) return;
					entry.target.classList.add("is-in");
					if (motionOK) entry.target.querySelectorAll("[data-count]").forEach(countUp);
					io.unobserve(entry.target);
				});
			},
			{ threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
		);
		revealables.forEach((el) => io.observe(el));
	} else {
		revealables.forEach((el) => el.classList.add("is-in"));
	}

	/* ---------- Statement: words light up as you read ---------- */

	const statement = document.querySelector("[data-words]");
	if (statement) {
		const accent = new Set(["under", "one", "roof."]);
		statement.innerHTML = statement.textContent
			.trim()
			.split(/\s+/)
			.map((w) => `<span class="w${accent.has(w) ? " is-accent" : ""}">${w}</span>`)
			.join(" ");
		const words = [...statement.querySelectorAll(".w")];
		if (!motionOK) {
			words.forEach((w) => w.classList.add("is-lit"));
		} else {
			let ticking = false;
			const paint = () => {
				ticking = false;
				const rect = statement.getBoundingClientRect();
				const vh = window.innerHeight;
				// 0 when the block enters the lower third, 1 when it reaches the upper third.
				const progress = Math.min(Math.max((vh * 0.85 - rect.top) / (rect.height + vh * 0.35), 0), 1);
				const lit = Math.round(progress * words.length);
				words.forEach((w, i) => w.classList.toggle("is-lit", i < lit));
			};
			window.addEventListener("scroll", () => {
				if (!ticking) {
					ticking = true;
					requestAnimationFrame(paint);
				}
			}, { passive: true });
			paint();
		}
	}

	/* ---------- Cursor spotlight on cards ---------- */

	document.querySelectorAll("[data-spotlight]").forEach((el) => {
		el.addEventListener("pointermove", (e) => {
			const r = el.getBoundingClientRect();
			el.style.setProperty("--mx", `${e.clientX - r.left}px`);
			el.style.setProperty("--my", `${e.clientY - r.top}px`);
		});
	});

	/* ---------- Magnetic buttons ---------- */

	if (motionOK && window.matchMedia("(hover: hover)").matches) {
		document.querySelectorAll("[data-magnetic]").forEach((btn) => {
			btn.addEventListener("pointermove", (e) => {
				const r = btn.getBoundingClientRect();
				const x = (e.clientX - r.left - r.width / 2) / r.width;
				const y = (e.clientY - r.top - r.height / 2) / r.height;
				btn.style.transform = `translate(${x * 10}px, ${y * 8}px)`;
			});
			btn.addEventListener("pointerleave", () => {
				btn.style.transform = "";
			});
		});
	}

	/* ---------- Command center ---------- */

	const stages = document.querySelector("[data-stages]");
	const engine = document.querySelector("[data-engine]");
	if (stages && engine) {
		const tabs = [...stages.querySelectorAll("[data-stage]")];
		const nodes = [...engine.querySelectorAll("[data-node]")];
		const outs = [...engine.querySelectorAll("[data-out]")];
		const wire = engine.querySelector(".engine-wire-lit");
		const STAGE_MS = 4500;
		let current = 0;
		let timer = 0;
		let visible = false;
		let userPicked = false;

		stages.style.setProperty("--stage-ms", `${STAGE_MS}ms`);

		const select = (i) => {
			current = i;
			tabs.forEach((tab, n) => {
				tab.setAttribute("aria-selected", String(n === i));
				tab.tabIndex = n === i ? 0 : -1;
			});
			nodes.forEach((node, n) => {
				node.classList.toggle("is-on", n === i);
				node.classList.toggle("is-done", n < i);
			});
			outs.forEach((out, n) => {
				out.hidden = n !== i;
			});
			wire.style.setProperty("--lit", String(i / (nodes.length - 1)));
			engine.querySelector("[role=tabpanel]").setAttribute("aria-labelledby", tabs[i].id);
		};

		const schedule = () => {
			window.clearTimeout(timer);
			if (!motionOK || userPicked || !visible) return;
			timer = window.setTimeout(() => {
				select((current + 1) % tabs.length);
				// Restart the progress bar animation on the new tab.
				schedule();
			}, STAGE_MS);
		};

		tabs.forEach((tab, i) => {
			tab.addEventListener("click", () => {
				userPicked = true;
				stages.classList.add("is-paused");
				window.clearTimeout(timer);
				select(i);
			});
			tab.addEventListener("keydown", (e) => {
				const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
				if (!dir) return;
				e.preventDefault();
				const n = (i + dir + tabs.length) % tabs.length;
				tabs[n].focus();
				tabs[n].click();
			});
		});

		if (!motionOK) stages.classList.add("is-paused");

		new IntersectionObserver(([entry]) => {
			visible = entry.isIntersecting;
			stages.classList.toggle("is-paused", !visible || userPicked || !motionOK);
			if (visible) schedule();
			else window.clearTimeout(timer);
		}, { threshold: 0.35 }).observe(engine);

		select(0);
	}
})();
