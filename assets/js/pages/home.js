/* Homepage-only progressive enhancements. */
(function () {
  "use strict";

  const { onReady } = window.MokaLightUtils;
  onReady(() => {
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
    const accItems = document.querySelectorAll('.products-accordion-item');
    accItems.forEach((item) => {
      const trigger = item.querySelector('.products-accordion-trigger');
      if (!trigger) return;
      trigger.addEventListener('click', () => {
        const willOpen = !item.classList.contains('is-open');
        accItems.forEach((other) => {
          other.classList.remove('is-open');
          const t = other.querySelector('.products-accordion-trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
        });
        if (willOpen) {
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
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

    // ----- Solutions stack: pinned stage with bookmark-style card tabs -----
    // Progressive enhancement over the CSS sticky-stack fallback. The section
    // head stays pinned and is never covered: card one rests beneath it, then
    // each following card slides up and parks under the previous card's title
    // tab, so all five stack as bookmarks. A card's tab fades in only once the
    // card is pinned. The stage is sized so the last card keeps the image's
    // 16:9 ratio — taller than the viewport when needed — and once the stack
    // completes, the sticky stage releases and scrolls up so the final card is
    // revealed in full. Skipped for reduced motion.
    const solutionSection = document.querySelector('.solution-featured');
    if (solutionSection) {
      const track = solutionSection.querySelector('[data-solution-track]');
      const stage = solutionSection.querySelector('[data-solution-stage]');
      const head = solutionSection.querySelector('[data-solution-head]');
      const cards = Array.from(solutionSection.querySelectorAll('.solution-stack-card'));
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (track && stage && head && cards.length && !reduceMotion) {
        // Pinned stacking runs on tablet and desktop only; phones (<=720px)
        // get natural-scrolling 16:9 cards from CSS instead.
        const stackedLayout = window.matchMedia('(min-width: 721px)');

        const lastIndex = cards.length - 1;
        const tabs = cards.map((card) => card.querySelector('.solution-stack-tab'));
        const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
        const clamp01 = (t) => Math.min(1, Math.max(0, t));
        const HEAD_GAP = 20;
        // Slide windows per card (progress along the pinned range). Card one
        // never moves — it rests below the head from the start; the rest each
        // slide up with a slight overlap so the handoff never stalls.
        const windows = cards.map((_, i) =>
          i === 0 ? null : [0.05 + (i - 1) * 0.2, 0.05 + (i - 1) * 0.2 + 0.21]
        );

        let stageH = 0;
        let headH = 0;
        let tabH = 56;
        let ticking = false;

        const parkedY = (i) => headH + HEAD_GAP + i * tabH;

        const update = () => {
          ticking = false;
          if (!solutionSection.classList.contains('is-live')) return;
          const scrollRange = Math.max(1, track.offsetHeight - stageH);
          const p = clamp01(-track.getBoundingClientRect().top / scrollRange);
          cards.forEach((card, i) => {
            const w = windows[i];
            const t = w ? easeInOut(clamp01((p - w[0]) / (w[1] - w[0]))) : 0;
            const y = i === 0 ? parkedY(0) : stageH + (parkedY(i) - stageH) * t;
            card.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;

            // The tab appears once the card is pinned: for covered cards as
            // the next card slides over them, for the last card as it parks.
            const tabSource = i === lastIndex ? t
              : easeInOut(clamp01((p - windows[i + 1][0]) / (windows[i + 1][1] - windows[i + 1][0])));
            const tab = tabs[i];
            if (tab) {
              tab.style.setProperty('--sol-tab-o', tabSource.toFixed(3));
              tab.style.visibility = tabSource > 0.02 ? 'visible' : 'hidden';
            }

            // Dim this card while the next one slides over it.
            const dim = i < lastIndex ? tabSource * 0.45 : 0;
            card.style.setProperty('--sol-dim', dim.toFixed(3));
          });
        };

        const layout = () => {
          const headerH = parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 76;
          const viewH = window.innerHeight - headerH;
          headH = head.offsetHeight;
          const cssTab = parseFloat(window.getComputedStyle(solutionSection).getPropertyValue('--sol-tab-h'));
          tabH = Number.isFinite(cssTab) ? cssTab : 56;

          // The last card keeps the image's 16:9 ratio (min 380px so its copy
          // always fits); the stage grows past one viewport when needed so the
          // final card's area below the parked tabs fits that ratio — the
          // overflow is revealed by release scrolling once the stack settles.
          // On tablet the ratio height is capped so the whole stack area stays
          // within one viewport (300px floor so the copy never gets squeezed).
          const lastCard = cards[lastIndex];
          const tabletLayout = window.matchMedia('(max-width: 1024px)').matches;
          let ratioH = Math.max(tabletLayout ? 300 : 380, Math.round(lastCard.offsetWidth * 9 / 16));
          if (tabletLayout) {
            const available = viewH - (headH + HEAD_GAP + lastIndex * tabH);
            ratioH = Math.max(300, Math.min(ratioH, available));
          }
          stageH = Math.max(viewH, headH + HEAD_GAP + lastIndex * tabH + ratioH);
          const lastH = stageH - parkedY(lastIndex);
          stage.style.height = `${stageH}px`;
          lastCard.style.bottom = 'auto';
          lastCard.style.height = `${lastH}px`;

          // Center each covered card's content within the window left visible
          // below the head and the parked tabs while it is the active card.
          const tailPad = Math.max(0, stageH - viewH);
          cards.forEach((card, i) => {
            card.style.paddingBottom = i === lastIndex ? '0px' : `${Math.round(tailPad + parkedY(i))}px`;
          });

          // Pinned scroll range: roughly one viewport per arriving card.
          track.style.height = `${Math.round(stageH + viewH * 4.2)}px`;
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
          stage.style.height = '';
          cards.forEach((card, i) => {
            card.style.transform = '';
            card.style.paddingBottom = '';
            card.style.height = '';
            card.style.bottom = '';
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
  });
})();
