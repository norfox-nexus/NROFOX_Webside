/* ═══════════════════════════════════════════════════════════════════════════
   NORFOX — vanilla JS
   No React, no Babel. Small, fast.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ─── Language toggle ──────────────────────────────────────────────────── */
  const SV = window.NORFOX_SV || {};
  const i18nNodes = () => document.querySelectorAll("[data-i18n]");
  const enCache = new Map();
  let currentLang = localStorage.getItem("norfox_lang") || "en";

  function cacheEnglish() {
    i18nNodes().forEach((el) => {
      const k = el.getAttribute("data-i18n");
      if (!enCache.has(k)) enCache.set(k, el.innerHTML);
    });
  }
  function applyLang(lang) {
    cacheEnglish();
    i18nNodes().forEach((el) => {
      const k = el.getAttribute("data-i18n");
      if (lang === "sv") {
        if (SV[k] !== undefined) el.innerHTML = SV[k];
      } else {
        if (enCache.has(k)) el.innerHTML = enCache.get(k);
      }
    });
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-lang]").forEach((el) => {
      el.classList.toggle("is-active", el.getAttribute("data-lang") === lang);
    });
    document.querySelectorAll(".lang-toggle button").forEach((b) => {
      b.classList.toggle("on", b.dataset.lang === lang);
    });
    currentLang = lang;
    localStorage.setItem("norfox_lang", lang);
  }
  document.addEventListener("click", (e) => {
    const t = e.target.closest(".lang-toggle button");
    if (!t) return;
    applyLang(t.dataset.lang);
  });

  /* ─── Mobile menu ──────────────────────────────────────────────────────── */
  const topbar = document.querySelector(".topbar");
  document.addEventListener("click", (e) => {
    if (e.target.closest(".menu-toggle")) {
      topbar.classList.toggle("menu-open");
    } else if (e.target.closest(".nav a")) {
      topbar.classList.remove("menu-open");
    }
  });

  /* ─── Reveal on scroll ─────────────────────────────────────────────────── */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -80px 0px", threshold: 0.05 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
  }

  /* ─── Capabilities slider ──────────────────────────────────────────────── */
  (function initCapSlider() {
    const root = document.querySelector("[data-cap-slider]");
    if (!root) return;
    const slides = Array.from(root.querySelectorAll(".cap-slide"));
    const thumbs = Array.from(root.querySelectorAll(".cap-thumb"));
    if (!slides.length) return;

    let idx = 0;
    let timer = null;

    function go(n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle("is-active", i === idx));
      thumbs.forEach((t, i) => {
        t.classList.toggle("is-active", i === idx);
        t.setAttribute("aria-selected", i === idx ? "true" : "false");
      });
    }
    function next() { go(idx + 1); }
    function prev() { go(idx - 1); }
    function resetTimer() {
      if (timer) clearInterval(timer);
      timer = setInterval(next, 6500);
    }

    root.querySelector(".cap-prev")?.addEventListener("click", () => { prev(); resetTimer(); });
    root.querySelector(".cap-next")?.addEventListener("click", () => { next(); resetTimer(); });
    thumbs.forEach((t) => {
      t.addEventListener("click", () => {
        const n = parseInt(t.getAttribute("data-go"), 10) || 0;
        go(n);
        resetTimer();
      });
    });

    /* basic touch swipe */
    let touchX = null;
    const stage = root.querySelector(".cap-stage");
    stage?.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    stage?.addEventListener("touchend", (e) => {
      if (touchX == null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); resetTimer(); }
      touchX = null;
    });

    /* pause autoplay when offscreen */
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) resetTimer();
          else if (timer) { clearInterval(timer); timer = null; }
        });
      }, { threshold: 0.2 });
      io.observe(root);
    } else {
      resetTimer();
    }
  })();

  /* ─── Scroll-spy: highlight current nav link ───────────────────────────── */
  (function initScrollSpy() {
    const links = Array.from(document.querySelectorAll(".nav a"));
    const sections = [];
    links.forEach((a) => {
      const id = (a.getAttribute("href") || "").replace("#", "");
      const sec = id && document.getElementById(id);
      if (sec) sections.push({ sec, link: a });
    });
    if (!sections.length) return;

    let current = null;
    function update() {
      // trigger line ~30% down from the top of the viewport
      const line = window.scrollY + window.innerHeight * 0.3;
      let active = sections[0];
      for (const s of sections) {
        if (s.sec.offsetTop <= line) active = s;
        else break;
      }
      // near the very bottom, force the last section
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
        active = sections[sections.length - 1];
      }
      if (active.link === current) return;
      current = active.link;
      links.forEach((l) => l.classList.toggle("is-current", l === current));
    }

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  })();

  /* ─── Contact form → mailto ────────────────────────────────────────────── */
  const form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name    = (data.get("name")    || "").toString().trim();
      const company = (data.get("company") || "").toString().trim();
      const email   = (data.get("email")   || "").toString().trim();
      const topic   = (data.get("topic")   || "Simulation").toString().trim();
      const message = (data.get("message") || "").toString().trim();

      if (!name || !email || !message) {
        alert(currentLang === "sv"
          ? "Lägg till namn, e-post och meddelande innan du skickar."
          : "Please add your name, email, and message before sending.");
        return;
      }
      const subject = encodeURIComponent(`NORFOX — ${topic} — ${name}`);
      const body = encodeURIComponent(
        `Name: ${name}\nCompany: ${company}\nEmail: ${email}\nTopic: ${topic}\n\nMessage:\n${message}`
      );
      window.location.href = `mailto:info@norfox.se?subject=${subject}&body=${body}`;
    });
  }

  /* ─── Init ──────────────────────────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", () => {
    applyLang(currentLang);
  });
  if (document.readyState !== "loading") applyLang(currentLang);
})();
