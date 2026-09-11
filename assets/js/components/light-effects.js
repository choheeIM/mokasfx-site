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
      // 全黑停留帧数：60Hz 屏每帧 ≈16.7ms（15帧≈250ms），120Hz 屏翻倍速度，想要更久就调大
      const blackoutFrames = 1000;
      // 初始光圈停留：滚动进度(0~1)低于此值时光圈保持不动，越大停留越久
      const flashlightHoldEnd = 0.85;
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
        let flashOn = false;
        let flashFrames = 0;

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
          const stageRect = heroStage.getBoundingClientRect();
          const catRect = categoriesStage.getBoundingClientRect();
          const closeDistance = Math.max(1, heroStage.offsetHeight - viewportH);
          const closingProgress = clamp(-stageRect.top / closeDistance);

          if (closingProgress < 0.99 && catRect.top > 0) {
            // Hero lights-off: stays lit most of the scroll, snaps shut at the end
            categoriesStage.classList.add("is-hidden");
            flashOn = false;
            flashFrames = 0;
            scrollLightMask.style.setProperty("--scroll-spot-x", "50%");
            scrollLightMask.style.setProperty("--scroll-spot-y", "48%");
            const progress = easeInQuad(closingProgress);
            const rawSpotSize = maxSpotSize * (1 - progress);
            const spotSize = rawSpotSize < 0.35 ? 0 : rawSpotSize;
            const maskOpacity = clamp(closingProgress / 0.04);
            const featherScale = spotSize === 0 ? 0 : 1 - closingProgress;
            setMask(maskOpacity, spotSize, featherScale);
            return;
          }

          // Flashlight phase: snapped onto the factory intro copy, expanding with scroll
          categoriesStage.classList.remove("is-hidden");
          const pinDistance = Math.max(0, categoriesStage.offsetHeight - viewportH);
          const pinProgress = clamp(-catRect.top / Math.max(1, pinDistance));

          if (!flashOn) {
            // Hold the full blackout for blackoutFrames, then snap the light on
            flashFrames += 1;
            if (flashFrames <= blackoutFrames) {
              setMask(1, 0, 0);
              window.requestAnimationFrame(updateScrollLighting);
              return;
            }
            flashOn = true;
          }

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
          const lightExit = Math.min(1, Math.max(0, (p - 0.65) / 0.35));
          const itemAngles = [34, 0, -34];
          const orbitAngle = -34 + p * 68;
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

