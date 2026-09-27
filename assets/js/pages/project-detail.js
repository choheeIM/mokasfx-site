/* ============================================================
   PROJECT DETAIL PAGE — gallery carousel + scroll reveal
   ============================================================ */
(function () {
  "use strict";

  const onReady = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  };

  onReady(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- gallery carousel ---------- */
    const gallery = document.querySelector("[data-pjd-gallery]");
    if (gallery) {
      const viewport = gallery.querySelector(".pjd-gallery-viewport");
      const track = gallery.querySelector(".pjd-gallery-track");
      const slides = Array.from(track.children);
      const prevBtn = gallery.querySelector(".pjd-gallery-btn--prev");
      const nextBtn = gallery.querySelector(".pjd-gallery-btn--next");
      const dotsWrap = gallery.querySelector(".pjd-gallery-dots");
      const counter = gallery.querySelector(".pjd-gallery-count");
      let index = 0;
      let autoTimer = null;

      const dots = slides.map((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "pjd-gallery-dot";
        dot.setAttribute("aria-label", "Go to slide " + (i + 1));
        dot.addEventListener("click", () => {
          goTo(i);
          restartAuto();
        });
        dotsWrap.appendChild(dot);
        return dot;
      });

      const slideWidth = () => viewport.clientWidth;

      const render = () => {
        track.style.transform = "translateX(" + -index * slideWidth() + "px)";
        dots.forEach((dot, i) => {
          dot.classList.toggle("is-active", i === index);
          dot.setAttribute("aria-current", i === index ? "true" : "false");
        });
        if (counter) counter.textContent = (index + 1) + " / " + slides.length;
        slides.forEach((slide, i) => {
          slide.setAttribute("aria-hidden", i === index ? "false" : "true");
        });
      };

      const goTo = (i) => {
        index = (i + slides.length) % slides.length;
        render();
      };

      const stopAuto = () => {
        if (autoTimer) {
          clearInterval(autoTimer);
          autoTimer = null;
        }
      };
      const restartAuto = () => {
        stopAuto();
        if (reducedMotion || slides.length < 2) return;
        autoTimer = setInterval(() => goTo(index + 1), 6500);
      };

      prevBtn.addEventListener("click", () => { goTo(index - 1); restartAuto(); });
      nextBtn.addEventListener("click", () => { goTo(index + 1); restartAuto(); });

      viewport.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") { event.preventDefault(); goTo(index - 1); restartAuto(); }
        if (event.key === "ArrowRight") { event.preventDefault(); goTo(index + 1); restartAuto(); }
      });

      gallery.addEventListener("pointerenter", stopAuto);
      gallery.addEventListener("pointerleave", restartAuto);
      gallery.addEventListener("focusin", stopAuto);
      gallery.addEventListener("focusout", restartAuto);

      /* touch / pointer swipe */
      let startX = null;
      let deltaX = 0;
      viewport.addEventListener("pointerdown", (event) => {
        if (event.button !== undefined && event.button !== 0) return;
        if (event.target.closest("button")) return;
        startX = event.clientX;
        deltaX = 0;
        track.classList.add("is-dragging");
        viewport.setPointerCapture(event.pointerId);
        stopAuto();
      });
      viewport.addEventListener("pointermove", (event) => {
        if (startX === null) return;
        deltaX = event.clientX - startX;
        track.style.transform = "translateX(" + (-index * slideWidth() + deltaX) + "px)";
      });
      const endSwipe = () => {
        if (startX === null) return;
        track.classList.remove("is-dragging");
        if (Math.abs(deltaX) > 48) {
          goTo(index + (deltaX < 0 ? 1 : -1));
        } else {
          render();
        }
        startX = null;
        deltaX = 0;
        restartAuto();
      };
      viewport.addEventListener("pointerup", endSwipe);
      viewport.addEventListener("pointercancel", endSwipe);

      window.addEventListener("resize", () => {
        if (startX === null) render();
      });

      render();
      restartAuto();
    }

    /* ---------- scroll reveal ---------- */
    const revealItems = document.querySelectorAll(".pjd-reveal");
    if (!revealItems.length) return;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -6% 0px" });
    revealItems.forEach((el) => io.observe(el));
  });
})();
