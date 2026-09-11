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

    // ----- Solutions overview: filter image cards by selected category -----
    const ovItems = document.querySelectorAll('.solutions-overview-item');
    const ovGrid = document.querySelector('.solutions-overview-grid');
    if (ovItems.length && ovGrid) {
      const cards = ovGrid.querySelectorAll('.solutions-overview-card');
      const apply = (cat) => {
        ovGrid.dataset.active = cat;
        cards.forEach((card) => {
          const show = card.dataset.category === cat;
          card.classList.toggle('is-hidden', !show);
        });
        const visible = Array.from(cards).filter((c) => !c.classList.contains('is-hidden'));
        visible.forEach((card, idx) => {
          card.classList.toggle('span-2', idx === 0);
        });
      };
      const initial = document.querySelector('.solutions-overview-item.is-active') || ovItems[0];
      apply(initial.dataset.category);
      ovItems.forEach((item) => {
        item.tabIndex = 0;
        item.setAttribute('role', 'button');
        item.addEventListener('click', () => {
          if (window.matchMedia('(max-width: 1100px)').matches) return;
          ovItems.forEach((it) => it.classList.toggle('is-active', it === item));
          apply(item.dataset.category);
        });
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            item.click();
          }
        });
      });
    }

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
  });
})();

