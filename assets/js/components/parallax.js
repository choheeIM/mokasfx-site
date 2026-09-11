/* Solutions page scroll-linked motion. */
(function () {
  "use strict";

  const { onReady, clamp, createRafScheduler } = window.MokaLightUtils;
  let requestMotion = () => {};
  window.MokaLightParallax = { request: () => requestMotion() };

  onReady(() => {
    const solutionsPage = document.querySelector("[data-solutions-page]");
    if (!solutionsPage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const mobileSolutions = window.matchMedia("(max-width: 720px)");
    const heroMedia = solutionsPage.querySelector("[data-solutions-hero-media]");
    const update = () => {
      const viewportH = window.innerHeight || document.documentElement.clientHeight;

      if (heroMedia) {
        const hero = heroMedia.closest(".solutions-hero");
        if (hero) {
          const rect = hero.getBoundingClientRect();
          const progress = clamp(-rect.top / Math.max(1, rect.height), 0, 1);
          heroMedia.style.setProperty("--solutions-hero-y", `${(progress * 34).toFixed(2)}px`);
        }
      }

      const motionItems = Array.from(solutionsPage.querySelectorAll("[data-solution-item]"));
      const scenes = Array.from(solutionsPage.querySelectorAll("[data-solution-showcase-scene]"));
      if (!mobileSolutions.matches) {
        motionItems.forEach((item, index) => {
          const rect = item.getBoundingClientRect();
          const centerOffset = ((rect.top + rect.height / 2) - viewportH / 2) / viewportH;
          const direction = index % 2 === 0 ? -1 : 1;
          item.style.setProperty("--motion-y", `${(clamp(centerOffset, -1, 1) * 18 * direction).toFixed(2)}px`);
        });
        scenes.forEach((scene, index) => {
          const image = scene.querySelector(".solution-showcase__image");
          if (!image) return;
          const rect = scene.getBoundingClientRect();
          const centerOffset = ((rect.top + rect.height / 2) - viewportH / 2) / viewportH;
          const direction = index % 2 === 0 ? -1 : 1;
          image.style.setProperty("--showcase-parallax", `${(clamp(centerOffset, -1, 1) * 22 * direction).toFixed(2)}px`);
        });
      } else {
        motionItems.forEach((item) => item.style.setProperty("--motion-y", "0px"));
        solutionsPage.querySelectorAll(".solution-showcase__image")
          .forEach((image) => image.style.setProperty("--showcase-parallax", "0px"));
      }
    };

    requestMotion = createRafScheduler(update);
    window.addEventListener("scroll", requestMotion, { passive: true });
    window.addEventListener("resize", requestMotion, { passive: true });
    mobileSolutions.addEventListener("change", requestMotion);
    update();
  });
})();

