/* Progressive enhancement only. Product content and images are in the HTML. */
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  const gallery = document.querySelector("[data-product-gallery]");
  if (!gallery) return;
  const track = gallery.querySelector("[data-gallery-track]");
  const slides = Array.from(track.querySelectorAll("figure"));
  const dots = Array.from(gallery.querySelectorAll("[data-gallery-slide]"));
  const status = gallery.querySelector("[data-gallery-status]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let current = 0;
  let paused = reducedMotion.matches;
  let timer;
  let scrollFrame;

  function schedule() {
    clearInterval(timer);
    if (!paused && !document.hidden && !gallery.matches(":hover") && !gallery.contains(document.activeElement)) {
      timer = setInterval(() => show(current + 1, false), 5000);
    }
  }
  function stop() {
    paused = true;
    clearInterval(timer);
  }
  function mark(index) {
    current = index;
    dots.forEach((dot, i) => dot.setAttribute("aria-current", String(i === index)));
  }
  function show(index, announce = true) {
    index = (index + slides.length) % slides.length;
    mark(index);
    track.scrollTo({ left: index * track.clientWidth, behavior: reducedMotion.matches ? "instant" : "smooth" });
    if (announce) status.textContent = `Image ${index + 1} of ${slides.length}: ${slides[index].querySelector("img").alt}`;
  }
  dots.forEach((dot, i) => dot.addEventListener("click", () => { stop(); show(i); }));
  gallery.querySelector("[data-gallery-prev]").addEventListener("click", () => { stop(); show(current - 1); });
  gallery.querySelector("[data-gallery-next]").addEventListener("click", () => { stop(); show(current + 1); });
  gallery.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    stop();
    show(event.key === "Home" ? 0 : event.key === "End" ? slides.length - 1 : current + (event.key === "ArrowRight" ? 1 : -1));
  });
  track.addEventListener("pointerdown", stop, { passive: true });
  track.addEventListener("scroll", () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      if (track.clientWidth) mark(Math.min(slides.length - 1, Math.max(0, Math.round(track.scrollLeft / track.clientWidth))));
    });
  }, { passive: true });
  gallery.addEventListener("mouseenter", () => clearInterval(timer));
  gallery.addEventListener("mouseleave", schedule);
  gallery.addEventListener("focusin", () => clearInterval(timer));
  gallery.addEventListener("focusout", () => setTimeout(schedule, 0));
  document.addEventListener("visibilitychange", schedule);
  reducedMotion.addEventListener("change", () => { if (reducedMotion.matches) stop(); });
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => track.scrollTo({ left: current * track.clientWidth, behavior: "instant" })).observe(track);
  }
  gallery.querySelectorAll("[data-gallery-control]").forEach(control => { control.hidden = false; });
  gallery.classList.add("is-enhanced");
  mark(0);
  schedule();
})();

/* Quote heading reveal: lines fade/rise in one by one when scrolled into view.
   Words are grouped into their rendered lines at runtime so the stagger stays
   correct at any viewport width. Skipped for reduced-motion users, and the
   plain heading remains fully readable without JS. */
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  const h2 = document.querySelector(".pd-quote h2");
  if (!h2) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;

  const text = h2.textContent;

  function splitIntoLines() {
    h2.textContent = "";
    const wordSpans = text.trim().split(/\s+/).map((word) => {
      const span = document.createElement("span");
      span.textContent = word;
      h2.append(span, " ");
      return span;
    });
    const lines = [];
    wordSpans.forEach((span) => {
      const last = lines[lines.length - 1];
      if (last && last.top === span.offsetTop) last.words.push(span.textContent);
      else lines.push({ top: span.offsetTop, words: [span.textContent] });
    });
    h2.textContent = "";
    lines.forEach((line, i) => {
      const wrap = document.createElement("span");
      wrap.className = "pd-line";
      wrap.style.setProperty("--i", i);
      wrap.textContent = line.words.join(" ");
      h2.append(wrap, " ");
    });
  }

  splitIntoLines();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(splitIntoLines, 200);
  });

  // Re-arms on exit so the reveal replays each time the heading is scrolled
  // into view, not only on the first visit (a one-shot observer also appeared
  // "already played" when the browser restored a mid-page scroll position).
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      h2.classList.toggle("is-inview", entry.isIntersecting);
    });
  }, { threshold: 0.35 });
  observer.observe(h2);

  // FAQ items: fast fade-up with a small stagger, same replayable trigger.
  const faqGrid = document.querySelector(".pd-faq-grid");
  if (faqGrid) {
    faqGrid.classList.add("reveal-ready");
    Array.from(faqGrid.children).forEach((item, i) => item.style.setProperty("--i", i));
    const faqObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        faqGrid.classList.toggle("is-inview", entry.isIntersecting);
      });
    }, { threshold: 0.15 });
    faqObserver.observe(faqGrid);
  }
})();
