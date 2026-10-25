(function () {
	"use strict";

	var units = document.getElementById("metricUnits");
	var alerts = document.getElementById("metricAlerts");
	if (units && alerts) {
		var unitTotal = 1284;
		var alertTotal = 47;
		window.setInterval(function () {
			if (Math.random() > 0.65) {
				unitTotal += Math.random() > 0.4 ? 1 : -1;
				units.textContent = unitTotal.toLocaleString("es-MX");
			}
			if (Math.random() > 0.7) {
				alertTotal += 1;
				alerts.textContent = String(alertTotal);
			}
		}, 2800);
	}

	var mobileToggle = document.getElementById("mobileToggle");
	var mobileMenu = document.getElementById("mobileMenu");
	if (mobileToggle && mobileMenu) {
		mobileToggle.addEventListener("click", function () {
			var open = mobileMenu.hasAttribute("hidden");
			if (open) {
				mobileMenu.removeAttribute("hidden");
				mobileMenu.classList.add("open");
			} else {
				mobileMenu.setAttribute("hidden", "");
				mobileMenu.classList.remove("open");
			}
			mobileToggle.setAttribute("aria-expanded", String(open));
		});
	}

	var languageButtons = Array.prototype.slice.call(document.querySelectorAll("#languageToggle, #mobileLanguageToggle"));
	var themeTranslations = [
		[".hero-slide[data-slide='0'] .eyebrow", "Inteligencia para cada ruta", "Intelligence for every route"],
		[".hero-slide[data-slide='0'] h1", "Cada unidad visible. Cada decisión a tiempo.", "Every vehicle visible. Every decision on time."],
		[".hero-slide[data-slide='0'] p", "EnVueMex conecta sus flotas, activos y evidencia de seguridad con rastreo GPS, cámaras de tablero y tecnología respaldada por especialistas para México.", "EnVueMex connects fleets, assets and safety evidence with GPS tracking, dash cams and specialist-backed technology for Mexico."],
		[".hero-slide[data-slide='1'] .eyebrow", "Centro de control", "Control center"],
		[".hero-slide[data-slide='1'] h1", "Controle kilómetros, riesgo y rentabilidad.", "Control mileage, risk and profitability."],
		[".hero-slide[data-slide='1'] p", "Telemetría y señales en vivo para transformar recorridos diarios en una operación más segura, medible y eficiente.", "Telematics and live signals turn daily routes into safer, measurable and more efficient operations."],
		[".hero-slide[data-slide='2'] .eyebrow", "Implementación local", "Local implementation"],
		[".hero-slide[data-slide='2'] h1", "Tecnología que su equipo sí utiliza.", "Technology your team actually uses."],
		[".hero-slide[data-slide='2'] p", "Desde el diagnóstico hasta el soporte continuo, acompañamos a su flota para convertir datos conectados en resultados reales.", "From assessment through ongoing support, we help your fleet turn connected data into real outcomes."],
		[".hero-actions .button-primary", "Solicitar demo →", "Request demo →"],
		[".hero-actions .button-ghost", "Conozca más", "Learn more"],
		[".section-head h2", "Control completo para su operación.", "Complete control for your operation."],
		[".section-head p", "Convierta los datos de flota en decisiones diarias: dónde está cada unidad, cómo se conduce, qué activo necesita atención y dónde puede reducir costo.", "Turn fleet data into daily decisions: where each vehicle is, how it is driven, which asset needs attention and where cost can be reduced."],
		[".rollout-copy h2", "De la evaluación al control total de su flota.", "From assessment to full fleet control."],
		[".rollout-copy p", "Un sistema conectado funciona cuando el despliegue es claro. Explore el proceso que lleva su operación desde la revisión inicial hasta la mejora continua.", "A connected system works when deployment is clear. Explore the process that takes operations from initial review to continuous improvement."],
		[".sectors .section-head h2", "Creada para flotas que mueven México.", "Built for fleets that move Mexico."],
		[".journal .section-head h2", "Conocimiento para gestores de flota.", "Knowledge for fleet managers."],
		[".final-cta h2", "Conectemos su flota con el futuro.", "Connect your fleet with the future."],
		[".final-cta p", "Hable con EnVueMex sobre rutas, activos, cámaras, integración Geotab y soporte para su operación en México.", "Talk with EnVueMex about routes, assets, cameras, Geotab integration and support for your operation in Mexico."]
	];
	function applyLanguage(language) {
		var lang = language === "en" ? "en" : "es";
		document.documentElement.setAttribute("lang", lang);
		document.body.classList.toggle("lang-en", lang === "en");
		document.querySelectorAll("[data-i18n-es][data-i18n-en]").forEach(function (node) {
			node.textContent = node.getAttribute("data-i18n-" + lang);
		});
		themeTranslations.forEach(function (item) {
			var node = document.querySelector(item[0]);
			if (node) {
				node.textContent = lang === "en" ? item[2] : item[1];
			}
		});
		languageButtons.forEach(function (button) {
			button.classList.toggle("active", lang === "en");
			button.setAttribute("aria-pressed", String(lang === "en"));
		});
		try {
			window.localStorage.setItem("envuemex-language", lang);
		} catch (error) {}
	}
	if (languageButtons.length) {
		languageButtons.forEach(function (button) {
			button.addEventListener("click", function () {
				applyLanguage(document.body.classList.contains("lang-en") ? "es" : "en");
			});
		});
		var savedLanguage = "es";
		try {
			savedLanguage = window.localStorage.getItem("envuemex-language") || "es";
		} catch (error) {}
		applyLanguage(savedLanguage);
	}

	var heroSlider = document.getElementById("heroSlider");
	if (heroSlider) {
		var slides = Array.prototype.slice.call(heroSlider.querySelectorAll(".hero-slide"));
		var backgrounds = Array.prototype.slice.call(heroSlider.querySelectorAll(".hero-bg"));
		var selectors = Array.prototype.slice.call(heroSlider.querySelectorAll(".hero-dot"));
		var heroCurrent = document.getElementById("heroCurrent");
		var heroProgress = document.getElementById("heroProgress");
		var heroIndex = 0;
		var heroTimer = null;
		var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		function setHeroSlide(nextIndex) {
			heroIndex = (nextIndex + slides.length) % slides.length;
			slides.forEach(function (slide, index) {
				var active = index === heroIndex;
				slide.classList.toggle("active", active);
				slide.setAttribute("aria-hidden", String(!active));
				if (backgrounds[index]) {
					backgrounds[index].classList.toggle("active", active);
				}
				if (selectors[index]) {
					selectors[index].classList.toggle("active", active);
					selectors[index].setAttribute("aria-pressed", String(active));
				}
			});
			if (heroCurrent) {
				heroCurrent.textContent = "0" + String(heroIndex + 1);
			}
			if (heroProgress) {
				heroProgress.style.animation = "none";
				heroProgress.offsetHeight;
				heroProgress.style.animation = reduceMotion ? "none" : "heroTimeline 6.5s linear forwards";
			}
		}
		function stopHeroRotation() {
			if (heroTimer) {
				window.clearInterval(heroTimer);
				heroTimer = null;
			}
		}
		function startHeroRotation() {
			stopHeroRotation();
			if (!reduceMotion) {
				heroTimer = window.setInterval(function () {
					setHeroSlide(heroIndex + 1);
				}, 6500);
			}
		}
		selectors.forEach(function (selector) {
			selector.addEventListener("click", function () {
				setHeroSlide(Number(selector.getAttribute("data-hero-go")));
				startHeroRotation();
			});
		});
		var heroPrevious = document.getElementById("heroPrevious");
		var heroNext = document.getElementById("heroNext");
		if (heroPrevious) {
			heroPrevious.addEventListener("click", function () {
				setHeroSlide(heroIndex - 1);
				startHeroRotation();
			});
		}
		if (heroNext) {
			heroNext.addEventListener("click", function () {
				setHeroSlide(heroIndex + 1);
				startHeroRotation();
			});
		}
		heroSlider.addEventListener("mouseenter", stopHeroRotation);
		heroSlider.addEventListener("mouseleave", startHeroRotation);
		heroSlider.addEventListener("focusin", stopHeroRotation);
		heroSlider.addEventListener("focusout", startHeroRotation);
		startHeroRotation();
	}

	document.querySelectorAll(".tab-buttons button").forEach(function (button) {
		button.addEventListener("click", function () {
			document.querySelectorAll(".tab-buttons button").forEach(function (item) {
				item.classList.remove("active");
			});
			document.querySelectorAll(".tab-panel").forEach(function (panel) {
				panel.classList.remove("active");
			});
			button.classList.add("active");
			document.getElementById("tab-" + button.getAttribute("data-tab")).classList.add("active");
		});
	});

	var fleetRange = document.getElementById("fleetRange");
	var fleetOutput = document.getElementById("fleetOutput");
	var fuelInput = document.getElementById("fuelInput");
	var savingTotal = document.getElementById("savingTotal");
	function updateSavings() {
		if (!fleetRange || !fuelInput || !savingTotal) {
			return;
		}
		var vehicles = Number(fleetRange.value);
		var monthlyFuel = Number(fuelInput.value) || 0;
		var annualSaving = Math.round(vehicles * monthlyFuel * 12 * 0.12);
		fleetOutput.textContent = String(vehicles);
		savingTotal.textContent = "$" + annualSaving.toLocaleString("es-MX") + " MXN";
	}
	if (fleetRange && fuelInput) {
		fleetRange.addEventListener("input", updateSavings);
		fuelInput.addEventListener("input", updateSavings);
		updateSavings();
	}

	var eventText = document.getElementById("safetyEvent");
	var coaching = document.getElementById("coachingMessage");
	var eventData = {
		safe: { title: "Conducción segura", text: "Sin alertas. La ruta continúa con conducción estable y señal activa." },
		brake: { title: "Frenado brusco", text: "Evento detectado. Revise video y asigne capacitación preventiva al conductor." },
		distracted: { title: "Posible distracción", text: "Alerta prioritaria. Active revisión de evidencia y protocolo de seguridad." }
	};
	document.querySelectorAll(".event-actions button").forEach(function (button) {
		button.addEventListener("click", function () {
			var key = button.getAttribute("data-event");
			document.querySelectorAll(".event-actions button").forEach(function (item) {
				item.classList.remove("active");
			});
			button.classList.add("active");
			eventText.textContent = eventData[key].title;
			coaching.textContent = eventData[key].text;
		});
	});

	var rolloutData = {
		audit: {
			label: "Semana 01 / Diagnóstico",
			title: "Comprendemos su operación antes de instalar.",
			text: "Revisión de unidades, activos, rutas, riesgos y prioridades para diseñar una implementación adecuada a su flota.",
			deliverable: "Mapa de necesidades",
			focus: "Visibilidad"
		},
		install: {
			label: "Semana 02 / Instalación",
			title: "Conectamos unidades y activos críticos.",
			text: "Configuramos equipos, reglas de alerta y tableros para que su operación empiece a generar señales confiables.",
			deliverable: "Flota conectada",
			focus: "Cobertura"
		},
		train: {
			label: "Semana 03 / Adopción",
			title: "Su equipo aprende a actuar sobre los datos.",
			text: "Conductores, supervisores y gestores reciben acompañamiento para aprovechar rutas, video y reportes.",
			deliverable: "Capacitación",
			focus: "Seguridad"
		},
		improve: {
			label: "Continuo / Optimización",
			title: "Medimos resultados y ajustamos la estrategia.",
			text: "Revisamos tendencias, ahorro, incidentes y oportunidades para que la plataforma siga generando valor.",
			deliverable: "Reporte ejecutivo",
			focus: "ROI"
		}
	};
	var rolloutLabel = document.getElementById("rolloutLabel");
	if (rolloutLabel) {
		document.querySelectorAll(".rollout-steps button").forEach(function (button) {
			button.addEventListener("click", function () {
				var data = rolloutData[button.getAttribute("data-rollout")];
				document.querySelectorAll(".rollout-steps button").forEach(function (item) {
					item.classList.remove("active");
					item.setAttribute("aria-selected", "false");
				});
				button.classList.add("active");
				button.setAttribute("aria-selected", "true");
				rolloutLabel.textContent = data.label;
				document.getElementById("rolloutTitle").textContent = data.title;
				document.getElementById("rolloutText").textContent = data.text;
				document.getElementById("rolloutDeliverable").textContent = data.deliverable;
				document.getElementById("rolloutFocus").textContent = data.focus;
			});
		});
	}

	var assistantOpen = document.getElementById("assistantOpen");
	var assistantClose = document.getElementById("assistantClose");
	var assistantPanel = document.getElementById("assistantPanel");
	var messages = document.getElementById("assistantMessages");
	var answers = {
		gps: "El rastreo GPS muestra ubicación, rutas y desempeño operativo para que su equipo actúe con información en tiempo real.",
		cams: "Las cámaras de tablero aportan contexto de seguridad y evidencia para proteger conductores y reducir riesgo.",
		roi: "Use la calculadora de la página para estimar ahorro potencial. Un especialista puede preparar un análisis basado en sus unidades y operación.",
		demo: "Puede solicitar una demostración en la página de Contacto o llamar al 1-703-705-1304 para conversar con el equipo."
	};
	function openAssistant() {
		assistantPanel.removeAttribute("hidden");
		assistantOpen.setAttribute("aria-expanded", "true");
		if (!messages.children.length) {
			messages.innerHTML = '<div class="assistant-message">Hola. Puedo orientarle sobre GPS, seguridad por video, activos o una demostración para su flota.</div>';
		}
	}
	if (assistantOpen && assistantPanel) {
		assistantOpen.addEventListener("click", function () {
			if (assistantPanel.hasAttribute("hidden")) {
				openAssistant();
			} else {
				assistantPanel.setAttribute("hidden", "");
				assistantOpen.setAttribute("aria-expanded", "false");
			}
		});
		assistantClose.addEventListener("click", function () {
			assistantPanel.setAttribute("hidden", "");
			assistantOpen.setAttribute("aria-expanded", "false");
		});
		document.querySelectorAll(".assistant-prompts button").forEach(function (button) {
			button.addEventListener("click", function () {
				openAssistant();
				messages.innerHTML = '<div class="assistant-message">' + answers[button.getAttribute("data-answer")] + "</div>";
			});
		});
	}
})();
