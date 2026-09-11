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
      const panel = document.getElementById(id);
      if (!panel) return;
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

    // click toggle for touch devices
    items.forEach((item) => {
      const link = item.querySelector(".nav-link");
      if (!link) return;
      link.addEventListener("click", (e) => {
        if (window.matchMedia("(hover: none)").matches) {
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
      if (!e.target.closest(".nav-item.has-mega") && !e.target.closest(".mega")) closeAll();
    });

    // ----- Mobile drawer -----
    const toggle = document.querySelector(".nav-toggle");
    if (toggle && header) {
      toggle.addEventListener("click", () => {
        header.classList.toggle("menu-open");
      });
    }
  });
})();

