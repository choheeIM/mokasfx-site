import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(SITE, "tools/products.json"), "utf8"));
const PAGE = 12;
let fail = 0;

const urlPathFor = (slug, page) =>
  slug === "all" ? (page === 1 ? "products.html" : `products/page/${page}/index.html`)
                 : (page === 1 ? `products/${slug}/index.html` : `products/${slug}/page/${page}/index.html`);

const listings = [["all", "All Products"], ...data.categories.map((c) => [c.slug, c.label])];
const totalIn = (slug) => (slug === "all" ? data.products.length : data.products.filter((p) => p.categories.includes(slug)).length);

for (const [slug, label] of listings) {
  const total = totalIn(slug);
  const pages = Math.ceil(total / PAGE);

  // 1. filter-bar counts on page 1 must match the data for every category
  const html = readFileSync(join(SITE, urlPathFor(slug, 1)), "utf8");
  const bar = Object.fromEntries([...html.matchAll(/products-filter-link[^>]*>([^<]+)<span>(\d+)<\/span>/g)].map((m) => [m[1], +m[2]]));
  for (const [s, l] of listings) {
    if (bar[l] !== totalIn(s)) { console.log("COUNT MISMATCH", slug, "page, filter", l, "page:", bar[l], "data:", totalIn(s)); fail = 1; }
  }

  // 2. every page: card count, "Showing x-y of z", no duplicate cards
  for (let pg = 1; pg <= pages; pg += 1) {
    const h = readFileSync(join(SITE, urlPathFor(slug, pg)), "utf8");
    const names = [...h.matchAll(/itemprop="name">([^<]+)</g)].map((m) => m[1]);
    const s = (pg - 1) * PAGE + 1, e = Math.min(pg * PAGE, total);
    if (names.length !== e - s + 1) { console.log("CARD COUNT", urlPathFor(slug, pg), names.length, "expected", e - s + 1); fail = 1; }
    if (!h.includes(`Showing ${s}-${e} of ${total} products`)) { console.log("RANGE TEXT", urlPathFor(slug, pg)); fail = 1; }
    if (new Set(names).size !== names.length) { console.log("DUPLICATE CARD", urlPathFor(slug, pg)); fail = 1; }
    // pagination nav present iff multi-page
    const hasNav = h.includes("products-pagination");
    if (pages > 1 !== hasNav) { console.log("PAGINATION NAV", urlPathFor(slug, pg)); fail = 1; }
  }
}

// 3. multi-mapping spot checks
const spot = [
  ["moka-beam-demo-x380-wp", "BEAM DEMO X380 WP", ["beam-light", "waterproof-light"]],
  ["moka-hybrid-demo-bsw-600-wp", "HYBRID DEMO BSW 600 WP", ["beam-light", "wash-light", "waterproof-light"]],
  ["moka-laser-demo-rgb30", "LASER DEMO RGB30", ["laser-light", "effect-light"]],
  ["moka-pulse-1818-x6", "PULSE 1818 X6", ["par-light"]],
];
for (const [, name, cats] of spot) {
  for (const c of data.categories.map((c) => c.slug)) {
    const present = readFileSync(join(SITE, urlPathFor(c, 1)), "utf8").includes(`itemprop="name">${name}<`);
    const should = cats.includes(c);
    if (present !== should) { console.log("MAPPING", name, c, "present:", present, "should:", should); fail = 1; }
  }
}

console.log(fail ? "FAILED" : `ALL CHECKS PASSED — ${data.products.length} products, ${listings.length - 1} categories, counts/pagination/mapping consistent`);
process.exit(fail);
