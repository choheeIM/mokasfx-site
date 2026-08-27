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

  // ----- Hero blackout / categories pinned flashlight reveal -----
  const hero = document.querySelector(".hero");
  const heroStage = document.querySelector("[data-hero-light-stage]");
  const categoriesStage = document.querySelector("[data-categories-light-stage]");
  if (hero && heroStage && categoriesStage) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobileQuery = window.matchMedia("(max-width: 1100px)");
    const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
    const easeOut = (value) => 1 - Math.pow(1 - clamp(value), 3);
    const easeInQuad = (value) => Math.pow(clamp(value), 2);
    const maxSpotSize = 82;
    const flashlightMin = 15;
    const flashlightMax = 96;
    // 全黑停留帧数：60Hz 屏每帧 ≈16.7ms（15帧≈250ms），120Hz 屏翻倍速度，想要更久就调大
    const blackoutFrames = 1000;
    // 初始光圈停留：滚动进度(0~1)低于此值时光圈保持不动，越大停留越久
    const flashlightHoldEnd = 0.85;
    const factoryText = categoriesStage.querySelector(".factory-intro-text");
    const scrollLightMask = document.createElement("div");
    scrollLightMask.className = "scroll-light-mask";
    scrollLightMask.setAttribute("aria-hidden", "true");
    document.body.appendChild(scrollLightMask);

    if (reducedMotion) {
      scrollLightMask.style.setProperty("--scroll-mask-opacity", "0");
      scrollLightMask.style.setProperty("--scroll-spot-size", `${maxSpotSize}vmax`);
      scrollLightMask.style.setProperty("--scroll-spot-feather-soft", "8vmax");
      scrollLightMask.style.setProperty("--scroll-spot-feather-mid", "24vmax");
      scrollLightMask.style.setProperty("--scroll-spot-feather-end", "52vmax");
    } else {
      let ticking = false;
      let flashOn = false;
      let flashFrames = 0;

      const setMask = (opacity, spotSize, featherScale, warm = 0, rim = 0) => {
        const featherSoft = 8 * featherScale;
        const featherMid = 24 * featherScale;
        const featherEnd = 52 * featherScale;

        scrollLightMask.style.setProperty("--scroll-mask-opacity", opacity.toFixed(3));
        scrollLightMask.style.setProperty("--scroll-spot-size", `${spotSize.toFixed(2)}vmax`);
        scrollLightMask.style.setProperty("--scroll-spot-feather-soft", `${featherSoft.toFixed(2)}vmax`);
        scrollLightMask.style.setProperty("--scroll-spot-feather-mid", `${featherMid.toFixed(2)}vmax`);
        scrollLightMask.style.setProperty("--scroll-spot-feather-end", `${featherEnd.toFixed(2)}vmax`);
        scrollLightMask.style.setProperty("--scroll-spot-warm", warm.toFixed(3));
        scrollLightMask.style.setProperty("--scroll-spot-rim", rim.toFixed(3));
      };

      const updateScrollLighting = () => {
        ticking = false;

        const active = !mobileQuery.matches;
        categoriesStage.classList.toggle("light-stage-active", active);
        if (!active) {
          // No light animation on mobile
          categoriesStage.classList.remove("is-hidden");
          setMask(0, maxSpotSize, 1);
          return;
        }

        const viewportH = window.innerHeight || document.documentElement.clientHeight || 1;
        const stageRect = heroStage.getBoundingClientRect();
        const catRect = categoriesStage.getBoundingClientRect();
        const closeDistance = Math.max(1, heroStage.offsetHeight - viewportH);
        const closingProgress = clamp(-stageRect.top / closeDistance);

        if (closingProgress < 0.99 && catRect.top > 0) {
          // Hero lights-off: stays lit most of the scroll, snaps shut at the end
          categoriesStage.classList.add("is-hidden");
          flashOn = false;
          flashFrames = 0;
          scrollLightMask.style.setProperty("--scroll-spot-x", "50%");
          scrollLightMask.style.setProperty("--scroll-spot-y", "48%");
          const progress = easeInQuad(closingProgress);
          const rawSpotSize = maxSpotSize * (1 - progress);
          const spotSize = rawSpotSize < 0.35 ? 0 : rawSpotSize;
          const maskOpacity = clamp(closingProgress / 0.04);
          const featherScale = spotSize === 0 ? 0 : 1 - closingProgress;
          setMask(maskOpacity, spotSize, featherScale);
          return;
        }

        // Flashlight phase: snapped onto the factory intro copy, expanding with scroll
        categoriesStage.classList.remove("is-hidden");
        const pinDistance = Math.max(0, categoriesStage.offsetHeight - viewportH);
        const pinProgress = clamp(-catRect.top / Math.max(1, pinDistance));

        if (!flashOn) {
          // Hold the full blackout for blackoutFrames, then snap the light on
          flashFrames += 1;
          if (flashFrames <= blackoutFrames) {
            setMask(1, 0, 0);
            window.requestAnimationFrame(updateScrollLighting);
            return;
          }
          flashOn = true;
        }

        if (factoryText) {
          const textRect = factoryText.getBoundingClientRect();
          scrollLightMask.style.setProperty("--scroll-spot-x", `${(textRect.left + textRect.width * 0.4).toFixed(1)}px`);
          scrollLightMask.style.setProperty("--scroll-spot-y", `${(textRect.top + textRect.height * 0.42).toFixed(1)}px`);
        }

        const grow = clamp((pinProgress - 0.88) / 0.52);
        const spotSize = flashlightMin + (flashlightMax - flashlightMin) * grow;
        const warm = 0.38 * (1 - clamp((grow - 0.85) / 0.35));
        const rim = 0.55 * (1 - clamp((grow - 0.5) / 0.3));
        const featherScale = 0.35 + grow * 0.75;
        const maskOpacity = 1 - clamp((pinProgress - 0.86) / 0.14);
        setMask(maskOpacity, spotSize, featherScale, warm, rim);
      };

      const requestScrollLighting = () => {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(updateScrollLighting);
        }
      };

      window.addEventListener("scroll", requestScrollLighting, { passive: true });
      window.addEventListener("resize", requestScrollLighting, { passive: true });
      updateScrollLighting();
    }
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

  // ----- Products collection page: category links + paginated static products -----
  const productsGrid = document.querySelector("[data-products-grid]");
  const productsCategories = document.querySelector("[data-products-categories]");
  const productsPagination = document.querySelector("[data-products-pagination]");
  const productsSummary = document.querySelector("[data-products-summary]");
  if (productsGrid && productsCategories && productsPagination) {
    const perPage = 15;
    const imagePool = [
      "assets/img/light/02.jpg",
      "assets/img/light/1.jpg",
      "assets/img/light/100w LED摇头灯 白底图 (1).jpg",
      "assets/img/light/5.jpg"
    ];
    const productCategories = [
      { id: "waterproof", label: "Waterproof Light" },
      { id: "beam", label: "Beam Light" },
      { id: "wash", label: "Wash Light" },
      { id: "laser", label: "Laser Light" },
      { id: "kinetic", label: "Kinetic Light" },
      { id: "effect", label: "Effect Light" },
      { id: "par", label: "Par Light" },
      { id: "led-dance", label: "LED Dance Floor" },
      { id: "led-screen", label: "LED Screen" }
    ];
    const categoryCopy = {
      waterproof: "IP-rated housings, sealed optics and touring-ready output for outdoor stages.",
      beam: "Tight aerial beams with fast movement, sharp gobos and high-impact stage presence.",
      wash: "Smooth color mixing and even field coverage for clubs, theaters and event venues.",
      laser: "Precise laser effects for programmed shows, DJ sets and immersive installations.",
      kinetic: "Motion-driven fixtures for dynamic ceiling rigs and synchronized show moments.",
      effect: "Special effect fixtures that add texture, sparkle and atmosphere to live scenes.",
      par: "Compact PAR fixtures for reliable uplighting, truss washes and stage fills.",
      "led-dance": "Modular LED dance floor systems with durable panels and event-ready visuals.",
      "led-screen": "Rental-ready LED screen modules for stage backdrops and branded content."
    };
    const productTone = ["Pro", "Tour", "Studio", "Venue", "Matrix"];
    const productTypes = {
      waterproof: "Outdoor Beam",
      beam: "Beam Moving Head",
      wash: "Wash Moving Head",
      laser: "Laser Fixture",
      kinetic: "Kinetic Light",
      effect: "Effect Fixture",
      par: "LED PAR",
      "led-dance": "Dance Floor Panel",
      "led-screen": "LED Screen Panel"
    };
    const products = Array.from({ length: 45 }, (_, index) => {
      const category = productCategories[index % productCategories.length];
      const series = productTone[index % productTone.length];
      const number = String(index + 1).padStart(2, "0");
      return {
        id: `moka-${category.id}-${number}`,
        name: `MOKA ${series} ${productTypes[category.id]} ${number}`,
        category: category.id,
        categoryLabel: category.label,
        image: imagePool[index % imagePool.length],
        description: categoryCopy[category.id]
      };
    });

    const params = new URLSearchParams(window.location.search);
    const requestedCat = params.get("cat");
    const requestedSub = params.get("sub");
    let normalizedCat = requestedCat;
    if (requestedCat === "led" && requestedSub === "dance") normalizedCat = "led-dance";
    if (requestedCat === "led" && requestedSub === "screen") normalizedCat = "led-screen";
    const activeCategory = productCategories.some((category) => category.id === normalizedCat) ? normalizedCat : "all";
    const filteredProducts = activeCategory === "all"
      ? products
      : products.filter((product) => product.category === activeCategory);
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage));
    const requestedPage = Number.parseInt(params.get("page") || "1", 10);
    const activePage = Math.min(totalPages, Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1));
    const pageProducts = filteredProducts.slice((activePage - 1) * perPage, activePage * perPage);
    const activeCategoryLabel = activeCategory === "all"
      ? "All Products"
      : productCategories.find((category) => category.id === activeCategory).label;

    const buildUrl = (category, page = 1) => {
      const url = new URL("products.html", window.location.href);
      if (category && category !== "all") url.searchParams.set("cat", category);
      if (page > 1) url.searchParams.set("page", String(page));
      return `${url.pathname.split("/").pop()}${url.search}`;
    };
    const currentAttr = (isCurrent) => isCurrent ? ' aria-current="page"' : "";

    const countByCategory = (categoryId) => products.filter((product) => product.category === categoryId).length;
    productsCategories.innerHTML = [
      `<a class="products-category-link${activeCategory === "all" ? " is-active" : ""}" href="${buildUrl("all")}"${currentAttr(activeCategory === "all")}><span>All Products</span><span>${products.length}</span></a>`,
      ...productCategories.map((category) => (
        `<a class="products-category-link${activeCategory === category.id ? " is-active" : ""}" href="${buildUrl(category.id)}"${currentAttr(activeCategory === category.id)}><span>${category.label}</span><span>${countByCategory(category.id)}</span></a>`
      ))
    ].join("");

    productsGrid.innerHTML = pageProducts.map((product) => (
      `<article class="product-card">
        <a class="product-card-media" href="product-detail.html?id=${encodeURIComponent(product.id)}" aria-label="View ${product.name}">
          <img src="${product.image}" alt="${product.name}" loading="lazy">
        </a>
        <div class="product-card-body">
          <span class="product-card-category">${product.categoryLabel}</span>
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <a class="product-card-link" href="product-detail.html?id=${encodeURIComponent(product.id)}">View Details <span aria-hidden="true">&rarr;</span></a>
        </div>
      </article>`
    )).join("");

    const rangeStart = filteredProducts.length ? (activePage - 1) * perPage + 1 : 0;
    const rangeEnd = Math.min(activePage * perPage, filteredProducts.length);
    if (productsSummary) {
      productsSummary.textContent = `Showing ${rangeStart}-${rangeEnd} of ${filteredProducts.length} ${activeCategoryLabel}`;
    }

    const pageLinks = [];
    pageLinks.push(`<a class="products-page-link${activePage === 1 ? " is-disabled" : ""}" href="${buildUrl(activeCategory, Math.max(1, activePage - 1))}" aria-disabled="${activePage === 1 ? "true" : "false"}" aria-label="Previous page">&larr;</a>`);
    for (let page = 1; page <= totalPages; page += 1) {
      pageLinks.push(`<a class="products-page-link${page === activePage ? " is-active" : ""}" href="${buildUrl(activeCategory, page)}"${currentAttr(page === activePage)}>${page}</a>`);
    }
    pageLinks.push(`<a class="products-page-link${activePage === totalPages ? " is-disabled" : ""}" href="${buildUrl(activeCategory, Math.min(totalPages, activePage + 1))}" aria-disabled="${activePage === totalPages ? "true" : "false"}" aria-label="Next page">&rarr;</a>`);
    productsPagination.innerHTML = pageLinks.join("");
  }

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

  // ----- Solutions page: premium reveal + light scroll motion -----
  const solutionsPage = document.querySelector('[data-solutions-page]');
  if (solutionsPage) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobileSolutions = window.matchMedia('(max-width: 720px)');
    const heroMedia = solutionsPage.querySelector('[data-solutions-hero-media]');
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    let revealObserver = null;
    let requestSolutionsMotion = null;

    const observeReveal = (target) => {
      if (!target) return;
      if (reducedMotion) {
        target.classList.add('is-visible');
      } else if (revealObserver) {
        revealObserver.observe(target);
      } else {
        target.classList.add('is-visible');
      }
    };

    if (reducedMotion) {
      Array.from(solutionsPage.querySelectorAll('[data-reveal], [data-solution-showcase-scene]')).forEach(observeReveal);
    } else {
      if ('IntersectionObserver' in window) {
        revealObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
      }
      Array.from(solutionsPage.querySelectorAll('[data-reveal], [data-solution-showcase-scene]')).forEach(observeReveal);
    }

    const solutionShowcaseData = {
      performance: {
        label: 'Performance',
        scenes: [
          {
            eyebrow: 'PERFORMANCE / CONCERTS',
            title: 'Concert Lighting Solutions',
            description: 'High-impact concert lighting for large-scale shows, touring stages, and immersive live performances. Designed for power, precision, and dramatic visual rhythm.',
            image: 'assets/img/solutions/solutions-performance.jpg',
            width: 1200,
            height: 840,
            alt: 'Large concert stage with blue beams, LED screens and a live audience'
          },
          {
            eyebrow: 'PERFORMANCE / THEATERS',
            title: 'Theater Lighting Solutions',
            description: 'Balanced, expressive lighting systems for theaters and dramatic productions. Precise control, layered atmosphere, and clean visual storytelling.',
            image: 'assets/img/solutions/solutions-multipurpose.jpg',
            width: 1200,
            height: 755,
            alt: 'Professional theater-style stage lighting with warm venue atmosphere'
          },
          {
            eyebrow: 'PERFORMANCE / LIVE HOUSE',
            title: 'Live House Lighting Solutions',
            description: 'Compact yet energetic lighting setups for live houses and intimate music venues. Built to amplify atmosphere, audience engagement, and rhythm-driven shows.',
            image: 'assets/img/solutions/solutions-nightlife.jpg',
            width: 1200,
            height: 768,
            alt: 'Compact live house and club stage with purple blue beams and haze'
          },
          {
            eyebrow: 'PERFORMANCE / MUSIC FESTIVAL',
            title: 'Music Festival Lighting Solutions',
            description: 'Festival-ready lighting systems for outdoor main stages, guest acts, and high-output show moments that need scale, speed, and reliable touring control.',
            image: 'assets/img/solutions/solutions-hero-stage.jpg',
            width: 1920,
            height: 1080,
            alt: 'Large music festival stage with touring lighting rigs and audience energy'
          },
          {
            eyebrow: 'PERFORMANCE / TOURING STAGE',
            title: 'Touring Stage Lighting Solutions',
            description: 'Road-ready lighting packages designed for fast setup, consistent programming, and repeatable looks across touring venues.',
            image: 'assets/img/solutions/solutions-performance.jpg',
            width: 1200,
            height: 840,
            alt: 'Touring performance stage with moving heads, beams and LED screens'
          },
          {
            eyebrow: 'PERFORMANCE / PERFORMING ARTS',
            title: 'Performing Arts Lighting Solutions',
            description: 'Expressive lighting control for dance, drama, music, and mixed-stage productions where timing and atmosphere carry the story.',
            image: 'assets/img/solutions/solutions-multipurpose.jpg',
            width: 1200,
            height: 755,
            alt: 'Performing arts venue with stage wash and theatrical lighting'
          },
          {
            eyebrow: 'PERFORMANCE / TV PERFORMANCE',
            title: 'TV Performance Lighting Solutions',
            description: 'Camera-conscious lighting for televised performances, live recording stages, and broadcast-friendly entertainment productions.',
            image: 'assets/img/solutions/solutions-hero-stage.jpg',
            width: 1920,
            height: 1080,
            alt: 'TV performance stage with controlled beams and broadcast-ready lighting'
          }
        ]
      },
      multipurpose: {
        label: 'Multipurpose Venue',
        scenes: [
          {
            eyebrow: 'MULTIPURPOSE VENUE / STUDIO',
            title: 'Studio Lighting Solutions',
            description: 'Flexible studio lighting packages for content production, rehearsal spaces, and controlled indoor shooting environments.',
            image: 'assets/img/solutions/solutions-multipurpose.jpg',
            width: 1200,
            height: 755,
            alt: 'Multipurpose studio and event venue with professional lighting'
          },
          {
            eyebrow: 'MULTIPURPOSE VENUE / BROADCAST STUDIO',
            title: 'Broadcast Studio Lighting Solutions',
            description: 'Clean, repeatable lighting for broadcast studios, live streaming stages, and camera-ready production rooms.',
            image: 'assets/img/solutions/solutions-hero-stage.jpg',
            width: 1920,
            height: 1080,
            alt: 'Broadcast-ready stage lighting environment with controlled beams'
          },
          {
            eyebrow: 'MULTIPURPOSE VENUE / HOUSE OF WORSHIP',
            title: 'House of Worship Lighting Solutions',
            description: 'Atmospheric yet respectful lighting systems for worship services, ceremonies, and community event programming.',
            image: 'assets/img/solutions/solutions-performance.jpg',
            width: 1200,
            height: 840,
            alt: 'Worship and community stage lighting with audience-facing beams'
          },
          {
            eyebrow: 'MULTIPURPOSE VENUE / WEDDING',
            title: 'Wedding Lighting Solutions',
            description: 'Elegant lighting for ceremonies, banquets, and celebration stages where ambience and reliability matter equally.',
            image: 'assets/img/solutions/solutions-multipurpose.jpg',
            width: 1200,
            height: 755,
            alt: 'Wedding and banquet venue with warm stage lighting'
          },
          {
            eyebrow: 'MULTIPURPOSE VENUE / CONFERENCE HALL',
            title: 'Conference Hall Lighting Solutions',
            description: 'Professional lighting for keynote stages, product launches, award programs, and hybrid corporate events.',
            image: 'assets/img/solutions/solutions-hero-stage.jpg',
            width: 1920,
            height: 1080,
            alt: 'Conference hall stage with presentation lighting and LED backdrop'
          },
          {
            eyebrow: 'MULTIPURPOSE VENUE / AUDITORIUM',
            title: 'Auditorium Lighting Solutions',
            description: 'Balanced front light, stage wash, and accent effects for auditoriums with diverse programming needs.',
            image: 'assets/img/solutions/solutions-performance.jpg',
            width: 1200,
            height: 840,
            alt: 'Auditorium stage lighting with bright beams and audience area'
          },
          {
            eyebrow: 'MULTIPURPOSE VENUE / BANQUET HALL',
            title: 'Banquet Hall Lighting Solutions',
            description: 'Scene-based lighting packages for banquets, hotel ballrooms, and flexible halls that host many event formats.',
            image: 'assets/img/solutions/solutions-multipurpose.jpg',
            width: 1200,
            height: 755,
            alt: 'Banquet hall with professional lighting and event atmosphere'
          }
        ]
      },
      nightlife: {
        label: 'Nightlife',
        scenes: [
          {
            eyebrow: 'NIGHTLIFE / BAR',
            title: 'Bar Lighting Solutions',
            description: 'Compact effects, color texture, and reliable control for bars that need strong atmosphere in limited space.',
            image: 'assets/img/solutions/solutions-nightlife.jpg',
            width: 1200,
            height: 768,
            alt: 'Bar lighting scene with colorful beams and haze'
          },
          {
            eyebrow: 'NIGHTLIFE / KARAOKE',
            title: 'Karaoke Lighting Solutions',
            description: 'Room-friendly lighting systems for karaoke venues, private rooms, and small entertainment suites.',
            image: 'assets/img/solutions/solutions-hero-stage.jpg',
            width: 1920,
            height: 1080,
            alt: 'Small entertainment stage with colored moving light beams'
          },
          {
            eyebrow: 'NIGHTLIFE / CLUB',
            title: 'Club Lighting Solutions',
            description: 'High-energy beams, lasers, strobes, and synchronized effects for nightclubs and DJ-led venues.',
            image: 'assets/img/solutions/solutions-nightlife.jpg',
            width: 1200,
            height: 768,
            alt: 'Nightclub interior with laser beams and moving lights'
          },
          {
            eyebrow: 'NIGHTLIFE / LOUNGE',
            title: 'Lounge Lighting Solutions',
            description: 'Low-glare accent lighting and soft movement effects for lounges, VIP rooms, and premium nightlife spaces.',
            image: 'assets/img/solutions/solutions-multipurpose.jpg',
            width: 1200,
            height: 755,
            alt: 'Premium lounge-style venue with warm ambient stage lighting'
          }
        ]
      },
      outdoor: {
        label: 'Outdoor',
        scenes: [
          {
            eyebrow: 'OUTDOOR / TOURIST TOWN',
            title: 'Tourist Town Lighting Solutions',
            description: 'Weather-ready lighting for themed streets, night tours, cultural plazas, and destination entertainment zones.',
            image: 'assets/img/solutions/solutions-outdoor.jpg',
            width: 1200,
            height: 691,
            alt: 'Outdoor tourist attraction with water, color beams and night lighting'
          },
          {
            eyebrow: 'OUTDOOR / THEME PARK',
            title: 'Theme Park Lighting Solutions',
            description: 'Durable lighting systems for theme parks, parade routes, outdoor stages, and nightly show moments.',
            image: 'assets/img/solutions/solutions-outdoor.jpg',
            width: 1200,
            height: 691,
            alt: 'Theme park night attraction with theatrical outdoor lighting'
          },
          {
            eyebrow: 'OUTDOOR / OUTDOOR ATTRACTION',
            title: 'Outdoor Attraction Lighting Solutions',
            description: 'Long-throw beams, waterproof fixtures, and show-control-ready effects for open-air attractions.',
            image: 'assets/img/solutions/solutions-performance.jpg',
            width: 1200,
            height: 840,
            alt: 'Open-air stage lighting with strong beams and crowd atmosphere'
          },
          {
            eyebrow: 'OUTDOOR / PUBLIC ENTERTAINMENT PROJECT',
            title: 'Public Entertainment Project Lighting Solutions',
            description: 'Integrated lighting for public cultural projects, commercial plazas, scenic installations, and seasonal shows.',
            image: 'assets/img/solutions/solutions-hero-stage.jpg',
            width: 1920,
            height: 1080,
            alt: 'Large public entertainment lighting project with LED screens and beams'
          }
        ]
      }
    };

    const showcase = solutionsPage.querySelector('[data-solution-showcase]');
    const showcaseScenes = showcase && showcase.querySelector('[data-solution-showcase-scenes]');
    const showcaseTabs = showcase ? Array.from(showcase.querySelectorAll('[data-solution-showcase-tab]')) : [];
    const showcasePagination = showcase && showcase.querySelector('[data-solution-showcase-pagination]');
    const showcasePageList = showcasePagination && showcasePagination.querySelector('[data-solution-page-list]');
    const showcasePrev = showcasePagination && showcasePagination.querySelector('[data-solution-page-prev]');
    const showcaseNext = showcasePagination && showcasePagination.querySelector('[data-solution-page-next]');
    const validShowcaseCategories = new Set(Object.keys(solutionShowcaseData));
    const showcasePageSize = 4;
    let activeShowcaseCategory = 'performance';
    let activeShowcasePage = 1;

    const escapeHtml = (value) => String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const sceneTemplate = (scene) => (
      `<article class="solution-showcase__scene" data-solution-showcase-scene>
        <figure class="solution-showcase__media">
          <img class="solution-showcase__image" src="${escapeHtml(scene.image)}" alt="${escapeHtml(scene.alt)}" width="${scene.width}" height="${scene.height}" loading="lazy" decoding="async">
        </figure>
        <div class="solution-showcase__content">
          <div class="solution-showcase__content-inner">
            <p class="solution-showcase__eyebrow">${escapeHtml(scene.eyebrow)}</p>
            <h3>${escapeHtml(scene.title)}</h3>
            <p class="solution-showcase__description">${escapeHtml(scene.description)}</p>
            <a class="solution-showcase__cta" href="contact.html#inquiry">Explore scene <span aria-hidden="true">&rarr;</span></a>
          </div>
        </div>
      </article>`
    );

    const getShowcaseTotalPages = (category) => {
      const group = solutionShowcaseData[category] || solutionShowcaseData.performance;
      return Math.max(1, Math.ceil(group.scenes.length / showcasePageSize));
    };

    const normalizeShowcasePage = (category, page) => {
      const totalPages = getShowcaseTotalPages(category);
      const parsedPage = Number.parseInt(page, 10);
      if (!Number.isFinite(parsedPage)) return 1;
      return Math.min(totalPages, Math.max(1, parsedPage));
    };

    const updateShowcasePagination = (category, page) => {
      if (!showcasePagination || !showcasePageList || !showcasePrev || !showcaseNext) return;
      const totalPages = getShowcaseTotalPages(category);

      showcasePrev.disabled = page <= 1;
      showcaseNext.disabled = page >= totalPages;

      showcasePageList.innerHTML = Array.from({ length: totalPages }, (_, index) => {
        const pageNumber = index + 1;
        const active = pageNumber === page;
        return `<button class="solution-showcase__page-num${active ? ' is-active' : ''}" type="button" data-solution-page="${pageNumber}" aria-label="Show page ${pageNumber}"${active ? ' aria-current="page"' : ''}>${pageNumber}</button>`;
      }).join('');
    };

    const updateShowcaseTabs = (category) => {
      showcaseTabs.forEach((tab) => {
        const active = tab.dataset.solutionShowcaseTab === category;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
        if (active && tab.parentElement && tab.parentElement.scrollWidth > tab.parentElement.clientWidth) {
          const nav = tab.parentElement;
          const targetLeft = tab.offsetLeft - (nav.clientWidth - tab.offsetWidth) / 2;
          nav.scrollTo({
            left: Math.max(0, targetLeft),
            behavior: reducedMotion ? 'auto' : 'smooth'
          });
        }
      });
    };

    const updateShowcaseUrl = (category, page) => {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set('cat', category);
      if (page > 1) {
        nextUrl.searchParams.set('page', String(page));
      } else {
        nextUrl.searchParams.delete('page');
      }
      nextUrl.searchParams.delete('sub');
      window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
    };

    const scrollToShowcase = () => {
      if (!showcase) return;
      showcase.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    };

    const renderShowcaseScenes = (category, page = 1) => {
      if (!showcaseScenes) return;
      const group = solutionShowcaseData[category] || solutionShowcaseData.performance;
      const currentPage = normalizeShowcasePage(category, page);
      const startIndex = (currentPage - 1) * showcasePageSize;
      showcaseScenes.innerHTML = group.scenes.slice(startIndex, startIndex + showcasePageSize).map(sceneTemplate).join('');
      updateShowcasePagination(category, currentPage);
      Array.from(showcaseScenes.querySelectorAll('[data-solution-showcase-scene]')).forEach(observeReveal);
      if (requestSolutionsMotion) requestSolutionsMotion();
    };

    const setShowcaseCategory = (category, options = {}) => {
      if (!showcase || !showcaseScenes) return;
      const nextCategory = validShowcaseCategories.has(category) ? category : 'performance';
      const nextPage = normalizeShowcasePage(nextCategory, options.page || 1);
      const shouldRender = nextCategory !== activeShowcaseCategory || nextPage !== activeShowcasePage || !showcaseScenes.children.length;

      activeShowcaseCategory = nextCategory;
      activeShowcasePage = nextPage;
      updateShowcaseTabs(nextCategory);
      if (options.updateUrl) updateShowcaseUrl(nextCategory, nextPage);

      if (!shouldRender) {
        if (options.scroll) scrollToShowcase();
        return;
      }

      const swap = () => {
        renderShowcaseScenes(nextCategory, nextPage);
        if (options.scroll) scrollToShowcase();
        if (!reducedMotion) {
          window.requestAnimationFrame(() => showcaseScenes.classList.remove('is-switching'));
        } else {
          showcaseScenes.classList.remove('is-switching');
        }
      };

      if (!reducedMotion && options.animate !== false) {
        showcaseScenes.classList.add('is-switching');
        window.setTimeout(swap, 190);
      } else {
        swap();
      }
    };

    if (showcase && showcaseScenes && showcaseTabs.length) {
      const params = new URLSearchParams(window.location.search);
      const requestedCategory = params.get('cat');
      const requestedPage = params.get('page') || '1';
      activeShowcaseCategory = validShowcaseCategories.has(requestedCategory) ? requestedCategory : 'performance';
      activeShowcasePage = normalizeShowcasePage(activeShowcaseCategory, requestedPage);

      showcaseTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          setShowcaseCategory(tab.dataset.solutionShowcaseTab, { page: 1, updateUrl: true, animate: true });
        });
      });

      solutionsPage.querySelectorAll('[data-solution-trigger]').forEach((trigger) => {
        trigger.addEventListener('click', (event) => {
          if (!event.target.closest('a')) return;
          event.preventDefault();
          setShowcaseCategory(trigger.dataset.solutionTrigger, { page: 1, scroll: true, updateUrl: true, animate: true });
        });
      });

      if (showcasePrev && showcaseNext && showcasePageList) {
        showcasePrev.addEventListener('click', () => {
          setShowcaseCategory(activeShowcaseCategory, { page: activeShowcasePage - 1, scroll: true, updateUrl: true, animate: true });
        });
        showcaseNext.addEventListener('click', () => {
          setShowcaseCategory(activeShowcaseCategory, { page: activeShowcasePage + 1, scroll: true, updateUrl: true, animate: true });
        });
        showcasePageList.addEventListener('click', (event) => {
          const pageButton = event.target.closest('[data-solution-page]');
          if (!pageButton) return;
          setShowcaseCategory(activeShowcaseCategory, { page: pageButton.dataset.solutionPage, scroll: true, updateUrl: true, animate: true });
        });
      }

      updateShowcaseTabs(activeShowcaseCategory);
      renderShowcaseScenes(activeShowcaseCategory, activeShowcasePage);
    }

    if (!reducedMotion) {
      let ticking = false;
      const updateSolutionsMotion = () => {
        ticking = false;
        const viewportH = window.innerHeight || document.documentElement.clientHeight || 1;

        if (heroMedia) {
          const hero = heroMedia.closest('.solutions-hero');
          if (hero) {
            const rect = hero.getBoundingClientRect();
            const progress = clamp(-rect.top / Math.max(1, rect.height), 0, 1);
            heroMedia.style.setProperty('--solutions-hero-y', `${(progress * 34).toFixed(2)}px`);
          }
        }

        if (!mobileSolutions.matches) {
          const motionItems = Array.from(solutionsPage.querySelectorAll('[data-solution-item]'));
          motionItems.forEach((item, index) => {
            const rect = item.getBoundingClientRect();
            const centerOffset = ((rect.top + rect.height / 2) - viewportH / 2) / viewportH;
            const direction = index % 2 === 0 ? -1 : 1;
            item.style.setProperty('--motion-y', `${(clamp(centerOffset, -1, 1) * 18 * direction).toFixed(2)}px`);
          });
          Array.from(solutionsPage.querySelectorAll('[data-solution-showcase-scene]')).forEach((scene, index) => {
            const image = scene.querySelector('.solution-showcase__image');
            if (!image) return;
            const rect = scene.getBoundingClientRect();
            const centerOffset = ((rect.top + rect.height / 2) - viewportH / 2) / viewportH;
            const direction = index % 2 === 0 ? -1 : 1;
            image.style.setProperty('--showcase-parallax', `${(clamp(centerOffset, -1, 1) * 22 * direction).toFixed(2)}px`);
          });
        } else {
          Array.from(solutionsPage.querySelectorAll('[data-solution-item]')).forEach((item) => item.style.setProperty('--motion-y', '0px'));
          Array.from(solutionsPage.querySelectorAll('.solution-showcase__image')).forEach((image) => image.style.setProperty('--showcase-parallax', '0px'));
        }
      };

      requestSolutionsMotion = () => {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(updateSolutionsMotion);
        }
      };

      window.addEventListener('scroll', requestSolutionsMotion, { passive: true });
      window.addEventListener('resize', requestSolutionsMotion, { passive: true });
      if (mobileSolutions.addEventListener) {
        mobileSolutions.addEventListener('change', requestSolutionsMotion);
      }
      updateSolutionsMotion();
    }
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

  // ----- Partners marquee: loop a small card queue without duplicating markup -----
  const partnersTrack = document.querySelector('[data-partners-track]');
  if (partnersTrack) {
    const marquee = partnersTrack.closest('.partners-marquee');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reducedMotion && marquee) {
      let offset = 0;
      let lastTime = performance.now();
      let paused = false;
      const speed = 34;

      const getGap = () => {
        const gap = parseFloat(getComputedStyle(partnersTrack).columnGap);
        return Number.isFinite(gap) ? gap : 0;
      };

      const step = (time) => {
        const delta = Math.min(64, time - lastTime);
        lastTime = time;

        if (!paused) {
          offset -= (speed * delta) / 1000;
          const firstCard = partnersTrack.firstElementChild;
          if (firstCard) {
            const cardWidth = firstCard.getBoundingClientRect().width + getGap();
            if (Math.abs(offset) >= cardWidth) {
              partnersTrack.appendChild(firstCard);
              offset += cardWidth;
            }
          }
          partnersTrack.style.transform = `translateX(${offset}px)`;
        }

        window.requestAnimationFrame(step);
      };

      marquee.addEventListener('mouseenter', () => { paused = true; });
      marquee.addEventListener('mouseleave', () => { paused = false; lastTime = performance.now(); });
      marquee.addEventListener('focusin', () => { paused = true; });
      marquee.addEventListener('focusout', () => { paused = false; lastTime = performance.now(); });
      window.requestAnimationFrame(step);
    }
  }

  // ----- B2B inquiry form validation and feedback -----
  const inquiryForms = Array.from(document.querySelectorAll('[data-inquiry-form]'));
  if (inquiryForms.length) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^\+?[0-9][0-9\s().-]{6,}$/;

    const setFeedback = (form, type, message) => {
      const feedback = form.querySelector('[data-form-feedback]');
      if (!feedback) return;
      feedback.textContent = message;
      feedback.classList.remove('is-success', 'is-error');
      feedback.classList.add('is-visible', type === 'success' ? 'is-success' : 'is-error');
    };

    const clearFeedback = (form) => {
      const feedback = form.querySelector('[data-form-feedback]');
      if (!feedback) return;
      feedback.textContent = '';
      feedback.classList.remove('is-visible', 'is-success', 'is-error');
    };

    const setFieldError = (field, message) => {
      const form = field.form;
      const error = form && form.querySelector(`[data-error-for="${field.name}"]`);
      field.classList.toggle('is-invalid', Boolean(message));
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (error) {
        error.textContent = message;
        if (!error.id && field.id) error.id = `${field.id}-error`;
        if (message && error.id) field.setAttribute('aria-describedby', error.id);
        if (!message) field.removeAttribute('aria-describedby');
      }
    };

    const validateField = (field) => {
      const value = field.value.trim();
      let message = '';
      if (field.required && !value) {
        message = field.dataset.errorRequired || 'Please complete this field.';
      } else if (field.type === 'email' && value && !emailPattern.test(value)) {
        message = field.dataset.errorFormat || 'Please enter a valid email address.';
      } else if (field.type === 'tel' && value && !phonePattern.test(value)) {
        message = field.dataset.errorFormat || 'Please enter a valid phone number.';
      }
      setFieldError(field, message);
      return !message;
    };

    inquiryForms.forEach((form) => {
      const fields = Array.from(form.querySelectorAll('input, select, textarea'));
      const countrySelect = form.querySelector('select[name="country"]');
      const otherCountryField = form.querySelector('[data-other-country-field]');
      const otherCountryInput = form.querySelector('input[name="countryOther"]');
      const submitButton = form.querySelector('button[type="submit"]');
      const submitLabel = submitButton ? (submitButton.dataset.submitLabel || submitButton.textContent) : '';
      const updateOtherCountry = () => {
        if (!countrySelect || !otherCountryField || !otherCountryInput) return;
        const showOther = countrySelect.value === 'Other';
        otherCountryField.hidden = !showOther;
        otherCountryInput.required = showOther;
        if (!showOther) {
          otherCountryInput.value = '';
          setFieldError(otherCountryInput, '');
        }
      };

      fields.forEach((field) => {
        field.addEventListener('input', () => {
          validateField(field);
          clearFeedback(form);
        });
        field.addEventListener('blur', () => validateField(field));
      });
      if (countrySelect) {
        countrySelect.addEventListener('change', () => {
          updateOtherCountry();
          clearFeedback(form);
        });
        updateOtherCountry();
      }

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        updateOtherCountry();
        const validFields = fields.map(validateField);
        const isValid = validFields.every(Boolean);
        const firstInvalid = fields.find((field) => field.classList.contains('is-invalid'));

        if (!isValid) {
          setFeedback(form, 'error', 'Please complete the required fields before submitting your inquiry.');
          if (firstInvalid) firstInvalid.focus();
          return;
        }

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = 'Submitting...';
        }
        setFeedback(form, 'success', 'Submitting your inquiry...');

        window.setTimeout(() => {
          setFeedback(form, 'success', 'Inquiry submitted successfully. Our sales team will contact you soon.');
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = submitLabel;
          }
          form.reset();
          updateOtherCountry();
          fields.forEach((field) => setFieldError(field, ''));
        }, 500);
      });
    });
  }

  // ----- Why Choose us: scroll-linked text reveal -----
  const scrollSection = document.querySelector('[data-why-scroll-section]');
  if (scrollSection) {
    const texts = Array.from(scrollSection.querySelectorAll('[data-why-scroll-text]'));
    const progress = scrollSection.querySelector('[data-why-scroll-progress]');
    const orbit = scrollSection.querySelector('[data-why-orbit]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobileWhyLayout = window.matchMedia('(max-width: 720px)');
    if (!reducedMotion) {
      if ('IntersectionObserver' in window) {
        const lightObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              scrollSection.classList.add('is-lit');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.32 });

        lightObserver.observe(scrollSection);
      } else {
        scrollSection.classList.add('is-lit');
      }
    }

    if (texts.length && !reducedMotion && !mobileWhyLayout.matches) {
      let ticking = false;

      const update = () => {
        ticking = false;
        const rect = scrollSection.getBoundingClientRect();
        const range = Math.max(1, scrollSection.offsetHeight - window.innerHeight);
        const p = Math.min(1, Math.max(0, -rect.top / range));
        const lightExit = Math.min(1, Math.max(0, (p - 0.65) / 0.35));
        const itemAngles = [34, 0, -34];
        const orbitAngle = -34 + p * 68;
        let activeIndex = 0;
        let activeDistance = Infinity;

        texts.forEach((text, i) => {
          const itemAngle = itemAngles[i] || 0;
          const distance = Math.abs(itemAngle + orbitAngle);
          const opacity = Math.max(0, Math.min(1, 1 - distance / 30));
          if (distance < activeDistance) {
            activeDistance = distance;
            activeIndex = i;
          }
          text.style.opacity = String(Math.max(0, Math.min(1, opacity)));
          text.style.filter = `blur(${(1 - opacity) * 2}px)`;
          text.style.zIndex = String(Math.round(opacity * 10));
        });

        scrollSection.style.setProperty('--why-orbit-angle', `${orbitAngle}deg`);
        scrollSection.style.setProperty('--why-light-collapse', `${lightExit * 100}%`);
        scrollSection.style.setProperty('--why-light-opacity', String(1 - lightExit * 0.82));
        if (orbit) orbit.dataset.active = String(activeIndex);
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
