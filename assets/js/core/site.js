/* Shared site chrome: header state, navigation, mega menu, and mobile drawer. */
(function () {
  "use strict";

  const { onReady } = window.MokaLightUtils;
  onReady(() => {
    // ----- Sticky header shadow on scroll -----
    const header = document.querySelector(".site-header");
    if (header) {
      const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    // ----- Same-page anchor smooth scrolling -----
    // A CSS `scroll-behavior: smooth` on the root breaks the browser's native
    // scroll restoration on back/forward, so smooth scrolling is applied only
    // to user-initiated same-page anchor clicks.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.addEventListener("click", (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const hash = link.getAttribute("href");
      if (hash.length < 2) return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      history.pushState(null, "", hash);
    });

    // ----- Mega menu -----
    const items = document.querySelectorAll(".nav-item.has-mega, .nav-item.has-dropdown");
    const megas = document.querySelectorAll(".mega");

    let openTimer = null;
    let closeTimer = null;

    const closeAll = () => {
      items.forEach((it) => it.classList.remove("is-open"));
      megas.forEach((m) => m.classList.remove("is-open"));
    };

    const openItem = (item) => {
      clearTimeout(closeTimer);
      clearTimeout(openTimer);
      const id = item.dataset.mega;
      const panel = id ? document.getElementById(id) : null;
      items.forEach((it) => it.classList.toggle("is-open", it === item));
      megas.forEach((m) => m.classList.toggle("is-open", m === panel));
    };

    items.forEach((item) => {
      const link = item.querySelector(".nav-link");
      const id = item.dataset.mega;
      const panel = id && document.getElementById(id);

      item.addEventListener("mouseenter", () => {
        clearTimeout(closeTimer);
        openTimer = setTimeout(() => openItem(item), 80);
      });
      item.addEventListener("mouseleave", () => {
        clearTimeout(openTimer);
        closeTimer = setTimeout(() => {
          item.classList.remove("is-open");
          panel && panel.classList.remove("is-open");
        }, 120);
      });

      if (panel) {
        panel.addEventListener("mouseenter", () => clearTimeout(closeTimer));
        panel.addEventListener("mouseleave", () => {
          closeTimer = setTimeout(() => {
            item.classList.remove("is-open");
            panel.classList.remove("is-open");
          }, 120);
        });
      }

      // keyboard accessibility
      if (link) {
        link.addEventListener("focus", () => openItem(item));
        link.addEventListener("keydown", (e) => {
          if (e.key === "Escape") { closeAll(); link.blur(); }
        });
      }
    });

    // click toggle for touch devices and the open mobile drawer
    items.forEach((item) => {
      const link = item.querySelector(".nav-link");
      if (!link) return;
      link.addEventListener("click", (e) => {
        if (window.matchMedia("(hover: none)").matches || header.classList.contains("menu-open")) {
          e.preventDefault();
          const isOpen = item.classList.contains("is-open");
          closeAll();
          if (!isOpen) openItem(item);
        }
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAll();
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".nav-item.has-mega") && !e.target.closest(".nav-item.has-dropdown") && !e.target.closest(".mega")) closeAll();
    });

    // ----- Mobile drawer -----
    const toggle = document.querySelector(".nav-toggle");
    if (toggle && header) {
      toggle.addEventListener("click", () => {
        const open = header.classList.toggle("menu-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      // leaf links navigate; close the drawer so the destination is not covered
      header.querySelector(".nav-list").addEventListener("click", (e) => {
        const link = e.target.closest("a");
        if (!link) return;
        const item = link.closest(".nav-item");
        const isToggler = link.classList.contains("nav-link") && item &&
          (item.classList.contains("has-mega") || item.classList.contains("has-dropdown"));
        if (!isToggler && header.classList.contains("menu-open")) {
          header.classList.remove("menu-open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    }
  });
})();

