/* Homepage-only progressive enhancements. */
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
  onReady(() => {
    // ----- Hero video is desktop-only -----
    // The <source> carries data-src, so mobile never downloads the mp4 and the
    // poster frame (assets/img/hero-poster.webp) stays as the static hero image.
    const heroVideo = document.querySelector('.hero-video');
    if (heroVideo) {
      const mobileHero = window.matchMedia('(max-width: 720px)').matches;
      const saveData = Boolean(navigator.connection && navigator.connection.saveData);
      if (mobileHero || saveData) {
        heroVideo.removeAttribute('autoplay');
        heroVideo.pause();
      } else {
        const src = heroVideo.querySelector('source[data-src]');
        if (src) {
          src.src = src.dataset.src;
          heroVideo.load();
          const playAttempt = heroVideo.play();
          if (playAttempt) playAttempt.catch(() => {});
        }
      }
    }

    document.querySelectorAll("[data-filter-group]").forEach((group) => {
      const chips = group.querySelectorAll(".chip");
      chips.forEach((chip) => {
        chip.addEventListener("click", () => {
          chips.forEach((c) => c.classList.remove("is-active"));
          chip.classList.add("is-active");
          const filter = chip.dataset.filter;
          const scope = group.dataset.filterGroup;
          document.querySelectorAll(`[data-filterable][data-scope="${scope}"]`).forEach((card) => {
            const cats = (card.dataset.cats || "").split(" ");
            const show = filter === "all" || cats.includes(filter);
            card.style.display = show ? "" : "none";
          });
        });
      });
    });

    // ----- Products overview accordion -----
    // Opening a category also cross-fades the visual to that category's
    // product image (matched by data-category on both sides). One category
    // always stays open: closing all would shorten the visual and rescale
    // the cover-fit image.
    const accItems = document.querySelectorAll('.products-accordion-item');
    const overviewImgs = document.querySelectorAll('.products-overview-img');
    accItems.forEach((item) => {
      const trigger = item.querySelector('.products-accordion-trigger');
      if (!trigger) return;
      trigger.addEventListener('click', () => {
        if (item.classList.contains('is-open')) return;
        accItems.forEach((other) => {
          other.classList.remove('is-open');
          const t = other.querySelector('.products-accordion-trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
        });
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        overviewImgs.forEach((img) => {
          img.classList.toggle('is-active', img.dataset.category === item.dataset.category);
        });
      });
    });

    // ----- Blog overview: Project / Tech Guides tabs -----
    const blogOverview = document.querySelector('.blog-overview');
    if (blogOverview) {
      const tabs = Array.from(blogOverview.querySelectorAll('[data-blog-tab]'));
      const panels = Array.from(blogOverview.querySelectorAll('[data-blog-panel]'));
      const setActiveBlogTab = (category) => {
        tabs.forEach((tab) => {
          const active = tab.dataset.blogTab === category;
          tab.classList.toggle('is-active', active);
          tab.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        panels.forEach((panel) => {
          const active = panel.dataset.blogPanel === category;
          panel.classList.toggle('is-active', active);
          panel.hidden = !active;
        });
      };

      tabs.forEach((tab) => {
        tab.addEventListener('click', () => setActiveBlogTab(tab.dataset.blogTab));
      });
    }

    // ----- Solutions stack: pinned stage, full-image bookmark stacking -----
    // Progressive enhancement over the CSS sticky-stack fallback. Card one
    // scrolls in naturally and rests fully visible beneath the section head
    // by the time the stage pins. Each following card then slides up while
    // an inner slider (head + tab row + cards) shifts up by transform to make
    // room — the head scrolls away under the site header, the arriving card
    // is always shown in full, and the covered cards park as a row of
    // bookmark tabs above the active card. All cards keep the image's 16:9
    // ratio and are sized so the tallest moment — the full tab row plus one
    // complete card — still fits the viewport, so no image is ever cropped.
    // Skipped for reduced motion.
    const solutionSection = document.querySelector('.solution-featured');
    if (solutionSection) {
      const track = solutionSection.querySelector('[data-solution-track]');
      const stage = solutionSection.querySelector('[data-solution-stage]');
      const inner = solutionSection.querySelector('[data-solution-inner]');
      const head = solutionSection.querySelector('[data-solution-head]');
      const stack = solutionSection.querySelector('.solution-stack');
      const cards = Array.from(solutionSection.querySelectorAll('.solution-stack-card'));
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (track && stage && inner && head && stack && cards.length && !reduceMotion) {
        // Pinned stacking runs on tablet and desktop only; phones (<=720px)
        // get natural-scrolling 16:9 cards from CSS instead.
        const stackedLayout = window.matchMedia('(min-width: 721px)');

        const lastIndex = cards.length - 1;
        const tabs = cards.map((card) => card.querySelector('.solution-stack-tab'));
        // Sine in-out: peak mid-slide velocity is ~1.6x the average, versus
        // 3x for cubic — the card handoff reads calmer at the same length.
        const easeInOut = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
        const clamp01 = (t) => Math.min(1, Math.max(0, t));
        const HEAD_GAP = 20;

        // Slide windows per card (progress along the pinned range). Card one
        // never slides — it rests below the head from the start; each
        // following card rises inside its own segment, with dwell on both
        // sides so every card gets a moment fully visible.
        const seg = 1 / Math.max(1, lastIndex);
        const windows = cards.map((_, i) =>
          i === 0 ? null : [(i - 1) * seg + seg * 0.1, i * seg - seg * 0.1]
        );

        let headerH = 76;
        let viewH = 0;
        let stageH = 0;
        let headH = 0;
        let tabH = 56;
        let parked = []; // parked Y per card, in stage coordinates
        let shifts = []; // stage's upward shift once each card is active
        let ticking = false;

        const update = () => {
          ticking = false;
          if (!solutionSection.classList.contains('is-live')) return;
          const scrollRange = Math.max(1, track.offsetHeight - stage.offsetHeight);
          const p = clamp01(-track.getBoundingClientRect().top / scrollRange);

          // Card one's rise (the stage shifting up) and card two's slide-in
          // run together over the same window; later windows only slide,
          // since the stage stays put once the head has scrolled away.
          const slideTs = cards.map((_, i) => {
            const w = windows[i];
            return w ? easeInOut(clamp01((p - w[0]) / (w[1] - w[0]))) : 0;
          });

          let shift = shifts[0];
          cards.forEach((card, i) => {
            const w = windows[i];
            const slideT = slideTs[i];
            const y = i === 0 ? parked[0] : stageH + (parked[i] - stageH) * slideT;
            card.style.transform = `translate3d(-50%, ${y.toFixed(1)}px, 0)`;

            if (w && slideT > 0) shift = shifts[i - 1] + (shifts[i] - shifts[i - 1]) * slideT;

            // The tab appears once the card is pinned: for covered cards as
            // the next card slides over them, for the last card as it parks.
            const tabSource = i === lastIndex ? slideT : slideTs[i + 1];
            const tab = tabs[i];
            if (tab) {
              tab.style.setProperty('--sol-tab-o', tabSource.toFixed(3));
              tab.style.visibility = tabSource > 0.02 ? 'visible' : 'hidden';
            }

            // Dim this card while the next one slides over it.
            const dim = i < lastIndex ? tabSource * 0.45 : 0;
            card.style.setProperty('--sol-dim', dim.toFixed(3));
          });
          // The whole inner slider (head + tab row + cards) shifts up by a
          // transform — compositor-only, no layout work per scroll frame.
          inner.style.transform = `translate3d(0, ${(-shift).toFixed(1)}px, 0)`;
        };

        const layout = () => {
          headerH = parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 76;
          viewH = window.innerHeight - headerH;
          headH = head.offsetHeight;
          const cssTab = parseFloat(window.getComputedStyle(solutionSection).getPropertyValue('--sol-tab-h'));
          tabH = Number.isFinite(cssTab) ? cssTab : 56;

          // Cards keep the image's 16:9 ratio so the picture is never
          // cropped: the width is capped so the full bookmark tab row plus
          // one complete card still fits the viewport. The side inset comes
          // from the stylesheet (it shrinks on tablet), so measure it with
          // inline sizing cleared.
          const probe = cards[0];
          const prev = { left: probe.style.left, right: probe.style.right, width: probe.style.width };
          probe.style.left = '';
          probe.style.right = '';
          probe.style.width = '';
          const inset = parseFloat(window.getComputedStyle(probe).left) || 0;
          probe.style.left = prev.left;
          probe.style.right = prev.right;
          probe.style.width = prev.width;

          const maxW = stack.clientWidth - inset * 2;
          const cardW = Math.max(320, Math.round(Math.min(maxW, ((viewH - lastIndex * tabH - HEAD_GAP) * 16) / 9)));
          const cardH = Math.round((cardW * 9) / 16);

          parked = cards.map((_, i) => headH + HEAD_GAP + i * tabH);
          // Once card one has been shown in full, the stage shifts up by the
          // head height in one go: the head scrolls away and card one rises
          // to just below the site header. The shift then stays put — the
          // cards are sized so every active card fits fully below the parked
          // bookmark tabs from here on.
          shifts = cards.map((_, i) => (i === 0 ? 0 : headH + HEAD_GAP));
          stageH = parked[lastIndex] + cardH + HEAD_GAP;

          inner.style.height = `${stageH}px`;
          cards.forEach((card) => {
            card.style.left = '50%';
            card.style.right = 'auto';
            card.style.width = `${cardW}px`;
            card.style.height = `${cardH}px`;
          });

          // Pinned scroll range: ~1.2 viewports per arriving card so each
          // slide gets a heavier, more deliberate feel.
          track.style.height = `${Math.round(stage.offsetHeight + viewH * 1.2 * lastIndex)}px`;
          update();
        };

        const requestUpdate = () => {
          if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(update);
          }
        };

        // Strip every inline style the pinned mode set so the CSS-driven
        // phone layout renders cleanly after a breakpoint crossing.
        const teardown = () => {
          solutionSection.classList.remove('is-live');
          track.style.height = '';
          inner.style.height = '';
          inner.style.transform = '';
          cards.forEach((card, i) => {
            card.style.transform = '';
            card.style.left = '';
            card.style.right = '';
            card.style.width = '';
            card.style.height = '';
            card.style.removeProperty('--sol-dim');
            const tab = tabs[i];
            if (tab) {
              tab.style.removeProperty('--sol-tab-o');
              tab.style.visibility = '';
            }
          });
        };

        const sync = () => {
          if (stackedLayout.matches) {
            if (!solutionSection.classList.contains('is-live')) {
              solutionSection.classList.add('is-live');
            }
            layout();
          } else if (solutionSection.classList.contains('is-live')) {
            teardown();
          }
        };

        window.addEventListener('scroll', requestUpdate, { passive: true });
        window.addEventListener('resize', () => window.requestAnimationFrame(sync), { passive: true });
        // Breakpoint crossings re-sync directly (not via rAF) so the layout
        // flips even when rAF is throttled, e.g. device rotation in a
        // background tab.
        stackedLayout.addEventListener('change', sync);
        window.addEventListener('load', sync);
        sync();
      }
    }

    // ----- Stage banner: start the curtain reveal when it scrolls into view -----
    // The SVG's internal timeline runs from the moment the file is decoded,
    // so loading it eagerly would leave the animation finished before the
    // visitor ever scrolls there. Defer the src until the banner is visible.
    const stageBanner = document.querySelector('.stage-banner-frame');
    if (stageBanner) {
      // Armed: hide the HTML copy until playback starts so it rises in sync
      // with the curtains; without JS the copy simply renders statically.
      stageBanner.classList.add('is-armed');
      const stageImg = stageBanner.querySelector('.stage-banner-img[data-src]');
      const playStageBanner = () => {
        if (stageImg && !stageImg.src) stageImg.src = stageImg.dataset.src;
        stageBanner.classList.add('is-playing');
      };
      if (stageImg && 'IntersectionObserver' in window) {
        const stageObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              playStageBanner();
              stageObserver.disconnect();
            }
          });
        }, { threshold: 0.25 });
        stageObserver.observe(stageBanner);
      } else {
        playStageBanner();
      }
    }

    // ----- Video facade -----
    // No iframe exists until the visitor clicks play: wheel scrolling passes
    // over the frame freely (an embedded iframe swallows wheel events and
    // stalls Lenis), and YouTube's player JS only downloads on intent.
    const videoGate = document.querySelector('[data-video-gate]');
    if (videoGate) {
      videoGate.addEventListener('click', () => {
        const src = videoGate.dataset.videoSrc;
        if (!src) return;
        const iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.title = 'MOKA SFX LIGHT video';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.setAttribute('allowfullscreen', '');
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        videoGate.replaceWith(iframe);
      });
    }

    // ----- FAQ: reveal on scroll (same pattern as solution-detail.js) -----
    const revealEls = document.querySelectorAll('.home-reveal');
    if ('IntersectionObserver' in window) {
      const revealIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      revealEls.forEach((el) => revealIO.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    }
  });
})();
