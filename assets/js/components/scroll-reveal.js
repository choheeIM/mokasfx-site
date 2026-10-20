/* Reveal enhancement for existing Solutions markup and dynamically inserted scenes. */
(function () {
  "use strict";

  const { onReady } = window.MokaLightUtils || {
    // fallback so a failed utils.js request can't take down every component
    onReady: (cb) => {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", cb, { once: true });
      } else {
        cb();
      }
    },
  };
  let observer = null;
  let reducedMotion = false;

  const observe = (target) => {
    if (!target) return;
    if (reducedMotion || !observer) {
      target.classList.add("is-visible");
      return;
    }
    observer.observe(target);
  };

  window.MokaLightScrollReveal = { observe };

  onReady(() => {
    const solutionsPage = document.querySelector("[data-solutions-page]");
    if (!solutionsPage) return;

    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reducedMotion && "IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries, io) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    }

    solutionsPage.querySelectorAll("[data-reveal], [data-solution-showcase-scene]")
      .forEach(observe);
  });
})();

