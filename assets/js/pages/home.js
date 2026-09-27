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
  });
})();

