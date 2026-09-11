/* Products page: compatibility fallback data plus filtering/pagination UI. */
(function () {
  "use strict";

  const { onReady } = window.MokaLightUtils;
  onReady(() => {
    const productsGrid = document.querySelector("[data-products-grid]");
    const productsCategories = document.querySelector("[data-products-categories]");
    const productsPagination = document.querySelector("[data-products-pagination]");
    const productsSummary = document.querySelector("[data-products-summary]");
    if (!productsGrid || !productsCategories || !productsPagination) return;

    // TODO: replace dynamic product rendering with a server-rendered WordPress product loop.
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
  });
})();
