/**
 * Static product-page generator (no dependencies).
 *
 * Compiles the product catalog below into fully pre-rendered HTML:
 *   site/products.html                          -> "All products" listing, page 1
 *   site/products/page/<n>/index.html           -> "All products" listing, page n
 *   site/products/<slug>/index.html             -> category listing, page 1
 *   site/products/<slug>/page/<n>/index.html    -> category listing, page n
 *
 * Every URL carries its own title, meta description, canonical link,
 * rel="prev"/rel="next", breadcrumbs and JSON-LD, and all product cards
 * live in the HTML source, so the catalog is fully indexable without JS.
 *
 * It also exports tools/products-catalog.csv — the same catalog in a flat
 * format that can later feed a WooCommerce/Elementor import.
 *
 * Run from the site directory:  node tools/build-products.mjs
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOOLS_DIR = dirname(fileURLToPath(import.meta.url));

/**
 * URL base for canonical links and structured data. Empty = root-relative
 * paths ("/products.html"). Set to the absolute origin (e.g.
 * "https://example.com") before production launch.
 */
const SITE_URL = "";

/** Products per listing page (3 columns x 10 rows). */
const PAGE_SIZE = 30;

const IMAGE_POOL = [
  "assets/img/light/02.jpg",
  "assets/img/light/1.jpg",
  "assets/img/light/100w LED摇头灯 白底图 (1).jpg",
  "assets/img/light/5.jpg",
];

const CATEGORIES = [
  {
    slug: "waterproof-light",
    label: "Waterproof Light",
    group: "Stage Lights",
    type: "Outdoor Beam",
    blurb: "IP-rated housings, sealed optics and touring-ready output for outdoor stages.",
    title: "Waterproof Stage Lights — IP65 Outdoor Lighting Fixtures | MOKA LITE",
    description:
      "IP65 waterproof moving heads, beams and washes for outdoor concerts, festivals and open-air installations. Sealed optics, die-cast housings, factory-direct from MOKA LITE.",
  },
  {
    slug: "beam-light",
    label: "Beam Light",
    group: "Stage Lights",
    type: "Beam Moving Head",
    blurb: "Tight aerial beams with fast movement, sharp gobos and high-impact stage presence.",
    title: "Beam Lights — Moving Head Beam Fixtures for Stage & Tour | MOKA LITE",
    description:
      "High-intensity beam moving head lights with narrow angles, fast pan/tilt and crisp gobos for concerts, clubs and touring rigs. Explore MOKA LITE beam fixtures.",
  },
  {
    slug: "wash-light",
    label: "Wash Light",
    group: "Stage Lights",
    type: "Wash Moving Head",
    blurb: "Smooth color mixing and even field coverage for clubs, theaters and event venues.",
    title: "Wash Lights — LED Moving Head Wash & Zoom Fixtures | MOKA LITE",
    description:
      "LED wash moving heads with smooth RGBW/CMY color mixing, wide zoom ranges and even field coverage for stages, theaters, churches and live events.",
  },
  {
    slug: "laser-light",
    label: "Laser Light",
    group: "Stage Lights",
    type: "Laser Fixture",
    blurb: "Precise laser effects for programmed shows, DJ sets and immersive installations.",
    title: "Laser Lights — RGB Animation Lasers for Shows & Clubs | MOKA LITE",
    description:
      "Professional RGB animation laser lights with ILDA/DMX control for concerts, nightclubs, DJ shows and immersive installations. Precision scanners from MOKA LITE.",
  },
  {
    slug: "kinetic-light",
    label: "Kinetic Light",
    group: "Stage Lights",
    type: "Kinetic Light",
    blurb: "Motion-driven fixtures for dynamic ceiling rigs and synchronized show moments.",
    title: "Kinetic Lights — Moving LED Winch & Lifting Ball Systems | MOKA LITE",
    description:
      "Kinetic lighting systems — DMX winches, lifting LED balls and motion-driven fixtures for dynamic ceilings, stage shows and architectural installations.",
  },
  {
    slug: "effect-light",
    label: "Effect Light",
    group: "Stage Lights",
    type: "Effect Fixture",
    blurb: "Special effect fixtures that add texture, sparkle and atmosphere to live scenes.",
    title: "Effect Lights — Strobes, Blinders & Special FX Fixtures | MOKA LITE",
    description:
      "Stage effect lights including strobes, blinders and atmospheric FX fixtures that add texture and impact to concerts, clubs and live productions.",
  },
  {
    slug: "par-light",
    label: "Par Light",
    group: "Stage Lights",
    type: "LED PAR",
    blurb: "Compact PAR fixtures for reliable uplighting, truss washes and stage fills.",
    title: "LED Par Lights — Uplighting & Stage Wash PAR Cans | MOKA LITE",
    description:
      "Compact LED PAR lights for uplighting, truss washes and stage fills — indoor and IP65 outdoor versions for weddings, events and permanent installs.",
  },
  {
    slug: "led-dance-floor",
    label: "LED Dance Floor",
    group: "LED Panels",
    type: "Dance Floor Panel",
    blurb: "Modular LED dance floor systems with durable panels and event-ready visuals.",
    title: "LED Dance Floors — Modular Interactive Floor Panels | MOKA LITE",
    description:
      "Modular LED dance floor panels with durable tempered-glass surfaces and pixel-mapped visuals for weddings, clubs, exhibitions and event rentals.",
  },
  {
    slug: "led-screen",
    label: "LED Screen",
    group: "LED Panels",
    type: "LED Screen Panel",
    blurb: "Rental-ready LED screen modules for stage backdrops and branded content.",
    title: "LED Screens — Rental LED Video Wall Panels for Stages | MOKA LITE",
    description:
      "Indoor and outdoor rental LED screen panels for stage backdrops, concerts and branded events. Fine-pitch, quick-lock cabinets from MOKA LITE.",
  },
];

/**
 * The catalog. To add a product: append an entry here (and drop its image
 * into assets/img/light/), then re-run the generator — listings, category
 * pages, pagination, counts, sitemap and the CSV export all update.
 */
const TONES = ["Pro", "Tour", "Studio", "Venue", "Matrix"];
const PRODUCTS = Array.from({ length: 45 }, (_, index) => {
  const category = CATEGORIES[index % CATEGORIES.length];
  const number = String(index + 1).padStart(2, "0");
  return {
    id: `moka-${category.slug}-${number}`,
    name: `MOKA ${TONES[index % TONES.length]} ${category.type} ${number}`,
    category: category.slug,
    image: IMAGE_POOL[index % IMAGE_POOL.length],
    description: category.blurb,
  };
});

const ALL_LISTING = {
  slug: "all",
  label: "All Products",
  group: "Products",
  blurb:
    "Browse stage lights, LED panels and show-ready lighting systems built for tours, clubs, theaters, weddings and permanent installations.",
  h1: "Professional fixtures for every stage environment",
  kicker: "MOKA LITE Products",
  title: "Stage Lighting Products — Beam, Wash, Laser, LED & More | MOKA LITE",
  titleBase: "Stage Lighting Products",
  description:
    "Browse MOKA LITE professional stage lighting products including beam lights, wash lights, lasers, waterproof fixtures, LED dance floors and LED screens.",
};

const productsIn = (slug) => PRODUCTS.filter((p) => p.category === slug);
const categoryOf = (slug) => CATEGORIES.find((c) => c.slug === slug);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* --------------------------- listing helpers --------------------------- */

/** Public URL path for a listing page, relative to site root. */
function urlPathFor(slug, page) {
  if (slug === "all") return page === 1 ? "products.html" : `products/page/${page}/`;
  return page === 1 ? `products/${slug}/` : `products/${slug}/page/${page}/`;
}

/** Filesystem path (relative to site dir) a listing page is written to. */
function filePathFor(slug, page) {
  const urlPath = urlPathFor(slug, page);
  return urlPath.endsWith("/") ? join(urlPath, "index.html") : urlPath;
}

/** "../" repeated for the directory depth of a root-relative url path. */
function prefixFor(urlPath) {
  const dir = urlPath.endsWith("/") ? urlPath.slice(0, -1) : dirname(urlPath);
  const depth = dir.split("/").filter((seg) => seg && seg !== ".").length;
  return "../".repeat(depth);
}

function pageCount(slug) {
  const total = slug === "all" ? PRODUCTS.length : productsIn(slug).length;
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

/* ------------------------------ partials ------------------------------ */

function header(prefix, activeSlug) {
  const catLinks = CATEGORIES.map(
    (c) => `          <a href="${prefix}products/${c.slug}/"${c.slug === activeSlug ? ' aria-current="page"' : ""}>${c.label}</a>`
  ).join("\n");
  const megaGroup = (group) =>
    CATEGORIES.filter((c) => c.group === group)
      .map((c) => `            <li><a href="${prefix}products/${c.slug}/">${c.label}</a></li>`)
      .join("\n");

  return `<header class="site-header" id="siteHeader">
  <div class="container nav">
    <a href="${prefix}index.html" class="brand" aria-label="MOKA LITE home">
      <img src="${prefix}assets/img/mokasfx-logo.png" alt="MOKA LITE">
    </a>

    <nav class="nav-list" id="primaryNav" aria-label="Primary">
      <div class="nav-item"><a class="nav-link" href="${prefix}index.html">Home</a></div>

      <div class="nav-item has-mega" data-mega="mega-products">
        <a class="nav-link is-active" href="${prefix}products.html">Products <span class="caret" aria-hidden="true"></span></a>
        <div class="nav-sub">
${catLinks}
        </div>
      </div>

      <div class="nav-item has-mega" data-mega="mega-solutions">
        <a class="nav-link" href="${prefix}solutions.html">Solutions <span class="caret" aria-hidden="true"></span></a>
        <div class="nav-sub">
          <a href="${prefix}solutions/bar-nightclub/">Bar &amp; Nightclub</a>
          <a href="${prefix}solutions/multipurpose-hall/">Multipurpose Hall</a>
          <a href="${prefix}solutions/church-stage/">Church Stage</a>
          <a href="${prefix}solution-detail.html">Indoor Stage</a>
          <a href="${prefix}solutions/outdoor-stage/">Outdoor Stage</a>
        </div>
      </div>

      <div class="nav-item has-dropdown">
        <a class="nav-link" href="${prefix}blog.html">Blog <span class="caret" aria-hidden="true"></span></a>
        <div class="nav-dropdown">
          <a href="${prefix}projects.html">Projects</a>
          <a href="${prefix}technical-guides.html">Technical Guides</a>
        </div>
      </div>

      <div class="nav-item has-dropdown">
        <a class="nav-link" href="${prefix}resources.html">Resources <span class="caret" aria-hidden="true"></span></a>
        <div class="nav-dropdown">
          <a href="${prefix}about.html">About us</a>
          <a href="${prefix}privacy.html">Privacy Policy</a>
        </div>
      </div>

      <div class="nav-item"><a class="nav-link" href="${prefix}contact.html#inquiry">Contact us</a></div>
    </nav>

    <button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="primaryNav">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
  </div>

  <!-- Products mega -->
  <div class="mega" id="mega-products" role="region" aria-label="Products mega menu">
    <div class="container mega-inner">
      <div class="products-menu-panels">
        <section class="products-menu-panel">
          <h4 class="products-menu-panel-title">Stage Lights</h4>
          <ul class="products-menu-panel-list">
${megaGroup("Stage Lights")}
          </ul>
        </section>

        <section class="products-menu-panel">
          <h4 class="products-menu-panel-title">Led Panels</h4>
          <ul class="products-menu-panel-list">
${megaGroup("LED Panels")}
          </ul>
        </section>
      </div>
    </div>
  </div>

  <!-- Solutions mega -->
  <div class="mega" id="mega-solutions" role="region" aria-label="Solutions mega menu">
    <div class="container mega-inner">
      <ul class="mega-scenarios">
        <li><a href="${prefix}solutions/bar-nightclub/">Bar &amp; Nightclub</a></li>
        <li><a href="${prefix}solutions/multipurpose-hall/">Multipurpose Hall</a></li>
        <li><a href="${prefix}solutions/church-stage/">Church Stage</a></li>
        <li><a href="${prefix}solution-detail.html">Indoor Stage</a></li>
        <li><a href="${prefix}solutions/outdoor-stage/">Outdoor Stage</a></li>
      </ul>
      <div class="mega-feature">
        <div class="mega-feature-copy">
          <h3>Have Any Questions?</h3>
          <p>Experts in modern stage lighting &mdash; tell us about your venue.</p>
          <a class="feature-cta" href="${prefix}contact.html#inquiry">Get Free Quote <span aria-hidden="true">&rarr;</span></a>
        </div>
        <img class="mega-feature-img" src="${prefix}assets/img/solutions/solutions-performance.jpg" alt="Concert stage with blue lighting beams" width="1200" height="840" decoding="async">
      </div>
    </div>
  </div>
</header>`;
}

function footer(prefix) {
  return `<footer class="site-footer">
  <div class="container">
    <div class="footer-top">
      <h2>MOKA LITE Professional Stage Lights Group</h2>
      <a class="footer-contact-btn" href="${prefix}contact.html#inquiry">Contact Us <span aria-hidden="true">&rarr;</span></a>
    </div>

    <div class="footer-main">
      <div class="footer-contact">
        <a href="${prefix}index.html" class="footer-logo"><img src="${prefix}assets/img/mokasfx-logo.png" alt="MOKA LITE"></a>
        <ul class="footer-contact-list">
          <li><span aria-hidden="true">☎</span> WhatsApp: +86 18998818260</li>
          <li><span aria-hidden="true">✉</span> <a href="mailto:info@mokasfx.com">info@mokasfx.com</a></li>
          <li><span aria-hidden="true">📍</span> 501, Building N, No. 46 Shangsheng East St, Baiyun District, Guangzhou, Guangdong, China 510440</li>
        </ul>
        <div class="footer-socials">
          <a href="#" aria-label="Facebook">f</a>
          <a href="#" aria-label="TikTok">TK</a>
          <a href="#" aria-label="YouTube">▶</a>
          <a href="#" aria-label="LinkedIn">in</a>
        </div>
      </div>

      <nav class="footer-col footer-nav-main" aria-label="Footer main links">
        <h5>Main</h5>
        <ul>
          <li><a href="${prefix}products.html">Products</a></li>
          <li><a href="${prefix}solutions.html">Solutions</a></li>
          <li><a href="${prefix}cases.html">Projects</a></li>
          <li><a href="${prefix}blog.html">Blogs</a></li>
        </ul>
      </nav>

      <nav class="footer-col footer-nav-support" aria-label="Footer support links">
        <h5>Support</h5>
        <ul>
          <li><a href="${prefix}about.html">About MOKA LITE</a></li>
          <li><a href="${prefix}contact.html#support">Terms of Service</a></li>
          <li><a href="${prefix}privacy.html">Privacy Policy</a></li>
          <li><a href="${prefix}contact.html">Warranty &amp; Return</a></li>
          <li><a href="${prefix}cases.html">Watch More Videos</a></li>
        </ul>
      </nav>
    </div>

    <div class="footer-bottom">
      <div>MOKA LITE LTD. &copy; 2026. All Rights Reserved</div>
    </div>
  </div>
</footer>`;
}

/** Horizontal category bar rendered above every listing grid. */
function filterBar(prefix, activeSlug) {
  const link = (slug, label, count) => {
    const active = slug === activeSlug;
    return `      <a class="products-filter-link${active ? " is-active" : ""}" href="${prefix}${urlPathFor(slug, 1)}"${active ? ' aria-current="page"' : ""}>${label}<span>${count}</span></a>`;
  };
  return `<nav class="products-filter-bar" aria-label="Product categories">
${link("all", "All Products", PRODUCTS.length)}
${CATEGORIES.map((c) => link(c.slug, c.label, productsIn(c.slug).length)).join("\n")}
    </nav>`;
}

function productCard(prefix, product, category) {
  const detail = `${prefix}product-detail.html?id=${encodeURIComponent(product.id)}`;
  return `<article class="product-card" itemscope itemtype="https://schema.org/Product">
            <a class="product-card-media" href="${detail}" aria-label="View ${esc(product.name)}">
              <img src="${prefix}${esc(product.image)}" alt="${esc(product.name)} — ${category.label} by MOKA LITE" loading="lazy" itemprop="image">
            </a>
            <div class="product-card-body">
              <span class="product-card-category">${category.label}</span>
              <h3 itemprop="name">${product.name}</h3>
              <p itemprop="description">${esc(product.description)}</p>
              <a class="product-card-link" href="${detail}">View Details <span aria-hidden="true">&rarr;</span></a>
            </div>
          </article>`;
}

/** Static prev/next + numbered pagination for a listing. */
function pagination(prefix, slug, currentPage, totalPages) {
  if (totalPages <= 1) return "";
  const href = (page) => `${prefix}${urlPathFor(slug, page)}`;
  const parts = [];
  parts.push(
    `<a class="products-page-link${currentPage === 1 ? " is-disabled" : ""}" href="${href(Math.max(1, currentPage - 1))}" aria-disabled="${currentPage === 1 ? "true" : "false"}" aria-label="Previous page" rel="prev">&larr;</a>`
  );
  for (let page = 1; page <= totalPages; page += 1) {
    parts.push(
      `<a class="products-page-link${page === currentPage ? " is-active" : ""}" href="${href(page)}"${page === currentPage ? ' aria-current="page"' : ""}>${page}</a>`
    );
  }
  parts.push(
    `<a class="products-page-link${currentPage === totalPages ? " is-disabled" : ""}" href="${href(Math.min(totalPages, currentPage + 1))}" aria-disabled="${currentPage === totalPages ? "true" : "false"}" aria-label="Next page" rel="next">&rarr;</a>`
  );
  return `<nav class="products-pagination" aria-label="Product pages">
        ${parts.join("\n        ")}
      </nav>`;
}

function breadcrumb(items, prefix) {
  const lis = items
    .map((item, i) => {
      const last = i === items.length - 1;
      return last
        ? `<li aria-current="page">${item.name}</li>`
        : `<li><a href="${prefix}${item.path}">${item.name}</a></li>`;
    })
    .join("\n          ");
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">
      <div class="container">
        <ol>
          ${lis}
        </ol>
      </div>
    </nav>`;
}

function jsonLd(blocks) {
  return blocks
    .map((b) => `<script type="application/ld+json">\n${JSON.stringify(b, null, 2)}\n</script>`)
    .join("\n");
}

const breadcrumbLd = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    ...(item.url ? { item: item.url } : {}),
  })),
});

/* --------------------------- listing page --------------------------- */

function listingPage(listing, page) {
  const slug = listing.slug;
  const totalPages = pageCount(slug);
  const items = (slug === "all" ? PRODUCTS : productsIn(slug)).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalItems = slug === "all" ? PRODUCTS.length : productsIn(slug).length;

  const urlPath = urlPathFor(slug, page);
  const prefix = prefixFor(urlPath);
  const canonical = `${SITE_URL}/${urlPath}`;

  const title = page === 1 ? listing.title : `${listing.titleBase || listing.label} — Page ${page} | MOKA LITE`;
  const description = page === 1 ? listing.description : `${listing.description} Page ${page} of ${totalPages}.`;

  const rangeStart = (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalItems);

  const crumbs =
    slug === "all"
      ? [
          { name: "Home", path: "index.html" },
          ...(page === 1 ? [{ name: "Products" }] : [{ name: "Products", path: "products.html" }, { name: `Page ${page}` }]),
        ]
      : [
          { name: "Home", path: "index.html" },
          { name: "Products", path: "products.html" },
          ...(page === 1 ? [{ name: listing.label }] : [{ name: listing.label, path: `products/${slug}/` }, { name: `Page ${page}` }]),
        ];
  const crumbsLd = [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Products", url: `${SITE_URL}/products.html` },
    ...(slug === "all"
      ? page === 1
        ? []
        : [{ name: `Page ${page}`, url: canonical }]
      : [
          { name: listing.label, url: `${SITE_URL}/products/${slug}/` },
          ...(page === 1 ? [] : [{ name: `Page ${page}`, url: canonical }]),
        ]),
  ];

  const relLinks = [
    page > 1 ? `<link rel="prev" href="${SITE_URL}/${urlPathFor(slug, page - 1)}">` : "",
    page < totalPages ? `<link rel="next" href="${SITE_URL}/${urlPathFor(slug, page + 1)}">` : "",
  ].filter(Boolean).join("\n");

  const cards = items.map((p) => productCard(prefix, p, categoryOf(p.category))).join("\n          ");

  const crossLinks =
    slug !== "all" && page === 1
      ? `<nav class="products-related" aria-label="Other product categories">
        <h2>Explore other categories</h2>
        <ul>
${CATEGORIES.filter((c) => c.slug !== slug)
  .map((c) => `            <li><a href="../${c.slug}/"><strong>${c.label}</strong><span>${c.blurb}</span></a></li>`)
  .join("\n")}
        </ul>
      </nav>`
      : "";

  const legacyRedirect =
    slug === "all" && page === 1
      ? `<script>(function(){var m={waterproof:"waterproof-light",beam:"beam-light",wash:"wash-light",laser:"laser-light",kinetic:"kinetic-light",effect:"effect-light",par:"par-light","led-dance":"led-dance-floor","led-screen":"led-screen"};var c=new URLSearchParams(location.search).get("cat");if(c&&m[c])location.replace("products/"+m[c]+"/"+location.hash);})();</script>`
      : "";

  // Category pages get a compact hero so products are visible sooner when
  // switching between categories; the "all products" hub keeps the full one.
  const heroClass = slug === "all" ? "products-page-hero" : "products-page-hero products-page-hero--compact";

  const ld = jsonLd([
    breadcrumbLd(crumbsLd),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: page === 1 ? `${listing.label} — MOKA LITE` : `${listing.label} — Page ${page} — MOKA LITE`,
      url: canonical,
      description: listing.description,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: totalItems,
        itemListElement: items.map((p, i) => ({
          "@type": "ListItem",
          position: rangeStart + i,
          item: {
            "@type": "Product",
            name: p.name,
            description: p.description,
            image: `${SITE_URL}/${encodeURI(p.image)}`,
            url: `${SITE_URL}/product-detail.html?id=${encodeURIComponent(p.id)}`,
            brand: { "@type": "Brand", name: "MOKA LITE" },
            category: categoryOf(p.category).label,
          },
        })),
      },
    },
  ]);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">
${relLinks}
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${canonical}">
<link rel="stylesheet" href="${prefix}assets/css/style.css">
${legacyRedirect}
${ld}
</head>
<body>

<!-- ============================ HEADER ============================ -->
${header(prefix, slug)}

<main>
  <section class="${heroClass}" aria-labelledby="products-page-title">
    <img src="${prefix}assets/img/product-hero.JPG" alt="MOKA LITE ${listing.label} fixtures on stage">
    <div class="products-page-hero-overlay"></div>
    <div class="container products-page-hero-content">
      <p class="products-page-kicker">${listing.kicker || `MOKA LITE ${listing.group}`}</p>
      <h1 id="products-page-title">${listing.h1 || listing.label}</h1>
      <p>${listing.blurb}</p>
    </div>
  </section>

  ${breadcrumb(crumbs, prefix)}

  <section class="section products-collection" aria-labelledby="products-collection-title">
    <div class="container">
      <div class="products-collection-head">
        <div>
          <span class="eyebrow">${listing.group}</span>
          <h2 id="products-collection-title">${listing.label}</h2>
        </div>
        <p>Showing ${rangeStart}-${rangeEnd} of ${totalItems} products</p>
      </div>

      ${filterBar(prefix, slug)}

      <div class="products-grid">
          ${cards}
      </div>

      ${pagination(prefix, slug, page, totalPages)}

      ${crossLinks}
    </div>
  </section>
</main>

<!-- ============================ FOOTER ============================ -->
${footer(prefix)}
<script src="${prefix}assets/js/core/utils.js"></script>
<script src="${prefix}assets/js/core/site.js"></script>
</body>
</html>
`;
}

/* -------------------------------- build -------------------------------- */

const written = [];
function emit(relPath, content) {
  const abs = join(SITE_DIR, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content, "utf8");
  written.push(relPath);
}

const listings = [ALL_LISTING, ...CATEGORIES.map((c) => ({ ...c, h1: c.label, kicker: `MOKA LITE ${c.group}` }))];

for (const listing of listings) {
  const totalPages = pageCount(listing.slug);
  for (let page = 1; page <= totalPages; page += 1) {
    emit(filePathFor(listing.slug, page), listingPage(listing, page));
  }
}

// Sitemap covering every paginated catalog URL.
const today = new Date().toISOString().slice(0, 10);
const sitemapUrls = listings.flatMap((listing) =>
  Array.from({ length: pageCount(listing.slug) }, (_, i) => ({
    loc: `${SITE_URL}/${urlPathFor(listing.slug, i + 1)}`,
    priority: listing.slug === "all" ? (i === 0 ? "0.9" : "0.7") : i === 0 ? "0.8" : "0.6",
  }))
);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
emit("sitemap-products.xml", sitemap);

// Flat catalog export — the data source for a future WooCommerce/Elementor
// import. Kept out of the public web root on purpose.
const csvEscape = (value) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
const csvRows = [
  ["id", "name", "category_slug", "category_label", "group", "image", "description"],
  ...PRODUCTS.map((p) => {
    const c = categoryOf(p.category);
    return [p.id, p.name, c.slug, c.label, c.group, p.image, p.description];
  }),
];
writeFileSync(join(TOOLS_DIR, "products-catalog.csv"), csvRows.map((row) => row.map(csvEscape).join(",")).join("\n") + "\n", "utf8");

console.log(`Generated ${written.length} pages + tools/products-catalog.csv:`);
for (const f of written) console.log(`  ${f}`);
