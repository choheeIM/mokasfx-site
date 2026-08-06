/* Lumora — main.js
   - Sticky header state
   - Mega menu open/close (hover + keyboard)
   - Mobile drawer toggle
   - Filter chips
*/
(function () {
  "use strict";

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

  // ----- Filter chips -----
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
      visible.forEach((c, idx) => {
        c.style.gridColumn = idx === 0 && visible.length > 0 ? 'span 2' : '';
      });
    };
    const initial = document.querySelector('.solutions-overview-item.is-active') || ovItems[0];
    apply(initial.dataset.category);
    ovItems.forEach((item) => {
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      item.addEventListener('click', () => {
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

  // ----- Why Choose us: scroll-linked text reveal -----
  const scrollSection = document.querySelector('[data-why-scroll-section]');
  if (scrollSection) {
    const texts = Array.from(scrollSection.querySelectorAll('[data-why-scroll-text]'));
    const progress = scrollSection.querySelector('[data-why-scroll-progress]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (texts.length && !reducedMotion) {
      let ticking = false;

      const update = () => {
        ticking = false;
        const rect = scrollSection.getBoundingClientRect();
        const range = Math.max(1, scrollSection.offsetHeight - window.innerHeight);
        const p = Math.min(1, Math.max(0, -rect.top / range));
        const step = Math.min(texts.length - 1, Math.floor(p * texts.length));
        const local = p * texts.length - step;
        const hold = 0.35;
        const fadeStart = 1 - hold;
        let currentOpacity = 1;
        let nextOpacity = 0;

        if (step < texts.length - 1) {
          const fade = Math.max(0, Math.min(1, (local - fadeStart) / hold));
          currentOpacity = 1 - fade;
          nextOpacity = fade;
        }

        texts.forEach((text, i) => {
          let opacity = 0;
          if (i === step) opacity = currentOpacity;
          else if (i === step + 1) opacity = nextOpacity;
          text.style.opacity = String(Math.max(0, Math.min(1, opacity)));
          text.style.transform = `translateY(${(1 - opacity) * 14}px)`;
        });

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
})();
