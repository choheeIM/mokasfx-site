/* Homepage light effects: hero blackout/flashlight and Why Choose scroll lighting. */
(function () {
  "use strict";

  const { onReady } = window.MokaLightUtils;
  onReady(() => {
    // ----- Hero blackout / categories pinned flashlight reveal -----
    const hero = document.querySelector(".hero");
    const heroStage = document.querySelector("[data-hero-light-stage]");
    const categoriesStage = document.querySelector("[data-categories-light-stage]");
    if (hero && heroStage && categoriesStage) {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const mobileQuery = window.matchMedia("(max-width: 1100px)");
      const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
      const easeOut = (value) => 1 - Math.pow(1 - clamp(value), 3);
      const easeInQuad = (value) => Math.pow(clamp(value), 2);
      const maxSpotSize = 82;
      const flashlightMin = 15;
      const flashlightMax = 96;
      // Blackout hold length: the scroll distance (fraction of viewport height)
      // the screen stays fully black between lights-off and the flashlight
      // snapping on. Everything is a pure function of scroll position — no
      // timers — so fast scrolling fast-forwards the effect instead of
      // trapping the user in the dark while the page moves on behind the mask.
      // Keep in sync with .hero-light-stage height in style.css.
      const BLACKOUT_VH = 0.3;
      const factoryText = categoriesStage.querySelector(".factory-intro-text");
      const scrollLightMask = document.createElement("div");
      scrollLightMask.className = "scroll-light-mask";
      scrollLightMask.setAttribute("aria-hidden", "true");
      document.body.appendChild(scrollLightMask);

      if (reducedMotion) {
        scrollLightMask.style.setProperty("--scroll-mask-opacity", "0");
        scrollLightMask.style.setProperty("--scroll-spot-size", `${maxSpotSize}vmax`);
        scrollLightMask.style.setProperty("--scroll-spot-feather-soft", "8vmax");
        scrollLightMask.style.setProperty("--scroll-spot-feather-mid", "24vmax");
        scrollLightMask.style.setProperty("--scroll-spot-feather-end", "52vmax");
      } else {
        let ticking = false;

        const setMask = (opacity, spotSize, featherScale, warm = 0, rim = 0) => {
          const featherSoft = 8 * featherScale;
          const featherMid = 24 * featherScale;
          const featherEnd = 52 * featherScale;

          scrollLightMask.style.setProperty("--scroll-mask-opacity", opacity.toFixed(3));
          scrollLightMask.style.setProperty("--scroll-spot-size", `${spotSize.toFixed(2)}vmax`);
          scrollLightMask.style.setProperty("--scroll-spot-feather-soft", `${featherSoft.toFixed(2)}vmax`);
          scrollLightMask.style.setProperty("--scroll-spot-feather-mid", `${featherMid.toFixed(2)}vmax`);
          scrollLightMask.style.setProperty("--scroll-spot-feather-end", `${featherEnd.toFixed(2)}vmax`);
          scrollLightMask.style.setProperty("--scroll-spot-warm", warm.toFixed(3));
          scrollLightMask.style.setProperty("--scroll-spot-rim", rim.toFixed(3));
        };

        const updateScrollLighting = () => {
          ticking = false;

          const active = !mobileQuery.matches;
          categoriesStage.classList.toggle("light-stage-active", active);
          if (!active) {
            // No light animation on mobile
            categoriesStage.classList.remove("is-hidden");
            setMask(0, maxSpotSize, 1);
            return;
          }

          const viewportH = window.innerHeight || document.documentElement.clientHeight || 1;
          const closeLen = Math.min(viewportH * 0.56, 480);
          const blackoutLen = viewportH * BLACKOUT_VH;
          const stageRect = heroStage.getBoundingClientRect();
          const catRect = categoriesStage.getBoundingClientRect();
          const stageScroll = -stageRect.top;
          const closingProgress = clamp(stageScroll / Math.max(1, closeLen));

          // The categories section reaches its pin exactly when the blackout
          // scroll distance ends (it overlaps the hero stage by one viewport).
          if (catRect.top > 0) {
            categoriesStage.classList.add("is-hidden");
            scrollLightMask.style.setProperty("--scroll-spot-x", "50%");
            scrollLightMask.style.setProperty("--scroll-spot-y", "48%");

            if (closingProgress >= 1) {
              // Blackout hold: a fixed scroll distance spent fully black.
              setMask(1, 0, 0);
              return;
            }

            // Hero lights-off: stays lit most of the scroll, snaps shut at the end.
            const progress = easeInQuad(closingProgress);
            const rawSpotSize = maxSpotSize * (1 - progress);
            const spotSize = rawSpotSize < 0.35 ? 0 : rawSpotSize;
            const maskOpacity = clamp(closingProgress / 0.04);
            const featherScale = spotSize === 0 ? 0 : 1 - closingProgress;
            setMask(maskOpacity, spotSize, featherScale);
            return;
          }

          // Flashlight phase: snapped onto the factory intro copy, expanding with scroll.
          // Scroll restoration and jumped positions land here directly with the
          // correct state — every frame is a pure function of scroll position.
          categoriesStage.classList.remove("is-hidden");
          const pinDistance = Math.max(0, categoriesStage.offsetHeight - viewportH);
          const pinProgress = clamp(-catRect.top / Math.max(1, pinDistance));

          if (factoryText) {
            const textRect = factoryText.getBoundingClientRect();
            scrollLightMask.style.setProperty("--scroll-spot-x", `${(textRect.left + textRect.width * 0.4).toFixed(1)}px`);
            scrollLightMask.style.setProperty("--scroll-spot-y", `${(textRect.top + textRect.height * 0.42).toFixed(1)}px`);
          }

          const grow = clamp((pinProgress - 0.88) / 0.52);
          const spotSize = flashlightMin + (flashlightMax - flashlightMin) * grow;
          const warm = 0.38 * (1 - clamp((grow - 0.85) / 0.35));
          const rim = 0.55 * (1 - clamp((grow - 0.5) / 0.3));
          const featherScale = 0.35 + grow * 0.75;
          const maskOpacity = 1 - clamp((pinProgress - 0.86) / 0.14);
          setMask(maskOpacity, spotSize, featherScale, warm, rim);
        };

        const requestScrollLighting = () => {
          if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(updateScrollLighting);
          }
        };

        window.addEventListener("scroll", requestScrollLighting, { passive: true });
        window.addEventListener("resize", requestScrollLighting, { passive: true });
        updateScrollLighting();
      }
    }

    // ----- Why Choose us: scroll-linked text reveal -----
    const scrollSection = document.querySelector('[data-why-scroll-section]');
    if (scrollSection) {
      const texts = Array.from(scrollSection.querySelectorAll('[data-why-scroll-text]'));
      const progress = scrollSection.querySelector('[data-why-scroll-progress]');
      const orbit = scrollSection.querySelector('[data-why-orbit]');
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const mobileWhyLayout = window.matchMedia('(max-width: 720px)');
      if (!reducedMotion) {
        if ('IntersectionObserver' in window) {
          const lightObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                scrollSection.classList.add('is-lit');
                observer.unobserve(entry.target);
              }
            });
          }, { threshold: 0.32 });

          lightObserver.observe(scrollSection);
        } else {
          scrollSection.classList.add('is-lit');
        }
      }

      if (texts.length && !reducedMotion && !mobileWhyLayout.matches) {
        let ticking = false;

        const update = () => {
          ticking = false;
          const rect = scrollSection.getBoundingClientRect();
          const range = Math.max(1, scrollSection.offsetHeight - window.innerHeight);
          const p = Math.min(1, Math.max(0, -rect.top / range));
          // Texts cycle in the first 60% of the scroll and the third one holds
          // fully visible; the spotlight beams stay wide open until 78%, then
          // collapse over the final 22% as the section is about to release.
          const orbitP = Math.min(1, p / 0.6);
          const lightExit = Math.min(1, Math.max(0, (p - 0.78) / 0.22));
          const itemAngles = [34, 0, -34];
          const orbitAngle = -34 + orbitP * 68;
          let activeIndex = 0;
          let activeDistance = Infinity;

          texts.forEach((text, i) => {
            const itemAngle = itemAngles[i] || 0;
            const distance = Math.abs(itemAngle + orbitAngle);
            const opacity = Math.max(0, Math.min(1, 1 - distance / 30));
            if (distance < activeDistance) {
              activeDistance = distance;
              activeIndex = i;
            }
            text.style.opacity = String(Math.max(0, Math.min(1, opacity)));
            text.style.filter = `blur(${(1 - opacity) * 2}px)`;
            text.style.zIndex = String(Math.round(opacity * 10));
          });

          scrollSection.style.setProperty('--why-orbit-angle', `${orbitAngle}deg`);
          scrollSection.style.setProperty('--why-light-collapse', `${lightExit * 100}%`);
          scrollSection.style.setProperty('--why-light-opacity', String(1 - lightExit * 0.82));
          if (orbit) orbit.dataset.active = String(activeIndex);
          if (progress) progress.style.transform = `scaleX(${p})`;
        };

        const requestUpdate = () => {
          if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(update);
          }
        };

        window.addEventListener('scroll', requestUpdate, { passive: true });
        window.addEventListener('resize', requestUpdate, { passive: true });
        update();
      }
    }
  });
})();

