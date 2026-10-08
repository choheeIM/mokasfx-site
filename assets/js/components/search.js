/* Site-wide fuzzy search (Fuse.js).
 *
 * Progressive enhancement, SSR/SEO friendly by construction: the header
 * trigger is a plain link to search.html, so without JS visitors land on the
 * search page; with JS the link opens a modal instead. On search.html the
 * same UI renders inline and syncs to ?q=. The index
 * (assets/search-index.json) is generated from the static HTML by
 * tools/build_search_index.py — the HTML stays the single source of truth.
 */
(function () {
  "use strict";

  const { onReady } = window.MokaLightUtils;

  onReady(() => {
    if (typeof window.Fuse !== "function") return;

    // Resolve site-root-relative URLs from this script's own src, so results
    // and the index fetch work from any page depth.
    const scriptEl = document.querySelector('script[src*="assets/js/components/search.js"]');
    const base = scriptEl
      ? scriptEl.getAttribute("src").replace(/assets\/js\/components\/search\.js.*$/, "")
      : "";

    const GROUP_ORDER = ["Products", "Solutions", "Projects", "Blog", "Pages"];
    const MODAL_RESULT_LIMIT = 8;

    let indexPromise = null;
    const loadIndex = () => {
      if (!indexPromise) {
        indexPromise = fetch(base + "assets/search-index.json")
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => []);
      }
      return indexPromise;
    };

    let fusePromise = null;
    const getFuse = () => {
      if (!fusePromise) {
        fusePromise = loadIndex().then(
          (entries) =>
            new window.Fuse(entries, {
              keys: [
                { name: "title", weight: 0.5 },
                { name: "keywords", weight: 0.3 },
                { name: "description", weight: 0.2 },
              ],
              threshold: 0.35,
              ignoreLocation: true,
              includeMatches: true,
              minMatchCharLength: 2,
            })
        );
      }
      return fusePromise;
    };

    const escapeHtml = (text) =>
      text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

    // Wrap Fuse match ranges in <mark>. Ranges refer to the raw string, so
    // highlighting happens before HTML-escaping... build the output char by
    // char to keep indices valid.
    const highlight = (text, indices) => {
      if (!indices || !indices.length) return escapeHtml(text);
      const points = new Set();
      indices.forEach(([a, b]) => {
        points.add(a);
        points.add(b + 1);
      });
      let out = "";
      let open = false;
      for (let i = 0; i < text.length; i++) {
        if (points.has(i)) {
          out += open ? "</mark>" : "<mark>";
          open = !open;
        }
        out += escapeHtml(text[i]);
      }
      if (open) out += "</mark>";
      return out;
    };

    const highlightField = (result, field, text) => {
      const match = (result.matches || []).find((m) => m.key === field);
      return highlight(text, match && match.indices);
    };

    const groupResults = (results) => {
      const groups = new Map();
      results.forEach((r) => {
        const type = r.item.type || "Pages";
        if (!groups.has(type)) groups.set(type, []);
        groups.get(type).push(r);
      });
      return GROUP_ORDER.filter((g) => groups.has(g)).map((g) => [g, groups.get(g)]);
    };

    const renderResults = (container, results, query, { limit = Infinity, moreHref = null } = {}) => {
      const total = results.length;
      const shown = results.slice(0, limit);
      container.scrollTop = 0;
      if (!query.trim()) {
        container.innerHTML = "";
        return;
      }
      if (!total) {
        container.innerHTML = `
          <p class="search-empty">No results for &ldquo;${escapeHtml(query)}&rdquo;. Try a product name, a venue type, or a topic like &ldquo;DMX&rdquo;.</p>`;
        return;
      }
      const html = groupResults(shown)
        .map(
          ([group, items]) => `
          <div class="search-group" role="group" aria-label="${group}">
            <p class="search-group-title">${group}</p>
            ${items
              .map(
                (r, i) => `
            <a class="search-result" href="${base}${r.item.url}" data-search-result>
              <span class="search-result-title">${highlightField(r, "title", r.item.title)}</span>
              ${r.item.description ? `<span class="search-result-desc">${highlightField(r, "description", r.item.description)}</span>` : ""}
            </a>`
              )
              .join("")}
          </div>`
        )
        .join("");
      const more =
        total > shown.length && moreHref
          ? `<a class="search-more" href="${moreHref}">See all ${total} results <span aria-hidden="true">&rarr;</span></a>`
          : "";
      container.innerHTML = html + more;
    };

    const debounce = (fn, ms) => {
      let timer = null;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
      };
    };

    // ----- Inline mode: search.html hosts the same UI in the page -----
    const pageRoot = document.querySelector("[data-search-page]");
    if (pageRoot) {
      const input = pageRoot.querySelector("[data-search-input]");
      const resultsEl = pageRoot.querySelector("[data-search-results]");
      const status = pageRoot.querySelector("[data-search-status]");

      const run = (query) => {
        getFuse().then((fuse) => {
          const found = query.trim() ? fuse.search(query.trim()) : [];
          renderResults(resultsEl, found, query);
          if (status) {
            status.textContent = query.trim()
              ? `${found.length} result${found.length === 1 ? "" : "s"} for "${query.trim()}"`
              : "";
          }
          const params = new URLSearchParams(location.search);
          if (query.trim()) params.set("q", query.trim());
          else params.delete("q");
          const qs = params.toString();
          history.replaceState(null, "", location.pathname + (qs ? `?${qs}` : ""));
        });
      };

      if (input) {
        const initial = new URLSearchParams(location.search).get("q") || "";
        input.value = initial;
        input.addEventListener("input", debounce(() => run(input.value), 120));
        if (initial) run(initial);
        input.focus();
      }
      return;
    }

    // ----- Modal mode: enhance every header trigger link -----
    const triggers = document.querySelectorAll("[data-search-trigger]");
    if (!triggers.length) return;

    let overlay = null;
    let input = null;
    let results = null;
    let status = null;
    let lastFocus = null;
    let activeIndex = -1;

    const buildOverlay = () => {
      overlay = document.createElement("div");
      overlay.className = "search-overlay";
      overlay.hidden = true;
      overlay.innerHTML = `
        <div class="search-modal" role="dialog" aria-modal="true" aria-label="Site search">
          <div class="search-modal-bar">
            <svg class="search-modal-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input class="search-modal-input" type="search" placeholder="Search products, solutions, articles&hellip;" aria-label="Search the site" autocomplete="off" spellcheck="false">
            <button class="search-modal-close" type="button" aria-label="Close search">&times;</button>
          </div>
          <p class="search-modal-status" data-status role="status" aria-live="polite"></p>
          <div class="search-modal-results" data-results></div>
        </div>`;
      document.body.appendChild(overlay);
      input = overlay.querySelector("input");
      results = overlay.querySelector("[data-results]");
      status = overlay.querySelector("[data-status]");

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeModal();
      });
      overlay.querySelector(".search-modal-close").addEventListener("click", closeModal);
      input.addEventListener("input", debounce(() => run(input.value), 120));
      input.addEventListener("keydown", onKeydown);
    };

    const run = (query) => {
      getFuse().then((fuse) => {
        const trimmed = query.trim();
        const found = trimmed ? fuse.search(trimmed) : [];
        renderResults(results, found, trimmed, {
          limit: MODAL_RESULT_LIMIT,
          moreHref: `${base}search.html?q=${encodeURIComponent(trimmed)}`,
        });
        status.textContent = trimmed
          ? `${found.length} result${found.length === 1 ? "" : "s"}`
          : "";
        activeIndex = -1;
      });
    };

    const resultLinks = () => Array.from(results.querySelectorAll("[data-search-result], .search-more"));

    const setActive = (next) => {
      const links = resultLinks();
      if (!links.length) return;
      activeIndex = ((next % links.length) + links.length) % links.length;
      links.forEach((link, i) => link.classList.toggle("is-active", i === activeIndex));
      links[activeIndex].scrollIntoView({ block: "nearest" });
    };

    const onKeydown = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive(activeIndex + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive(activeIndex - 1);
      } else if (e.key === "Enter") {
        const links = resultLinks();
        if (activeIndex >= 0 && links[activeIndex]) {
          e.preventDefault();
          links[activeIndex].click();
        }
      }
    };

    const openModal = () => {
      if (!overlay) buildOverlay();
      lastFocus = document.activeElement;
      overlay.hidden = false;
      document.body.classList.add("search-open");
      const smooth = window.MokaLightSmoothScroll;
      if (smooth && smooth.active) smooth.lenis.stop();
      loadIndex();
      input.value = "";
      results.innerHTML = "";
      status.textContent = "";
      activeIndex = -1;
      input.focus();
    };

    const closeModal = () => {
      if (!overlay || overlay.hidden) return;
      overlay.hidden = true;
      document.body.classList.remove("search-open");
      const smooth = window.MokaLightSmoothScroll;
      if (smooth && smooth.active) smooth.lenis.start();
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-search-trigger]");
      if (!trigger) return;
      e.preventDefault();
      openModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeModal();
        return;
      }
      // "/" opens search, matching common doc-site convention.
      const tag = (document.activeElement || {}).tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
        e.preventDefault();
        openModal();
      }
    });
  });
})();
