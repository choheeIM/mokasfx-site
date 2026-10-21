/* ============================================================
   BLOG LISTING — category tabs + pages, all on one URL
   Every post card is already in the HTML (server-rendered, so crawlers and
   no-JS visitors get every link); this script only decides which cards are
   visible. The URL never changes: the chosen tab and page live in
   history.state, so coming Back from an article restores them.
   ============================================================ */
(function () {
  "use strict";

  const onReady = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  };

  onReady(() => {
    const bar = document.querySelector("[data-blog-cat-tabs]");
    const grid = document.querySelector(".post-grid");
    if (!bar || !grid) return;

    const tabs = Array.from(bar.querySelectorAll("[data-blog-cat-tab]"));
    const cards = Array.from(grid.querySelectorAll(".post-card[data-blog-cat]"));
    const count = document.querySelector(".blog-collection-count[data-count-template]");
    const pager = document.querySelector("[data-blog-pager]");
    const prevBtn = pager && pager.querySelector('[data-blog-page="prev"]');
    const nextBtn = pager && pager.querySelector('[data-blog-page="next"]');
    const head = document.querySelector(".blog-collection-head");
    const pageSize = 8;
    const edge = 48; // width of the faded tab-row edge on phones (style.css)
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const known = new Set(tabs.map((tab) => tab.dataset.blogCatTab));
    const baseState = () => (history.state && typeof history.state === "object" ? history.state : {});
    const saved = baseState().blogListing || {};
    const state = {
      cat: known.has(saved.cat) ? saved.cat : "all",
      page: Number.isInteger(saved.page) && saved.page > 0 ? saved.page : 1,
    };

    const matches = () =>
      cards.filter((card) => state.cat === "all" || card.dataset.blogCat.split(/\s+/).includes(state.cat));

    // ----- tab row: edge fades + keep the chosen tab in view on phones -----
    const updateEdges = () => {
      const max = bar.scrollWidth - bar.clientWidth;
      bar.classList.toggle("has-more-start", max > 1 && bar.scrollLeft > 1);
      bar.classList.toggle("has-more-end", max > 1 && bar.scrollLeft < max - 1);
    };
    const revealTab = (tab, smooth) => {
      const max = bar.scrollWidth - bar.clientWidth;
      if (!tab || max <= 1) return;
      const barBox = bar.getBoundingClientRect();
      const tabBox = tab.getBoundingClientRect();
      let left = bar.scrollLeft;
      if (tabBox.left < barBox.left + edge) left -= barBox.left + edge - tabBox.left;
      else if (tabBox.right > barBox.right - edge) left += tabBox.right - (barBox.right - edge);
      bar.scrollTo({ left: Math.max(0, Math.min(max, left)), behavior: smooth && !reducedMotion ? "smooth" : "auto" });
    };

    // ----- pager: number buttons are rebuilt between the fixed prev/next -----
    const renderPager = (pageCount) => {
      if (!pager || !prevBtn || !nextBtn) return;
      const focused = document.activeElement;
      const hadFocus = pager.contains(focused);
      pager.hidden = pageCount <= 1;
      pager.querySelectorAll("[data-blog-page]").forEach((btn) => {
        if (btn !== prevBtn && btn !== nextBtn) btn.remove();
      });
      let activeBtn = null;
      for (let n = 1; n <= pageCount; n += 1) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "products-page-link" + (n === state.page ? " is-active" : "");
        btn.dataset.blogPage = String(n);
        btn.textContent = String(n);
        if (n === state.page) {
          btn.setAttribute("aria-current", "page");
          activeBtn = btn;
        }
        pager.insertBefore(btn, nextBtn);
      }
      const atFirst = state.page <= 1;
      const atLast = state.page >= pageCount;
      prevBtn.disabled = atFirst;
      prevBtn.classList.toggle("is-disabled", atFirst);
      nextBtn.disabled = atLast;
      nextBtn.classList.toggle("is-disabled", atLast);
      // A removed or now-disabled button would drop keyboard focus to <body>.
      if (hadFocus && activeBtn && (!pager.contains(focused) || focused.disabled)) {
        activeBtn.focus({ preventScroll: true });
      }
    };

    const render = () => {
      const list = matches();
      const pageCount = Math.max(1, Math.ceil(list.length / pageSize));
      state.page = Math.min(state.page, pageCount);
      const start = (state.page - 1) * pageSize;
      const visible = new Set(list.slice(start, start + pageSize));

      cards.forEach((card) => {
        card.hidden = !visible.has(card);
      });
      tabs.forEach((tab) => {
        const active = tab.dataset.blogCatTab === state.cat;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-pressed", active ? "true" : "false");
      });
      if (count) {
        count.textContent = count.dataset.countTemplate
          .replace("{start}", String(list.length ? start + 1 : 0))
          .replace("{end}", String(start + visible.size))
          .replace("{total}", String(list.length));
      }
      renderPager(pageCount);

      try {
        history.replaceState({ ...baseState(), blogListing: { cat: state.cat, page: state.page } }, "");
      } catch (e) {
        /* history state is a nicety; filtering works without it */
      }
    };

    // Bring the list head back under the fixed header after a page change.
    const scrollToList = () => {
      if (!head) return;
      const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0;
      const offset = headerH + 24;
      if (head.getBoundingClientRect().top >= offset) return;
      const smoothScroll = window.MokaLightSmoothScroll;
      if (!reducedMotion && smoothScroll && smoothScroll.active) {
        smoothScroll.scrollTo(head, { offset: -offset });
      } else {
        window.scrollTo({
          top: head.getBoundingClientRect().top + window.scrollY - offset,
          behavior: reducedMotion ? "auto" : "smooth",
        });
      }
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        revealTab(tab, true);
        if (tab.dataset.blogCatTab === state.cat) return;
        state.cat = tab.dataset.blogCatTab;
        state.page = 1;
        render();
      });
    });

    if (pager) {
      pager.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-blog-page]");
        if (!btn || btn.disabled) return;
        const value = btn.dataset.blogPage;
        const page = value === "prev" ? state.page - 1 : value === "next" ? state.page + 1 : Number(value);
        if (!page || page === state.page) return;
        state.page = page;
        render();
        scrollToList();
      });
    }

    bar.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges, { passive: true });

    // The HTML already shows All / page 1; only re-render for a restored state.
    if (state.cat !== "all" || state.page !== 1) render();
    revealTab(tabs.find((tab) => tab.dataset.blogCatTab === state.cat), false);
    updateEdges();
  });
})();
