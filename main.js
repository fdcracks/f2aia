(function () {
  "use strict";

  /* ===================== Configuración ===================== */
  // ⚠️ WHATSAPP: reemplazá este número con el tuyo real
  // Formato: código de país + código de área + número, SIN el "+"
  // Ejemplo Argentina: 5491123456789 → 54=AR, 9=celular, 11=CABA, 23456789=número
  var WHATSAPP_NUMBER = "PEGAR_AQUI_NUMERO_SIN_SIGNO_MAS";

  // Mensaje que aparece predescrito en el chat de WhatsApp
  var WHATSAPP_MSG = encodeURIComponent("Hola! Vi la web de F2AIA y me interesa automatizar mi negocio.");

  /* ===================== Helpers ===================== */
  const $ = (sel, scope) => (scope || document).querySelector(sel);
  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ===================== NAV ===================== */
  function initNav() {
    const nav = $(".nav");
    const burger = $(".nav-burger");
    if (!nav) return;

    // Scroll state
    function onScroll() {
      nav.classList.toggle("is-scrolled", window.scrollY > 40);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Mobile burger
    if (burger) {
      burger.addEventListener("click", () => {
        const open = nav.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", String(open));
        $(".nav-mobile").setAttribute("aria-hidden", String(!open));
      });
    }

    // Close mobile on link click
    $$(".nav-mobile a").forEach(a => {
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        if (burger) burger.setAttribute("aria-expanded", "false");
        $(".nav-mobile").setAttribute("aria-hidden", "true");
      });
    });
  }

  /* ===================== SMOOTH SCROLL ===================== */
  function initSmoothScroll() {
    document.addEventListener("click", e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 72;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - navH,
        behavior: reduced ? "auto" : "smooth"
      });
    });
  }

  /* ===================== MOUSE REACTIVE GRADIENT ===================== */
  function initHeroGradient() {
    if (!fineHover) return;
    const hero = $(".hero");
    if (!hero) return;

    let mx = 30, my = 40;
    let raf = null;

    hero.addEventListener("mousemove", e => {
      const r = hero.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width) * 100;
      my = ((e.clientY - r.top) / r.height) * 100;
      if (!raf) {
        raf = requestAnimationFrame(update);
      }
    });

    function update() {
      raf = null;
      document.documentElement.style.setProperty("--mx", mx + "%");
      document.documentElement.style.setProperty("--my", my + "%");
    }
  }

  /* ===================== WHATSAPP FAB ===================== */
  function initWhatsAppFab() {
    const fab = $("#wa-fab");
    if (!fab) return;

    // Si el número no fue configurado, mostrar igualmente pero llevar al formulario
    if (!WHATSAPP_NUMBER || WHATSAPP_NUMBER === "PEGAR_AQUI_NUMERO_SIN_SIGNO_MAS") {
      fab.href = "#contacto";
      fab.removeAttribute("target");
      return;
    }

    // Número configurado: armar URL de WhatsApp
    fab.href = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + WHATSAPP_MSG;
  }

  /* ===================== CURSOR ===================== */
  function initCursor() {
    if (!fineHover) return;
    const cursor = $(".cursor");
    const dot = $(".cursor-dot");
    const ring = $(".cursor-ring");
    if (!cursor || !dot || !ring) return;

    let dx = 0, dy = 0;
    let rx = 0, ry = 0;
    let firstMove = false;
    let animId = null;

    function lerp(a, b, t) { return a + (b - a) * t; }

    function tick() {
      rx = lerp(rx, dx, 0.12);
      ry = lerp(ry, dy, 0.12);
      ring.style.left = rx + "px";
      ring.style.top  = ry + "px";
      animId = requestAnimationFrame(tick);
    }

    window.addEventListener("mousemove", e => {
      dx = e.clientX;
      dy = e.clientY;
      dot.style.left = dx + "px";
      dot.style.top  = dy + "px";
      if (!firstMove) {
        firstMove = true;
        rx = dx; ry = dy;
        cursor.classList.add("is-ready");
        tick();
      }
    });

    // Hover state on interactive elements
    const HOVERABLES = 'a, button, [role="button"], input, select, textarea, .servicio-card, .problema-card, .test-card';
    document.addEventListener("mouseover", e => {
      if (e.target.closest(HOVERABLES)) cursor.classList.add("is-hover");
    });
    document.addEventListener("mouseout", e => {
      if (e.target.closest(HOVERABLES)) cursor.classList.remove("is-hover");
    });

    document.addEventListener("mousedown", () => cursor.classList.add("is-click"));
    document.addEventListener("mouseup", () => cursor.classList.remove("is-click"));
  }

  /* ===================== SCROLL REVEALS ===================== */
  function initReveals() {
    const els = $$(".reveal");
    if (!els.length) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.04, rootMargin: "0px 0px -4% 0px" });

    els.forEach(el => io.observe(el));

    // Safety net — force-reveal anything still hidden after 6s
    setTimeout(() => {
      $$(".reveal:not(.is-visible)").forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight * 1.2) {
          el.classList.add("is-visible");
        }
      });
    }, 6000);
  }

  /* ===================== COUNT-UP ===================== */
  function initCountUp() {
    const els = $$(".count-up");
    if (!els.length) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const el = e.target;
        const target = parseInt(el.dataset.target, 10);
        const duration = reduced ? 0 : 1800;
        if (duration === 0) { el.textContent = target; return; }
        const start = performance.now();
        function step(now) {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(eased * target);
          if (t < 1) requestAnimationFrame(step);
          else el.textContent = target;
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.3 });

    els.forEach(el => io.observe(el));
  }

  /* ===================== FAQ ACCORDION ===================== */
  function initFaq() {
    $$(".faq-item").forEach(item => {
      const btn = item.querySelector(".faq-q");
      if (!btn) return;
      btn.addEventListener("click", () => {
        const isOpen = item.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", String(isOpen));
        // close others
        $$(".faq-item.is-open").forEach(other => {
          if (other !== item) {
            other.classList.remove("is-open");
            other.querySelector(".faq-q").setAttribute("aria-expanded", "false");
          }
        });
      });
    });
  }

  /* ===================== FORM ===================== */
  function initForm() {
    const form = $("#form-contacto");
    const btn = $("#btn-submit");
    if (!form || !btn) return;

    // ⚠️ REEMPLAZÁ esta URL con tu webhook de n8n o Make
    // En n8n: Webhook node → copiá "Production URL"
    // En Make: Webhook → copiá la URL del módulo
    var WEBHOOK_URL = "https://n8n.f2aia.com/webhook/f2aia-leads";

    form.addEventListener("submit", async function(e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if (btn.classList.contains("is-sending") || btn.classList.contains("is-sent")) return;

      btn.classList.add("is-sending");
      btn.disabled = true;

      var payload = {
        nombre:   form.nombre.value.trim(),
        negocio:  form.negocio.value,
        whatsapp: form.whatsapp.value.trim(),
        mensaje:  form.mensaje.value.trim(),
        fecha:    new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }),
        origen:   "Landing F2AIA"
      };

      try {
        if (WEBHOOK_URL && WEBHOOK_URL !== "PEGAR_AQUI_URL_DE_N8N_O_MAKE") {
          await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        } else {
          // Sin webhook configurado: simular 1.4s
          await new Promise(function(r) { setTimeout(r, 1400); });
        }
        btn.classList.remove("is-sending");
        btn.classList.add("is-sent");
        setTimeout(function() {
          btn.classList.remove("is-sent");
          btn.disabled = false;
          form.reset();
        }, 3500);
      } catch (err) {
        // Si el webhook falla igual mostramos éxito (el lead no pierde la experiencia)
        console.warn("[form] webhook error:", err);
        btn.classList.remove("is-sending");
        btn.classList.add("is-sent");
        setTimeout(function() {
          btn.classList.remove("is-sent");
          btn.disabled = false;
        }, 3500);
      }
    });
  }

  /* ===================== HERO TITLE HOVER INVERT ===================== */
  function initTitleHover() {
    if (!fineHover) return;
    const title = $(".hero-title");
    if (!title) return;
    // Subtle glow pulse on hover
    title.addEventListener("mouseover", () => {
      title.style.textShadow = "0 0 80px rgba(99,102,241,0.4)";
    });
    title.addEventListener("mouseout", () => {
      title.style.textShadow = "";
    });
  }

  /* ===================== BOOT ===================== */
  function boot() {
    safe(initNav, "initNav");
    safe(initSmoothScroll, "initSmoothScroll");
    safe(initHeroGradient, "initHeroGradient");
    safe(initWhatsAppFab, "initWhatsAppFab");
    safe(initCursor, "initCursor");
    safe(initReveals, "initReveals");
    safe(initCountUp, "initCountUp");
    safe(initFaq, "initFaq");
    safe(initForm, "initForm");
    safe(initTitleHover, "initTitleHover");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
