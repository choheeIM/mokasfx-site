/* Homepage partners marquee. */
(function () {
  "use strict";

  const { onReady } = window.MokaLightUtils;
  onReady(() => {
    // ----- Partners marquee: loop a small card queue without duplicating markup -----
    const partnersTrack = document.querySelector('[data-partners-track]');
    if (partnersTrack) {
      const marquee = partnersTrack.closest('.partners-marquee');
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reducedMotion && marquee) {
        let offset = 0;
        let lastTime = performance.now();
        let paused = false;
        const speed = 34;

        const getGap = () => {
          const gap = parseFloat(getComputedStyle(partnersTrack).columnGap);
          return Number.isFinite(gap) ? gap : 0;
        };

        const step = (time) => {
          const delta = Math.min(64, time - lastTime);
          lastTime = time;

          if (!paused) {
            offset -= (speed * delta) / 1000;
            const firstCard = partnersTrack.firstElementChild;
            if (firstCard) {
              const cardWidth = firstCard.getBoundingClientRect().width + getGap();
              if (Math.abs(offset) >= cardWidth) {
                partnersTrack.appendChild(firstCard);
                offset += cardWidth;
              }
            }
            partnersTrack.style.transform = `translateX(${offset}px)`;
          }

          window.requestAnimationFrame(step);
        };

        marquee.addEventListener('mouseenter', () => { paused = true; });
        marquee.addEventListener('mouseleave', () => { paused = false; lastTime = performance.now(); });
        marquee.addEventListener('focusin', () => { paused = true; });
        marquee.addEventListener('focusout', () => { paused = false; lastTime = performance.now(); });
        window.requestAnimationFrame(step);
      }
    }
  });
})();

