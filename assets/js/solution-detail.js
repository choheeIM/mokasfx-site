/* ============================================================
   SOLUTION DETAIL PAGE — interactions
   - reveal on scroll
   - fit-check "spec sheet" animation + travelling dot
   - scope-of-supply table animation trigger
   - sticky TOC: appears after the hero, hides at the footer,
     scrollspy active state
   - system architecture: hover/tap a node -> caption + zoom
   - zone plan: map <-> accordion sync (hover + click/tap)
   - fixture cards: tap-to-preview for touch devices
   ============================================================ */
(function () {
  "use strict";

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".sd-reveal");
  if ("IntersectionObserver" in window) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- one-shot inview triggers (fit table, scope table) ---------- */
  ["sd-fit", "sd-scope"].forEach(function (cls) {
    var el = document.querySelector("." + cls);
    if (!el) return;
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            el.classList.add("is-inview");
            io.disconnect();
          }
        });
      }, { threshold: 0.25 });
      io.observe(el);
    } else {
      el.classList.add("is-inview");
    }
  });

  /* ---------- fit table: dot travels to the hovered row ---------- */
  var fit = document.querySelector(".sd-fit");
  var fitDot = document.querySelector("[data-fit-dot]");
  if (fit && fitDot) {
    var moveDot = function (row) {
      fitDot.style.top = (row.offsetTop + row.offsetHeight / 2 - 4) + "px";
    };
    fit.querySelectorAll(".sd-fit-row").forEach(function (row) {
      row.addEventListener("mouseenter", function () { moveDot(row); });
      row.addEventListener("focus", function () { moveDot(row); });
    });
    /* park the dot on the first row once the intro animation settles */
    setTimeout(function () {
      var first = fit.querySelector(".sd-fit-row");
      if (first) moveDot(first);
    }, 1400);
  }

  /* ---------- sticky TOC: show after hero, hide at footer, scrollspy ---------- */
  var toc = document.querySelector(".sd-toc");
  var hero = document.getElementById("overview");
  var footer = document.querySelector(".site-footer");
  if (toc) {
    var updateToc = function () {
      var pastHero = window.scrollY > (hero ? hero.offsetHeight * 0.65 : 600);
      var nearFooter = footer
        ? footer.getBoundingClientRect().top < window.innerHeight * 0.9
        : false;
      toc.classList.toggle("is-shown", pastHero && !nearFooter);
    };
    window.addEventListener("scroll", updateToc, { passive: true });
    window.addEventListener("resize", updateToc);
    updateToc();
  }

  var tocLinks = document.querySelectorAll(".sd-toc-list a");
  if (tocLinks.length && "IntersectionObserver" in window) {
    var tocMap = {};
    tocLinks.forEach(function (a) {
      tocMap[a.getAttribute("href").slice(1)] = a;
    });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && tocMap[entry.target.id]) {
          tocLinks.forEach(function (a) { a.classList.remove("is-active"); });
          tocMap[entry.target.id].classList.add("is-active");
        }
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    Object.keys(tocMap).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  /* ---------- system architecture: node -> caption ---------- */
  var archCaption = document.querySelector("[data-arch-caption]");
  if (archCaption) {
    var captionText = archCaption.querySelector("span");
    var defaultCaption = captionText.textContent;
    var swapCaption = function (text) {
      archCaption.classList.add("is-swapping");
      setTimeout(function () {
        captionText.textContent = text;
        archCaption.classList.remove("is-swapping");
      }, 200);
    };
    document.querySelectorAll(".arch-node[data-desc]").forEach(function (node) {
      var desc = node.getAttribute("data-desc");
      var activate = function () {
        document.querySelectorAll(".arch-node.is-active").forEach(function (n) {
          n.classList.remove("is-active");
        });
        node.classList.add("is-active");
        swapCaption(desc);
      };
      var deactivate = function () {
        node.classList.remove("is-active");
        swapCaption(defaultCaption);
      };
      node.addEventListener("mouseenter", activate);
      node.addEventListener("mouseleave", deactivate);
      node.addEventListener("focus", activate);
      node.addEventListener("blur", deactivate);
      /* touch: tap toggles, tap elsewhere dismisses */
      node.addEventListener("click", function (e) {
        e.stopPropagation();
        if (node.classList.contains("is-active")) {
          deactivate();
        } else {
          activate();
        }
      });
    });
    document.addEventListener("click", function () {
      document.querySelectorAll(".arch-node.is-active").forEach(function (n) {
        n.classList.remove("is-active");
      });
      swapCaption(defaultCaption);
    });
  }

  /* ---------- zone plan: map <-> accordion sync ---------- */
  var svg = document.querySelector(".sd-zone-svg");
  var zoneCards = document.querySelectorAll(".sd-zone-card[data-zone]");

  var openZoneCard = function (card, open) {
    card.classList.toggle("is-open", open);
    var btn = card.querySelector(".sd-zone-head");
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
  };

  var highlightZone = function (zone) {
    if (svg) {
      svg.classList.toggle("dim", Boolean(zone));
      svg.querySelectorAll("[data-zone]").forEach(function (g) {
        g.classList.toggle("is-active", Boolean(zone) && g.getAttribute("data-zone") === zone);
      });
    }
    zoneCards.forEach(function (c) {
      c.classList.toggle("is-active", Boolean(zone) && c.getAttribute("data-zone") === zone);
    });
  };

  zoneCards.forEach(function (card) {
    var zone = card.getAttribute("data-zone");
    var head = card.querySelector(".sd-zone-head");
    if (head) {
      head.addEventListener("click", function () {
        var willOpen = !card.classList.contains("is-open");
        /* accordion behaviour: one open at a time */
        zoneCards.forEach(function (c) { openZoneCard(c, false); });
        openZoneCard(card, willOpen);
        highlightZone(willOpen ? zone : null);
      });
    }
    card.addEventListener("mouseenter", function () { highlightZone(zone); });
    card.addEventListener("mouseleave", function () {
      var openCard = document.querySelector(".sd-zone-card.is-open");
      highlightZone(openCard ? openCard.getAttribute("data-zone") : null);
    });
  });

  if (svg) {
    svg.querySelectorAll("[data-zone]").forEach(function (g) {
      var zone = g.getAttribute("data-zone");
      g.addEventListener("mouseenter", function () { highlightZone(zone); });
      g.addEventListener("mouseleave", function () {
        var openCard = document.querySelector(".sd-zone-card.is-open");
        highlightZone(openCard ? openCard.getAttribute("data-zone") : null);
      });
      /* tap/click on the map opens the matching card and scrolls to it */
      g.addEventListener("click", function () {
        var card = document.querySelector('.sd-zone-card[data-zone="' + zone + '"]');
        if (!card) return;
        zoneCards.forEach(function (c) { openZoneCard(c, false); });
        openZoneCard(card, true);
        highlightZone(zone);
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }

  /* ---------- fixture cards: tap-to-preview on touch / keyboard ---------- */
  document.querySelectorAll(".sd-fixture-media").forEach(function (media) {
    var card = media.closest(".sd-fixture-card");
    if (!card) return;
    var toggle = function () { card.classList.toggle("is-preview"); };
    media.addEventListener("click", toggle);
    media.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
  });
})();
