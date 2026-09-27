/* Smooth, inertial (lerp-based) page scrolling powered by Lenis.
 *
 * Wheel input only updates a target position; the real scroll eases toward
 * it every frame, producing the heavy, gliding feel. Touch input keeps
 * native scrolling (Lenis smooths the wheel only), and the whole thing is
 * skipped for reduced-motion users. Other modules route programmatic
 * scrolls through window.MokaLightSmoothScroll so they get the same glide.
 */
(function () {
  "use strict";

  const { onReady } = window.MokaLightUtils;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const available = typeof window.Lenis === "function";

  window.MokaLightSmoothScroll = { active: false, scrollTo: null };

  if (reduceMotion || !available) return;

  onReady(() => {
    const lenis = new window.Lenis({
      lerp: 0.08, // smaller = heavier, slower glide
      smoothWheel: true,
    });

    const raf = (time) => {
      lenis.raf(time);
      window.requestAnimationFrame(raf);
    };
    window.requestAnimationFrame(raf);

    // The mobile drawer is a fixed, scrollable sub-panel; without this the
    // wheel would scroll the page behind it instead of the drawer.
    document.querySelectorAll(".site-header .nav-list").forEach((el) => {
      el.setAttribute("data-lenis-prevent", "");
    });

    // Native scrollIntoView honors scroll-margin-top; Lenis does not, so the
    // offset is read from the target's computed style.
    const scrollTo = (target, options = {}) => {
      const margin = parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
      lenis.scrollTo(target, { offset: -margin, ...options });
    };

    window.MokaLightSmoothScroll = Object.freeze({ active: true, scrollTo, lenis });
  });
})();
