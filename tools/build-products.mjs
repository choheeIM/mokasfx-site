/**
 * Static product-page generator (no dependencies).
 *
 * Reads the catalog from tools/products.json and compiles it into fully
 * pre-rendered HTML:
 *   site/products.html                          -> "All products" listing, page 1
 *   site/products/page/<n>/index.html           -> "All products" listing, page n
 *   site/products/<slug>/index.html             -> category listing, page 1
 *   site/products/<slug>/page/<n>/index.html    -> category listing, page n
 *
 * Many-to-many mapping: a product lists every category it belongs to in its
 * `categories` array (first = primary). Category pages, filter-bar counts,
 * pagination and JSON-LD all derive from that, so a waterproof beam appears
 * on both /products/beam-light/ and /products/waterproof-light/ from one entry.
 *
 * Every URL carries its own title, meta description, canonical link,
 * rel="prev"/rel="next", breadcrumbs and JSON-LD, and all product cards
 * live in the HTML source, so the catalog is fully indexable without JS.
 *
 * Detail links point at the single flat-par-light-p-12-pulse-1818-x6.html template (P-12
 * PULSE 1818 X6). Only that one real product has a detail page by design;
 * per-product static detail pages arrive with the WordPress theme.
 *
 * It also exports tools/products-catalog.csv — the same catalog in a flat
 * format for the later WordPress import (category_slugs is pipe-separated;
 * import only rows with status "real").
 *
 * WARNING: site/products/ and site/products.html are build output. The
 * directory is deleted and recreated on every run — do not keep hand-edited
 * files there.
 *
 * Run from the site directory:  node tools/build-products.mjs
 */

import { mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
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

/** Products per listing page. Small on purpose while the catalog is test
 *  data, so pagination is exercised; raise once the real lineup lands. */
const PAGE_SIZE = 12;

const catalog = JSON.parse(readFileSync(join(TOOLS_DIR, "products.json"), "utf8"));
const CATEGORIES = catalog.categories;

const categoryOf = (slug) => CATEGORIES.find((c) => c.slug === slug);

for (const p of catalog.products) {
  if (!p.categories?.length) throw new Error(`${p.id}: needs at least one category`);
  for (const slug of p.categories) {
    if (!categoryOf(slug)) throw new Error(`${p.id}: unknown category "${slug}"`);
  }
}

/* All-products order: round-robin across primary categories so the grid
   mixes fixture types instead of grouping them. Category pages keep the
   JSON declaration order. */
function interleaveByPrimaryCategory(products) {
  const buckets = CATEGORIES.map((c) => products.filter((p) => p.categories[0] === c.slug));
  const out = [];
  for (let i = 0; ; i += 1) {
    let added = false;
    for (const bucket of buckets) {
      if (bucket[i]) {
        out.push(bucket[i]);
        added = true;
      }
    }
    if (!added) return out;
  }
}
const PRODUCTS = interleaveByPrimaryCategory(catalog.products);

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

const productsIn = (slug) => PRODUCTS.filter((p) => p.categories.includes(slug));
const categoryLabels = (p) => p.categories.map((slug) => categoryOf(slug).label);
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
          <a href="${prefix}404.html">Bar &amp; Nightclub</a>
          <a href="${prefix}404.html">Multipurpose Hall</a>
          <a href="${prefix}404.html">Church Stage</a>
          <a href="${prefix}indoor-stage.html">Indoor Stage</a>
          <a href="${prefix}404.html">Outdoor Stage</a>
        </div>
      </div>

      <div class="nav-item has-dropdown">
        <a class="nav-link" href="${prefix}projects.html">News <span class="caret" aria-hidden="true"></span></a>
        <div class="nav-dropdown">
          <a href="${prefix}projects.html">Projects</a>
          <a href="${prefix}blog.html">Blog</a>
        </div>
      </div>

      <div class="nav-item has-dropdown">
        <a class="nav-link" href="${prefix}404.html">Resources <span class="caret" aria-hidden="true"></span></a>
        <div class="nav-dropdown">
          <a href="${prefix}about.html">About us</a>
          <a href="${prefix}privacy.html">Privacy Policy</a>
        </div>
      </div>

      <div class="nav-item"><a class="nav-link" href="${prefix}contact.html#inquiry">Contact us</a></div>
    </nav>

    <a class="nav-search" href="${prefix}search.html" aria-label="Search the site">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <span class="nav-search-text">Search</span>
    </a>

    <button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="primaryNav">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
  </div>

  <!-- Products mega -->
  <div class="mega" id="mega-products" role="region" aria-label="Products mega menu">
    <div class="container mega-inner">
      <div class="products-menu-panels">
        <section class="products-menu-panel">
          <p class="products-menu-panel-title">Stage Lights</p>
          <ul class="products-menu-panel-list">
${megaGroup("Stage Lights")}
          </ul>
        </section>

        <section class="products-menu-panel">
          <p class="products-menu-panel-title">Led Panels</p>
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
        <li><a href="${prefix}404.html">Bar &amp; Nightclub</a></li>
        <li><a href="${prefix}404.html">Multipurpose Hall</a></li>
        <li><a href="${prefix}404.html">Church Stage</a></li>
        <li><a href="${prefix}indoor-stage.html">Indoor Stage</a></li>
        <li><a href="${prefix}404.html">Outdoor Stage</a></li>
      </ul>
      <div class="mega-feature">
        <div class="mega-feature-copy">
          <p class="mega-feature-title">Have Any Questions?</p>
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
          <li><span aria-hidden="true">✉</span> <a href="mailto:info@mokalite.com">info@mokalite.com</a></li>
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
          <li><a href="${prefix}projects.html">Projects</a></li>
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
          <li><a href="${prefix}404.html">Watch More Videos</a></li>
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

function productCard(prefix, product) {
  const detail = `${prefix}flat-par-light-p-12-pulse-1818-x6.html`;
  const labels = categoryLabels(product).join(" · ");
  return `<article class="product-card" itemscope itemtype="https://schema.org/Product">
            <a class="product-card-media" href="${detail}" aria-label="View ${esc(product.name)}">
              <img src="${prefix}${esc(product.image)}" alt="${esc(product.name)} — ${esc(labels)} by MOKA LITE" loading="lazy" itemprop="image">
            </a>
            <div class="product-card-body">
              <span class="product-card-category">${labels}</span>
              <h3 itemprop="name">${product.name}</h3>
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
  const countText = totalItems ? `Showing ${rangeStart}-${rangeEnd} of ${totalItems} products` : "0 products";

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

  const cards = items.map((p) => productCard(prefix, p)).join("\n          ");
  const gridContent = items.length
    ? cards
    : `<p class="products-empty">This category is being updated — <a href="${prefix}contact.html#inquiry">ask us for the current lineup</a>.</p>`;

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
            url: `${SITE_URL}/flat-par-light-p-12-pulse-1818-x6.html`,
            brand: { "@type": "Brand", name: "MOKA LITE" },
            category: categoryLabels(p),
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
        <p>${countText}</p>
      </div>

      ${filterBar(prefix, slug)}

      <div class="products-grid">
          ${gridContent}
      </div>

      ${pagination(prefix, slug, page, totalPages)}
    </div>
  </section>
</main>

<!-- ============================ FOOTER ============================ -->
${footer(prefix)}
<script src="${prefix}assets/js/core/utils.js"></script>
<script src="${prefix}assets/js/vendor/lenis.1.3.11.min.js?v=2"></script>
<script src="${prefix}assets/js/core/smooth-scroll.js"></script>
<script src="${prefix}assets/js/core/site.js"></script>
</body>
</html>
`;
}

/* -------------------------------- build -------------------------------- */

// Everything under products/ plus products.html is generated output — wipe
// first so removed products/categories never leave stale pages behind.
rmSync(join(SITE_DIR, "products"), { recursive: true, force: true });
unlinkSync(join(SITE_DIR, "products.html"));

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

// Flat catalog export — the data source for the later WordPress import
// (category_slugs maps to product_category terms; import only status=real).
// Kept out of the public web root on purpose.
const csvEscape = (value) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
const csvRows = [
  ["id", "name", "status", "primary_category_slug", "category_slugs", "category_labels", "group", "image", "description"],
  ...PRODUCTS.map((p) => {
    const primary = categoryOf(p.categories[0]);
    return [
      p.id,
      p.name,
      p.status,
      primary.slug,
      p.categories.join("|"),
      categoryLabels(p).join("|"),
      primary.group,
      p.image,
      p.description,
    ];
  }),
];
writeFileSync(join(TOOLS_DIR, "products-catalog.csv"), csvRows.map((row) => row.map(csvEscape).join(",")).join("\n") + "\n", "utf8");

console.log(`Generated ${written.length} pages + tools/products-catalog.csv:`);
for (const f of written) console.log(`  ${f}`);
