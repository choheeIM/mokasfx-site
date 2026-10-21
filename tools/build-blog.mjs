/**
 * Static blog-listing generator (no dependencies).
 *
 * Compiles the post catalog below into fully pre-rendered HTML:
 *   site/projects.html                        -> "Projects" listing, page 1
 *   site/projects/page/<n>/index.html         -> "Projects" listing, page n
 *   site/blog.html                            -> "Blog" listing, every post
 *   site/technical-guides.html                -> redirect to the Blog listing
 *   site/<category>/<slug>/index.html         -> article page (posts with a
 *                                                POST_CONTENT entry); project
 *                                                cases live under /projects/,
 *                                                blog posts under /blog/
 *   site/sitemap-blog.xml                     -> sitemap for every listing URL
 *
 * The two categories are switched with a two-state toggle that is just two
 * links — each state is its own static URL, so both listings are fully
 * indexable without JS. The Blog listing is a single URL: every post card is
 * in its HTML, and pages/blog.js filters them by TOPIC (a row of tabs, All +
 * one per topic) and pages through them PAGE_SIZE at a time — no extra URLs,
 * and with JS off every card is shown. Every page carries its own title, meta description,
 * canonical link, rel="prev"/rel="next", breadcrumbs and JSON-LD, and all
 * post cards live in the HTML source.
 *
 * It also exports tools/blog-catalog.csv — the same catalog in a flat format
 * that can later feed a WordPress/Elementor import.
 *
 * Run from the site directory:  node tools/build-blog.mjs
 */

import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOOLS_DIR = dirname(fileURLToPath(import.meta.url));

/* Cache-bust the shared stylesheet so regenerated pages never pair new HTML
   with a visitor's stale cached CSS. */
const CSS_VERSION = Math.round(statSync(join(SITE_DIR, "assets/css/style.css")).mtimeMs);

/**
 * URL base for canonical links and structured data. Empty = root-relative
 * paths ("/projects.html"). Set to the absolute origin (e.g.
 * "https://example.com") before production launch.
 */
const SITE_URL = "";

/** Posts per listing page (2 columns x 4 rows). */
const PAGE_SIZE = 8;

const HERO_IMAGE = "assets/img/solutions/solutions-hero-stage.jpg";

const CATEGORIES = [
  {
    slug: "projects",
    label: "Projects",
    h1: "Projects",
    heroText:
      "Real installs, retrofits and event builds from the MOKA LITE field team — what we specified, how we rigged it, and what we learned on site.",
    title: "Stage Lighting Projects — Installs, Retrofits & Event Builds | MOKA LITE",
    description:
      "Case studies from MOKA LITE stage lighting projects: festivals, nightclubs, theaters, wedding halls and touring rigs — fixtures specified, rigging notes and lessons from site.",
  },
  {
    slug: "blog",
    label: "Blog",
    h1: "Blog",
    heroText:
      "Planning advice, engineering notes and company news from MOKA LITE — written for installers, rental teams and venue technicians.",
    title: "Blog — Lighting Planning, Technical Guides & News | MOKA LITE",
    description:
      "Stage lighting articles from MOKA LITE: lighting planning for real venues, technical guides on DMX, IP ratings, power and maintenance, plus company news and events.",
    // One URL with every post; topic tabs and paging happen in pages/blog.js.
    filterable: true,
  },
];

/** Blog sub-categories, in tab order. Every blog post has exactly one. They
    are filters on the Blog listing, not pages of their own. */
const TOPICS = [
  { slug: "lighting-planning", label: "Lighting Planning" },
  { slug: "technical-guides", label: "Technical Guides" },
  { slug: "news-events", label: "News & Events" },
];

/** Newest first — page 1 shows the latest posts. */
const POSTS = [
  /* ------------------------------ Projects ------------------------------ */
  {
    slug: "banquet-hall-lighting-new-york",
    category: "projects",
    // Hand-built case page with its own design (project-detail.css) — listed
    // in POSTS so it appears on cards/nav, but never overwritten by articlePage().
    custom: true,
    title: "Banquet Hall Lighting Project in New York",
    date: "2026-09-28",
    image: "assets/img/projects/banquet-hall-new-york-hero.webp",
    imageWidth: 1174,
    imageHeight: 772,
    alt: "Banquet and wedding hall in New York glowing under a circular kinetic LED ball chandelier and crystal lights during a dinner event",
    excerpt:
      "Lighting equipment supplied for a 900 m² banquet and wedding venue in New York, combining moving head lights and kinetic LED balls for different event settings.",
  },
  {
    slug: "outdoor-festival-beam-layout",
    category: "projects",
    title: "Lighting a 20,000-Person Outdoor Festival: Beam Layout and Backup DMX Plan",
    date: "2026-09-20",
    image: "assets/img/solutions/stack-outdoor-stage.webp",
    imageWidth: 1600,
    imageHeight: 900,
    alt: "Outdoor festival stage at night with colorful beams and smoke over a large crowd",
    excerpt:
      "How we positioned 24 IP65 beam moving heads across three truss lines, kept sightlines clean around the delay towers, and ran a fully redundant DMX path so one cable fault could never black out the headline set.",
  },
  {
    slug: "nightclub-pixel-effects-retrofit",
    category: "projects",
    title: "Nightclub Retrofit: Pixel-Mapped Effects Without Closing a Single Weekend",
    date: "2026-09-08",
    image: "assets/img/solutions/stack-bar-nightclub.webp",
    imageWidth: 1600,
    imageHeight: 900,
    alt: "Crowd dancing under crossing green and blue beams at a nightclub DJ set",
    excerpt:
      "A 300-cap club wanted festival-grade pixel looks on a Tuesday-to-Sunday schedule. We swapped the rig in four overnight shifts, mapped every fixture into four layers, and left staff three one-button looks they actually use.",
  },
  {
    slug: "theater-quiet-operation-upgrade",
    category: "projects",
    title: "Theater Upgrade: Replacing Hot Conventionals with Silent LED Movers",
    date: "2026-08-27",
    image: "assets/img/solutions/stack-indoor-stage.webp",
    imageWidth: 1672,
    imageHeight: 941,
    alt: "Indoor stage lit by pink and blue spotlights mounted on overhead trusses",
    excerpt:
      "The brief: drop stage temperature, kill fan noise bleeding into the auditorium, and keep the lighting language the audience already loved. Lux plots before and after, plus the dimming curves we tuned for theatrical fades.",
  },
  {
    slug: "wedding-hall-fast-setup",
    category: "projects",
    title: "Wedding Hall Turnaround: A 90-Minute Lighting Reset Between Events",
    date: "2026-08-15",
    image: "assets/img/solutions/stack-multipurpose-hall.webp",
    imageWidth: 1600,
    imageHeight: 900,
    alt: "Banquet hall with chandeliers, floral arches and pink stage lighting prepared for an event",
    excerpt:
      "Lunch wedding out, corporate gala in — same room, same afternoon. The pre-rigged truss, color-coded circuits and three stored scenes that make a 90-minute flip realistic instead of frantic.",
  },
  {
    slug: "church-stage-lighting-renewal",
    category: "projects",
    title: "Church Stage Renewal: Broadcast-Ready Lighting on a Volunteer Budget",
    date: "2026-08-02",
    image: "assets/img/solutions/stack-church-stage.webp",
    imageWidth: 1600,
    imageHeight: 900,
    alt: "Church auditorium stage with a glowing cross under purple and blue spotlights",
    excerpt:
      "A 1,200-seat church needed camera-friendly key light and looks a volunteer team can run. How we hit 90+ CRI front light, added haze-safe beam texture, and built a one-page cheat sheet for Sunday operators.",
  },
  {
    slug: "multipurpose-hall-flexible-rig",
    category: "projects",
    title: "Multipurpose Hall: One Rig for Banquets, Conferences and Gala Shows",
    date: "2026-07-21",
    image: "assets/img/solutions/solutions-multipurpose.jpg",
    imageWidth: 1200,
    imageHeight: 755,
    alt: "Multipurpose hall set for a banquet under warm ambient stage lighting",
    excerpt:
      "Three event types, one fixed budget, zero new rigging points. The fixture split — washes, profiles and a compact beam package — that lets the house crew reconfigure the room in under an hour.",
  },
  {
    slug: "outdoor-stage-ip65-coastal",
    category: "projects",
    title: "Rain or Shine: IP65 Fixtures on a Coastal Outdoor Stage",
    date: "2026-07-09",
    image: "assets/img/solutions/solutions-outdoor.jpg",
    imageWidth: 1200,
    imageHeight: 691,
    alt: "Outdoor coastal stage with waterproof fixtures under an evening sky",
    excerpt:
      "Salt air, sudden downpours and a hard curfew. Why every fixture on this seaside stage is IP65-rated, how we sealed the distro, and the corrosion checks scheduled between seasons.",
  },
  {
    slug: "nightlife-dj-booth-package",
    category: "projects",
    title: "DJ Booth Package: Compact Beams and Lasers for a 300-Cap Club",
    date: "2026-06-24",
    image: "assets/img/solutions/solutions-nightlife.jpg",
    imageWidth: 1200,
    imageHeight: 768,
    alt: "Nightclub DJ booth framed by compact beam lights and laser effects",
    excerpt:
      "Low ceiling, tight booth, big expectations. A symmetric beam-and-laser layout that reads huge from the dance floor, stays clear of the DJ's sightline, and installs with two clamps per fixture.",
  },
  {
    slug: "touring-rig-standardization",
    category: "projects",
    title: "Touring Rig Standardization: 40 Moving Heads, One Spare-Parts Kit",
    date: "2026-06-10",
    image: "assets/img/solutions/solutions-performance.jpg",
    imageWidth: 1200,
    imageHeight: 840,
    alt: "Concert stage with blue lighting beams during a live performance",
    excerpt:
      "A regional tour carrying three fixture generations was burning money on spares. The consolidation plan — one moving head platform, one parts kit, one lamp type — that cut truck space and tech hours.",
  },
  {
    slug: "custom-gobo-project",
    category: "projects",
    title: "Custom Gobo Project: From Artwork to Show-Ready Sets in 21 Days",
    date: "2026-05-28",
    image: "assets/img/product-detail/pulse-2.webp",
    imageWidth: 1100,
    imageHeight: 1100,
    alt: "Beam moving head fixture used for custom gobo projection",
    excerpt:
      "A rental house wanted its logo in steel and glass gobos across a 60-fixture fleet. The artwork prep, material choices and quality checks behind a 21-day custom turnaround — plus the files to send us to get started.",
  },

  /* -------------------------------- Blog -------------------------------- */
  {
    slug: "trade-show-season-2026",
    category: "blog",
    topic: "news-events",
    title: "Trade Show Season: Where to See MOKA LITE Fixtures Running Live",
    date: "2026-10-08",
    image: "assets/img/solutions/solutions-performance.jpg",
    imageWidth: 1200,
    imageHeight: 840,
    alt: "Concert stage with blue lighting beams during a live performance",
    excerpt:
      "Our team is heading to lighting and pro-audio exhibitions this season. What we are bringing, which fixtures you can see running live, and how to book a one-to-one meeting with our engineers.",
  },
  {
    slug: "theater-stage-effects-equipment",
    category: "blog",
    topic: "lighting-planning",
    title: "Theater Stage Effects: How Do You Choose the Right Equipment?",
    date: "2026-09-15",
    image: "assets/img/solutions/solutions-hero-stage.jpg",
    imageWidth: 1920,
    imageHeight: 1080,
    alt: "Theater stage with dramatic spotlights cutting through atmospheric haze",
    excerpt:
      "Learn how to choose theater stage effects equipment for clear storytelling, repeatable cues, performer safety, and reliable control across every show.",
  },
  {
    slug: "dmx-signal-planning",
    category: "blog",
    topic: "technical-guides",
    title: "DMX Signal Planning: Universes, Splitters and Cable Runs That Never Drop",
    date: "2026-09-03",
    image: "assets/img/product-detail/pulse-1.webp",
    imageWidth: 1100,
    imageHeight: 1100,
    alt: "Moving head fixture detail used to illustrate DMX signal planning",
    excerpt:
      "How many fixtures per universe, when an opto-splitter stops being optional, and the termination habits that separate a rock-solid rig from one that glitches only during the headline set.",
  },
  {
    slug: "kinetic-led-ball-packages",
    category: "blog",
    topic: "news-events",
    title: "Kinetic LED Balls Join Our Standard Range for Banquet Venues",
    date: "2026-08-28",
    image: "assets/img/projects/wedding-hall.webp",
    imageWidth: 1672,
    imageHeight: 941,
    alt: "Ballroom with a circular kinetic LED ball chandelier above rows of banquet tables",
    excerpt:
      "Kinetic LED balls are now a standard MOKA LITE package, with winches, balls and controller sized for ballrooms. What is included and how venues use them between events.",
  },
  {
    slug: "ip-ratings-explained",
    category: "blog",
    topic: "technical-guides",
    title: "IP Ratings Explained: When IP65 Actually Matters for Stage Lights",
    date: "2026-08-22",
    image: "assets/img/light/02.jpg",
    imageWidth: 1100,
    imageHeight: 1100,
    alt: "Outdoor-rated beam fixture with sealed die-cast housing",
    excerpt:
      "IP20 vs IP44 vs IP65 in plain terms — what each digit really tests, which outdoor jobs genuinely need sealed fixtures, and where you can save budget without gambling on weather.",
  },
  {
    slug: "beam-angle-selection",
    category: "blog",
    topic: "lighting-planning",
    title: "Beam Angle Selection: Matching Optics to Throw Distance and Trim Height",
    date: "2026-08-10",
    image: "assets/img/light/1.jpg",
    imageWidth: 1100,
    imageHeight: 1100,
    alt: "Moving head beam fixture optics close-up",
    excerpt:
      "A 2° beam and a 25° wash solve different problems. A simple throw-distance formula, worked examples from real venues, and the trim-height mistakes that leave stages looking flat.",
  },
  {
    slug: "led-vs-discharge",
    category: "blog",
    topic: "technical-guides",
    title: "LED vs Discharge: Real Power, Heat and Lamp-Life Math for Moving Heads",
    date: "2026-07-29",
    image: "assets/img/light/5.jpg",
    imageWidth: 1100,
    imageHeight: 1100,
    alt: "LED moving head fixture studio shot",
    excerpt:
      "Discharge still wins some fights. The honest numbers on output per watt, color rendering, lamp replacement cost and heat load — so the spec sheet stops deciding for you.",
  },
  {
    slug: "pixel-mapping-basics",
    category: "blog",
    topic: "lighting-planning",
    title: "Pixel Mapping Basics: From Fixture Groups to Full-Stage Looks",
    date: "2026-07-16",
    image: "assets/img/product-detail/pulse-4.webp",
    imageWidth: 1100,
    imageHeight: 1100,
    alt: "Pixel-mapped effect light array",
    excerpt:
      "Start with groups, not pixels. A practical path from four fixture layers to full-stage chases — including the console settings and layout math that keep mapping manageable.",
  },
  {
    slug: "haze-vs-fog-vs-low-fog",
    category: "blog",
    topic: "lighting-planning",
    title: "Haze vs Fog vs Low Fog: Choosing Atmosphere for Beams and Cameras",
    date: "2026-07-02",
    image: "assets/img/product-detail/nightclub.webp",
    imageWidth: 1600,
    imageHeight: 900,
    alt: "Nightclub atmosphere with haze catching angled light beams",
    excerpt:
      "Beams need particles; cameras hate clouds. Which fluid-based effect hangs longest, what venue fire systems tolerate, and the fan placement that keeps haze even without dead spots.",
  },
  {
    slug: "power-distribution-stage-rigs",
    category: "blog",
    topic: "technical-guides",
    title: "Power Distribution for Stage Rigs: Loads, Phases and Inrush Explained",
    date: "2026-06-18",
    image: "assets/img/product-detail/pulse-7.webp",
    imageWidth: 1100,
    imageHeight: 1100,
    alt: "Moving head fixture detail for a stage power distribution guide",
    excerpt:
      "Why a rig that draws 80A on paper can trip a 100A breaker at blackout recovery. Balancing phases, respecting inrush, and the distro checklist we run before every load-in.",
  },
  {
    slug: "showroom-demo-days",
    category: "blog",
    topic: "news-events",
    title: "Showroom Demo Days: Book a Live Fixture Walkthrough in Guangzhou",
    date: "2026-06-12",
    image: "assets/img/products/overview-effect-light.webp",
    imageWidth: 1200,
    imageHeight: 1200,
    alt: "Strobe, retro effect panel and moving head bar fixtures from the MOKA LITE effect light range",
    excerpt:
      "See beam, wash and effect fixtures side by side before you order. How our demo days work, what to bring, and how to book a session with the engineering team.",
  },
  {
    slug: "wireless-dmx-vs-wired",
    category: "blog",
    topic: "technical-guides",
    title: "Wireless DMX vs Wired Runs: Latency, Reliability and When to Trust Each",
    date: "2026-06-05",
    image: "assets/img/product-detail/pulse-6.webp",
    imageWidth: 1100,
    imageHeight: 1100,
    alt: "Fixture detail illustrating wireless DMX control",
    excerpt:
      "Modern wireless DMX is better than its reputation — in the right conditions. Latency numbers, antenna placement rules, and the venue types where copper still wins every time.",
  },
  {
    slug: "moving-head-maintenance-schedule",
    category: "blog",
    topic: "technical-guides",
    title: "Moving Head Maintenance Schedule: Keep Tour Fixtures Show-Ready",
    date: "2026-05-22",
    image: "assets/img/product-detail/pulse-11.webp",
    imageWidth: 1100,
    imageHeight: 1100,
    alt: "Moving head fixture due for scheduled maintenance",
    excerpt:
      "The 50/200/500-hour checklist our own service team uses: cleaning optics, re-tensioning belts, firmware hygiene and the spare parts that pay for themselves the first Saturday night.",
  },
];

/* Full article bodies keyed by post slug. Posts without an entry keep their
   listing card; the detail page is generated once its content exists.
   Use "@ROOT@/" for site-internal links — replaced with the page prefix. */
const POST_CONTENT = {
  "beam-angle-selection": {
    readingTime: "4 min read",
    body: `<p class="article-lead">A 2° beam and a 25° wash are both "moving lights", but they solve opposite problems. Choosing a beam angle is really choosing what the light is for — slicing air, painting faces, or flooding a backdrop. Get the angle wrong and no amount of output or programming will rescue the look.</p>
<p>This guide gives you the working math, the angle ranges that match real jobs, and the trim-height mistakes we see most often on site.</p>
<h2>What the beam angle number actually means</h2>
<p>Spec sheets usually print two angles. <strong>Beam angle</strong> is where intensity falls to 50% of peak — the bright core the audience reads as the shaft. <strong>Field angle</strong> is where it falls to 10% — the usable edge of the pool of light. A fixture with a tight beam angle relative to its field angle throws a hard, defined pencil; similar numbers mean a soft, even wash.</p>
<p>Zoom range matters more than any single number: a fixture that zooms from 2° to 40° covers aerial beams and mid-size washes in one unit, which is exactly how compact rigs stay compact.</p>
<h2>The throw-distance math</h2>
<p>Beam diameter grows linearly with distance:</p>
<p><strong>diameter ≈ 2 × distance × tan(angle ÷ 2)</strong></p>
<ul>
<li>A 3° beam at a 10 m throw draws a shaft about <strong>0.5 m</strong> wide — tight enough to read as a blade of light over a crowd.</li>
<li>A 25° wash at the same 10 m covers roughly <strong>4.4 m</strong> — about one fixture per performer position.</li>
</ul>
<p>Illuminance drops with the square of distance: move a fixture from a 10 m trim to 15 m and you keep only about 44% of the lux. Long throws need narrow angles <em>and</em> serious output; wide rooms with low trims need coverage, not horsepower.</p>
<h2>Match the angle to the job</h2>
<ul>
<li><strong>1.8–3° — aerial beams.</strong> The classic "lightsaber" look for clubs and concerts. Keep them in the air above the audience; at eye level they are uncomfortable and mostly wasted.</li>
<li><strong>3–8° — specials and long-throw spots.</strong> Tight pools for solos, speakers and product reveals, especially from high trims.</li>
<li><strong>10–25° — workhorse washes and profiles.</strong> Face-friendly front light and even stage coverage at theater and live-house heights.</li>
<li><strong>25–40°+ — short-throw fills, cyc and batten work.</strong> Backdrops, wall washes and low-ceiling ballrooms where coverage beats punch.</li>
</ul>
<h2>Worked examples from real venues</h2>
<table>
<thead><tr><th>Venue</th><th>Trim height</th><th>Goal</th><th>Starting point</th></tr></thead>
<tbody>
<tr><td>Club DJ booth</td><td>4–6 m</td><td>Aerial beams over the crowd</td><td>2° beam movers, e.g. our <a href="@ROOT@/products/beam-light/">beam light range</a></td></tr>
<tr><td>Theater stage</td><td>8–10 m</td><td>Even, face-friendly front wash</td><td>14–25° zoom <a href="@ROOT@/products/wash-light/">wash moving heads</a></td></tr>
<tr><td>Live house</td><td>5–7 m</td><td>Punchy mid-air looks plus stage wash</td><td>2–4° beams mixed with 10–20° spots</td></tr>
<tr><td>Arena</td><td>12–18 m</td><td>Long-throw specials</td><td>2–5° high-output profiles</td></tr>
<tr><td>Ballroom</td><td>3.5–5 m</td><td>Wall and ceiling wash</td><td>25–40° washes or battens</td></tr>
</tbody>
</table>
<p>Treat these as starting points, then adjust for lens quality, haze density and how much ambient light the room already has.</p>
<h2>Trim-height mistakes that flatten stages</h2>
<ul>
<li><strong>One angle for everything.</strong> A rig of only 25° washes gives even, flat, forgettable light. Mix a narrow aerial layer with a wide wash layer and the stage gains depth instantly.</li>
<li><strong>Forgetting the trim height.</strong> The same fixture reads completely differently at 5 m and 15 m. Always compute the diameter at your actual throw before choosing.</li>
<li><strong>No zoom overlap.</strong> If fixture A stops at 20° and fixture B starts at 30°, the coverage gap shows up as dark lanes across the stage.</li>
<li><strong>Front wash only from the FOH bridge.</strong> Long, flat front throws wash out faces; add steep side or high-back angles for modeling.</li>
</ul>
<h2>The short version</h2>
<p>Measure the throw, pick the angle for the job, and overlap zoom ranges so the rig covers the whole stage with fewer fixtures. If you share your trim height, stage width and show type, we will spec the optical mix for you — fixture by fixture.</p>`,
  },
};

const postsIn = (slug) => POSTS.filter((p) => p.category === slug);
const categoryOf = (slug) => CATEGORIES.find((c) => c.slug === slug);
const topicOf = (slug) => TOPICS.find((t) => t.slug === slug);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

for (const post of postsIn("blog")) {
  if (!topicOf(post.topic)) throw new Error(`Blog post "${post.slug}" needs a topic from TOPICS.`);
}

/* --------------------------- listing helpers --------------------------- */

/** Public URL path for a listing page, relative to site root. */
function urlPathFor(slug, page) {
  return page === 1 ? `${slug}.html` : `${slug}/page/${page}/`;
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

/** Pages of PAGE_SIZE posts a listing needs (shown client-side when filterable). */
function postPages(slug) {
  return Math.max(1, Math.ceil(postsIn(slug).length / PAGE_SIZE));
}

/** Static URLs a listing is written to — a filterable listing is a single one. */
function pageCount(slug) {
  return categoryOf(slug).filterable ? 1 : postPages(slug);
}

/* ------------------------------ partials ------------------------------ */

function header(prefix, activeSlug) {
  const blogLink = (slug, label) =>
    `          <a href="${prefix}${slug}.html"${slug === activeSlug ? ' aria-current="page"' : ""}>${label}</a>`;

  return `<header class="site-header" id="siteHeader">
  <div class="container nav">
    <a href="${prefix}index.html" class="brand" aria-label="MOKA LITE home">
      <img src="${prefix}assets/img/mokasfx-logo.png" alt="MOKA LITE">
    </a>

    <nav class="nav-list" id="primaryNav" aria-label="Primary">
      <div class="nav-item"><a class="nav-link" href="${prefix}index.html">Home</a></div>

      <div class="nav-item has-mega" data-mega="mega-products">
        <a class="nav-link" href="${prefix}products.html">Products <span class="caret" aria-hidden="true"></span></a>
        <div class="nav-sub">
          <a href="${prefix}products/waterproof-light/">Waterproof Light</a>
          <a href="${prefix}products/beam-light/">Beam Light</a>
          <a href="${prefix}products/wash-light/">Wash Light</a>
          <a href="${prefix}products/laser-light/">Laser Light</a>
          <a href="${prefix}products/kinetic-light/">Kinetic Light</a>
          <a href="${prefix}products/effect-light/">Effect Light</a>
          <a href="${prefix}products/par-light/">Par Light</a>
          <a href="${prefix}products/led-dance-floor/">LED Dance Floor</a>
          <a href="${prefix}products/led-screen/">LED Screen</a>
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
        <a class="nav-link is-active" href="${prefix}projects.html">News <span class="caret" aria-hidden="true"></span></a>
        <div class="nav-dropdown">
${CATEGORIES.map((c) => blogLink(c.slug, c.label)).join("\n")}
        </div>
      </div>

      <div class="nav-item has-dropdown">
        <span class="nav-link" tabindex="0">Resources <span class="caret" aria-hidden="true"></span></span>
        <div class="nav-dropdown">
          <a href="${prefix}about.html">About us</a>
          <a href="${prefix}certificates.html">Certificates</a>
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
          <p class="products-menu-panel-title">Stage Lights</p>
          <ul class="products-menu-panel-list">
            <li><a href="${prefix}products/waterproof-light/">Waterproof Light</a></li>
            <li><a href="${prefix}products/beam-light/">Beam Light</a></li>
            <li><a href="${prefix}products/wash-light/">Wash Light</a></li>
            <li><a href="${prefix}products/laser-light/">Laser Light</a></li>
            <li><a href="${prefix}products/kinetic-light/">Kinetic Light</a></li>
            <li><a href="${prefix}products/effect-light/">Effect Light</a></li>
            <li><a href="${prefix}products/par-light/">Par Light</a></li>
          </ul>
        </section>

        <section class="products-menu-panel">
          <p class="products-menu-panel-title">Led Panels</p>
          <ul class="products-menu-panel-list">
            <li><a href="${prefix}products/led-dance-floor/">LED Dance Floor</a></li>
            <li><a href="${prefix}products/led-screen/">LED Screen</a></li>
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
          <li><a href="${prefix}certificates.html">Certificates</a></li>
          <li><a href="${prefix}contact.html#support">Terms of Service</a></li>
          <li><a href="${prefix}privacy.html">Privacy Policy</a></li>
        </ul>
      </nav>
    </div>

    <div class="footer-bottom">
      <div>MOKA LITE LTD. &copy; 2026. All Rights Reserved</div>
    </div>
  </div>
</footer>`;
}

/** Banner: centered breadcrumb, title, accent divider and intro paragraph. */
function hero(prefix, listing, crumbs) {
  const sep = `<span class="sep" aria-hidden="true">&raquo;</span>`;
  const items = crumbs
    .map((item, i) => {
      const last = i === crumbs.length - 1;
      return last
        ? `<span aria-current="page">${esc(item.name)}</span>`
        : `<a href="${prefix}${item.path}">${esc(item.name)}</a>`;
    })
    .join(`\n        ${sep}\n        `);

  return `<section class="blog-hero" aria-labelledby="blog-hero-title">
    <img class="blog-hero-media" src="${prefix}${HERO_IMAGE}" alt="Concert stage washed in blue beams during a live show" width="1920" height="1080" fetchpriority="high" decoding="async">
    <div class="blog-hero-overlay" aria-hidden="true"></div>
    <div class="container blog-hero-content">
      <nav class="blog-hero-crumbs" aria-label="Breadcrumb">
        ${items}
      </nav>
      <h1 id="blog-hero-title">${esc(listing.h1)}</h1>
      <div class="blog-hero-divider" aria-hidden="true"></div>
      <p class="blog-hero-text">${listing.heroText}</p>
    </div>
  </section>`;
}

/** B2B inquiry section — same markup and style as the homepage. */
function inquirySection() {
  return `<section class="section inquiry-section" id="b2b-inquiry" aria-labelledby="b2b-inquiry-title">
  <div class="container inquiry-layout">
    <div class="inquiry-copy">
      <span class="eyebrow">B2B Inquiry</span>
      <h2 id="b2b-inquiry-title">Tell Us About Your Lighting Project</h2>
      <p>Whether you need a complete stage lighting solution or complete set lighting equipment, send us your requirements and our team will help evaluate the right approach.</p>
      <p>Project Type ·  Venue Size · Required Effects · Schedule · Budget</p>
    </div>

    <form class="inquiry-form" data-inquiry-form novalidate>
      <div class="form-feedback" data-form-feedback role="status" aria-live="polite"></div>

      <div class="inquiry-field row-2">
        <div class="field-control">
          <label for="blog-inquiry-name">Name <span class="required" aria-hidden="true">*</span></label>
          <input id="blog-inquiry-name" name="name" type="text" autocomplete="name" placeholder="Your full name" required data-error-required="Please enter your name.">
          <p class="field-error" data-error-for="name"></p>
        </div>
        <div class="field-control">
          <label for="blog-inquiry-country">Country <span class="required" aria-hidden="true">*</span></label>
          <input id="blog-inquiry-country" name="country" type="text" autocomplete="country-name" placeholder="Enter your country / region">
          <p class="field-error" data-error-for="country"></p>
        </div>
      </div>

      <div class="inquiry-field row-2">
        <div class="field-control">
          <label for="blog-inquiry-phone">Phone <span class="required" aria-hidden="true">*</span></label>
          <input id="blog-inquiry-phone" name="phone" type="tel" autocomplete="tel" placeholder="(+xx)" required data-error-required="Please enter your phone number." data-error-format="Use an international phone format, for example +86 189 9881 8260.">
          <p class="field-error" data-error-for="phone"></p>
        </div>
        <div class="field-control">
          <label for="blog-inquiry-email">Email <span class="required" aria-hidden="true">*</span></label>
          <input id="blog-inquiry-email" name="email" type="email" autocomplete="email" placeholder="name@company.com" required data-error-required="Please enter your email." data-error-format="Please enter a valid email address.">
          <p class="field-error" data-error-for="email"></p>
        </div>
      </div>

      <div class="inquiry-field">
        <label for="blog-inquiry-details">Project Details <span class="required" aria-hidden="true">*</span></label>
        <textarea id="blog-inquiry-details" name="projectDetails" rows="5" placeholder="Tell us the product type, quantity, event date, venue size or special requirements." required data-error-required="Please describe your project details."></textarea>
        <p class="field-error" data-error-for="projectDetails"></p>
      </div>

      <div class="form-submit-row">
        <button class="btn btn-primary" type="submit" data-submit-label="Send Inquiry">Send Inquiry</button>
        <p>Required fields are marked with <span class="required" aria-hidden="true">*</span>.</p>
      </div>
    </form>
  </div>
</section>`;
}

/** Two-state category switch — each state links to its own static page. */
function categorySwitch(prefix, activeSlug) {
  const stateClass = activeSlug === "blog" ? " blog-switch--guides" : "";
  const option = (c) => {
    const active = c.slug === activeSlug;
    return `    <a class="blog-switch-option${active ? " is-active" : ""}" href="${prefix}${urlPathFor(c.slug, 1)}"${active ? ' aria-current="page"' : ""}>${c.label}</a>`;
  };
  return `<div class="blog-switch${stateClass}">
    <span class="blog-switch-thumb" aria-hidden="true"></span>
${CATEGORIES.map(option).join("\n")}
  </div>`;
}

/** Topic filter buttons for a filterable listing: "All" + one per topic that
    has posts. They only change which cards are visible (pages/blog.js). */
function topicTabs(listing) {
  if (!listing.filterable) return "";
  const posts = postsIn(listing.slug);
  const topics = TOPICS.filter((t) => posts.some((p) => p.topic === t.slug));
  const tab = (slug, label, active) =>
    `        <button class="blog-cat-tab${active ? " is-active" : ""}" type="button" aria-pressed="${active}" data-blog-cat-tab="${slug}">${label}</button>`;
  return `
      <div class="blog-cat-tabs" role="group" aria-label="Filter articles by category" data-blog-cat-tabs>
${[tab("all", "All", true), ...topics.map((t) => tab(t.slug, esc(t.label), false))].join("\n")}
      </div>
`;
}

function postCard(prefix, post, { filterable = false, hidden = false } = {}) {
  // Posts without a POST_CONTENT body and no hand-built custom page have no
  // detail page yet — point their cards at the friendly 404 page instead.
  const url = POST_CONTENT[post.slug] || post.custom ? `${prefix}${post.category}/${post.slug}/` : `${prefix}404.html`;
  const filterAttrs = filterable ? ` data-blog-cat="${post.topic}"${hidden ? " hidden" : ""}` : "";
  return `<article class="post-card" itemscope itemtype="https://schema.org/BlogPosting"${filterAttrs}>
          <a class="post-card-media" href="${url}" aria-label="Read: ${esc(post.title)}" tabindex="-1">
            <img src="${prefix}${esc(post.image)}" alt="${esc(post.alt)}" width="${post.imageWidth}" height="${post.imageHeight}" loading="lazy" decoding="async" itemprop="image">
          </a>
          <div class="post-card-body">
            <h3 class="post-card-title" itemprop="headline"><a href="${url}" itemprop="url">${esc(post.title)}</a></h3>
            <time class="post-card-date" datetime="${post.date}" itemprop="datePublished">${post.date}</time>
            <p class="post-card-excerpt" itemprop="description">${esc(post.excerpt)}</p>
            <a class="post-card-more" href="${url}">Read More <span aria-hidden="true">&raquo;</span></a>
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
  return `<nav class="products-pagination" aria-label="${categoryOf(slug).label} pages">
        ${parts.join("\n        ")}
      </nav>`;
}

/** Client-side pager of a filterable listing, server-rendered in its first
    state (All, page 1). Same look as the static pagination, but buttons:
    pages/blog.js rebuilds the numbers whenever the filter changes. */
function filterPager(slug) {
  const totalPages = postPages(slug);
  const parts = [
    `<button class="products-page-link is-disabled" type="button" aria-label="Previous page" data-blog-page="prev" disabled>&larr;</button>`,
  ];
  for (let page = 1; page <= totalPages; page += 1) {
    parts.push(
      `<button class="products-page-link${page === 1 ? " is-active" : ""}" type="button" data-blog-page="${page}"${page === 1 ? ' aria-current="page"' : ""}>${page}</button>`
    );
  }
  parts.push(
    `<button class="products-page-link${totalPages === 1 ? " is-disabled" : ""}" type="button" aria-label="Next page" data-blog-page="next"${totalPages === 1 ? " disabled" : ""}>&rarr;</button>`
  );
  return `<nav class="products-pagination" aria-label="${categoryOf(slug).label} pages" data-blog-pager${totalPages === 1 ? " hidden" : ""}>
        ${parts.join("\n        ")}
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
  const posts = postsIn(slug);
  // A filterable listing carries every post; cards past the first page start
  // hidden and pages/blog.js takes over the paging.
  const items = listing.filterable ? posts : posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalItems = posts.length;

  const urlPath = urlPathFor(slug, page);
  const prefix = prefixFor(urlPath);
  const canonical = `${SITE_URL}/${urlPath}`;

  const title = page === 1 ? listing.title : `${listing.label} — Page ${page} | MOKA LITE`;
  const description = page === 1 ? listing.description : `${listing.description} Page ${page} of ${totalPages}.`;

  const rangeStart = (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalItems);

  const crumbs = [
    { name: "Home", path: "index.html" },
    ...(page === 1 ? [{ name: listing.label }] : [{ name: listing.label, path: urlPathFor(slug, 1) }, { name: `Page ${page}` }]),
  ];
  const crumbsLd = [
    { name: "Home", url: `${SITE_URL}/` },
    { name: listing.label, url: `${SITE_URL}/${urlPathFor(slug, 1)}` },
    ...(page === 1 ? [] : [{ name: `Page ${page}`, url: canonical }]),
  ];

  const relLinks = [
    page > 1 ? `<link rel="prev" href="${SITE_URL}/${urlPathFor(slug, page - 1)}">` : "",
    page < totalPages ? `<link rel="next" href="${SITE_URL}/${urlPathFor(slug, page + 1)}">` : "",
  ].filter(Boolean).join("\n");

  const cards = items
    .map((p, i) => postCard(prefix, p, { filterable: listing.filterable, hidden: listing.filterable && i >= PAGE_SIZE }))
    .join("\n        ");

  const countText = "Showing {start}&ndash;{end} of {total} articles";
  const count = listing.filterable
    ? `<p class="blog-collection-count" aria-live="polite" data-count-template="${countText}">Showing ${rangeStart}&ndash;${rangeEnd} of ${totalItems} articles</p>`
    : `<p class="blog-collection-count">Showing ${rangeStart}&ndash;${rangeEnd} of ${totalItems} articles</p>`;

  // Without JS the filter and pager cannot work, so show every card instead.
  const noscript = listing.filterable
    ? `\n<noscript><style>.blog-collection .post-card[hidden]{display:flex}.blog-cat-tabs,[data-blog-pager]{display:none}</style></noscript>`
    : "";

  const ld = jsonLd([
    breadcrumbLd(crumbsLd),
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: page === 1 ? `MOKA LITE ${listing.label}` : `MOKA LITE ${listing.label} — Page ${page}`,
      url: canonical,
      description: listing.description,
      blogPost: items.map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        description: p.excerpt,
        datePublished: p.date,
        image: `${SITE_URL}/${encodeURI(p.image)}`,
        url: `${SITE_URL}/${p.category}/${p.slug}/`,
        author: { "@type": "Organization", name: "MOKA LITE" },
      })),
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
<meta property="og:image" content="${SITE_URL}/${encodeURI(items[0].image)}">
<link rel="stylesheet" href="${prefix}assets/css/style.css?v=${CSS_VERSION}">${noscript}
${ld}
</head>
<body>

<!-- ============================ HEADER ============================ -->
${header(prefix, slug)}

<main>
  ${hero(prefix, listing, crumbs)}

  <section class="section blog-collection" aria-labelledby="blog-collection-title">
    <div class="container">
      <h2 class="visually-hidden" id="blog-collection-title">${listing.label} articles</h2>
      <div class="blog-collection-head">
        ${categorySwitch(prefix, slug)}
        ${count}
      </div>
${topicTabs(listing)}
      <div class="post-grid">
        ${cards}
      </div>

      ${listing.filterable ? filterPager(slug) : pagination(prefix, slug, page, totalPages)}
    </div>
  </section>
</main>

<!-- ============================ B2B INQUIRY ============================ -->
${inquirySection()}

<!-- ============================ FOOTER ============================ -->
${footer(prefix)}
<script src="${prefix}assets/js/core/utils.js"></script>
<script src="${prefix}assets/js/vendor/lenis.1.3.11.min.js?v=2"></script>
<script src="${prefix}assets/js/core/smooth-scroll.js"></script>
<script src="${prefix}assets/js/core/site.js"></script>${listing.filterable ? `\n<script src="${prefix}assets/js/pages/blog.js"></script>` : ""}
<script src="${prefix}assets/js/forms/inquiry-form.js"></script>
</body>
</html>
`;
}

/** Legacy URL stub — redirects to a current page (meta refresh + JS). */
function redirectPage(relPath, target) {
  const prefix = prefixFor(relPath);
  const href = `${prefix}${target}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Technical Guides have moved | MOKA LITE</title>
<meta name="description" content="Technical guides are now part of the MOKA LITE blog.">
<meta name="robots" content="noindex,follow">
<link rel="canonical" href="${SITE_URL}/${target}">
<meta http-equiv="refresh" content="0; url=${href}">
<link rel="stylesheet" href="${prefix}assets/css/style.css?v=${CSS_VERSION}">
</head>
<body>
<main class="blog-redirect">
  <p>Technical guides live here now: <a href="${href}">Blog</a></p>
</main>
<script>location.replace("${href}" + location.search + location.hash);</script>
</body>
</html>
`;
}

/* --------------------------- article page --------------------------- */

function articlePage(post) {
  const category = categoryOf(post.category);
  const topic = topicOf(post.topic);
  const content = POST_CONTENT[post.slug];
  const urlPath = `${post.category}/${post.slug}/`;
  const prefix = prefixFor(urlPath);
  const canonical = `${SITE_URL}/${urlPath}`;
  const crumbLabel = esc(post.title.split(":")[0]);
  // Give every h2 an anchor id and build the table of contents from them.
  const tocItems = [];
  const slugSeen = {};
  const bodyWithIds = content.body.replace(/<h2>(.*?)<\/h2>/g, (match, inner) => {
    const plain = inner.replace(/<[^>]+>/g, "");
    let id = plain.toLowerCase().replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "section";
    slugSeen[id] = (slugSeen[id] || 0) + 1;
    if (slugSeen[id] > 1) id = `${id}-${slugSeen[id]}`;
    tocItems.push({ id, text: plain });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  const body = bodyWithIds.replaceAll("@ROOT@/", prefix);
  const toc = tocItems.length
    ? `<nav class="article-toc" aria-label="Table of contents">
    <div class="article-toc-head">
      <strong>Table of Contents</strong>
      <button class="article-toc-toggle" type="button" aria-expanded="true" aria-controls="article-toc-list">[ hide ]</button>
    </div>
    <ol class="article-toc-list" id="article-toc-list">
${tocItems.map((item) => `      <li><a href="#${item.id}">${item.text}</a></li>`).join("\n")}
    </ol>
  </nav>`
    : "";

  // Prev/next only consider posts that have a page (POST_CONTENT or custom).
  const categoryPosts = postsIn(post.category).filter((p) => POST_CONTENT[p.slug] || p.custom);
  const prevPost = categoryPosts[categoryPosts.indexOf(post) + 1] || null; // older
  const nextPost = categoryPosts[categoryPosts.indexOf(post) - 1] || null; // newer
  const title = `${post.title} | MOKA LITE`;
  const publicOrigin = SITE_URL || "https://mokalites.com";
  const sharePageUrl = `${publicOrigin}/${urlPath}`;
  const shareImageUrl = `${publicOrigin}/${encodeURI(post.image)}`;
  const shareUrl = encodeURIComponent(sharePageUrl);
  const shareTitle = encodeURIComponent(post.title);
  const shareImage = encodeURIComponent(shareImageUrl);
  const shareText = encodeURIComponent(`${post.title} ${sharePageUrl}`);
  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    x: `https://twitter.com/intent/tweet?url=${shareUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${shareUrl}&media=${shareImage}&description=${shareTitle}`,
    whatsapp: `https://wa.me/?text=${shareText}`,
  };

  const ld = jsonLd([
    breadcrumbLd([
      { name: "Home", url: `${SITE_URL}/` },
      { name: category.label, url: `${SITE_URL}/${urlPathFor(post.category, 1)}` },
      { name: crumbLabel, url: canonical },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.date,
      dateModified: post.date,
      image: `${SITE_URL}/${encodeURI(post.image)}`,
      author: { "@type": "Organization", name: "MOKA LITE" },
      publisher: { "@type": "Organization", name: "MOKA LITE" },
      mainEntityOfPage: canonical,
      ...(topic ? { articleSection: topic.label } : {}),
    },
  ]);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(post.excerpt)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(post.excerpt)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE_URL}/${encodeURI(post.image)}">
<meta property="article:published_time" content="${post.date}">
<link rel="stylesheet" href="${prefix}assets/css/style.css?v=${CSS_VERSION}">
${ld}
</head>
<body>

<!-- ============================ HEADER ============================ -->
${header(prefix, post.category)}

<main class="article-main">
  <section class="blog-hero blog-hero--article" aria-labelledby="article-title">
    <img class="blog-hero-media" src="${prefix}${esc(post.image)}" alt="${esc(post.alt)}" width="${post.imageWidth}" height="${post.imageHeight}" fetchpriority="high" decoding="async">
    <div class="blog-hero-overlay" aria-hidden="true"></div>
    <div class="container blog-hero-content">
      <nav class="blog-hero-crumbs" aria-label="Breadcrumb">
        <a href="${prefix}index.html">Home</a>
        <span class="sep" aria-hidden="true">&raquo;</span>
        <a href="${prefix}${urlPathFor(post.category, 1)}">${category.label}</a>
        <span class="sep" aria-hidden="true">&raquo;</span>
        <span aria-current="page">${crumbLabel}</span>
      </nav>
      <h1 id="article-title">${esc(post.title)}</h1>
      <div class="blog-hero-divider" aria-hidden="true"></div>
      <p class="article-meta"><span class="cat">${esc(topic ? topic.label : category.label)}</span> <span class="dot" aria-hidden="true">&bull;</span> <time datetime="${post.date}">${post.date}</time> <span class="dot" aria-hidden="true">&bull;</span> ${content.readingTime}</p>
    </div>
  </section>

  <article class="article-body">
  ${toc}
${body}
    <div class="article-share" aria-label="Share this post">
      <span class="article-share-label">Share the Post:</span>
      <div class="article-share-list">
        <a class="article-share-link" href="${esc(shareLinks.facebook)}" target="_blank" rel="noopener" aria-label="Share on Facebook"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M13.5 21.888v-8.638h2.9l.434-3.364H13.5V7.738c0-.974.27-1.638 1.664-1.638h1.78V3.1c-.308-.04-1.364-.132-2.592-.132-2.566 0-4.324 1.566-4.324 4.443v2.475H7.125v3.364h2.903v8.638h3.472Z"/></svg></a>
        <a class="article-share-link" href="${esc(shareLinks.x)}" target="_blank" rel="noopener" aria-label="Share on X"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18.244 2.25h3.308l-7.227 8.26 8.501 11.24h-6.66l-5.217-6.817-5.966 6.817H1.674l7.73-8.835L1.5 2.25h6.828l4.714 6.231 5.202-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z"/></svg></a>
        <a class="article-share-link" href="${esc(shareLinks.linkedin)}" target="_blank" rel="noopener" aria-label="Share on LinkedIn"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.98 3.5C4.98 4.604 4.105 5.5 3 5.5S1.02 4.604 1.02 3.5 1.895 1.5 3 1.5s1.98.896 1.98 2Zm.02 4.5H1v13h4V8Zm7.982 0H9v13h4v-6.861c0-2.022 1.316-2.639 2.203-2.639 1.098 0 1.797.735 1.797 2.639V21h4v-7.143c0-3.615-1.917-5.857-4.717-5.857-2.187 0-3.15 1.204-3.701 2.031V8Z"/></svg></a>
        <a class="article-share-link" href="${esc(shareLinks.pinterest)}" target="_blank" rel="noopener" aria-label="Share on Pinterest"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12.017 1.5c-6.09 0-9.017 4.341-9.017 7.918 0 2.164.82 4.084 2.578 4.805.288.118.546.004.63-.313.057-.228.192-.81.25-1.05.082-.313.05-.423-.173-.694-.484-.58-.793-1.33-.793-2.394 0-3.082 2.303-5.84 6-5.84 3.27 0 5.068 2 5.068 4.668 0 3.51-1.553 6.472-3.857 6.472-1.275 0-2.229-1.054-1.923-2.348.366-1.543 1.075-3.208 1.075-4.32 0-.997-.535-1.828-1.643-1.828-1.303 0-2.35 1.349-2.35 3.156 0 1.151.388 1.93.388 1.93s-1.331 5.635-1.563 6.62c-.464 1.96-.14 4.363-.073 4.607.039.141.178.174.251.064.104-.157 1.45-1.796 1.907-3.456.129-.47.742-2.9.742-2.9.367.7 1.44 1.312 2.58 1.312 3.398 0 5.703-3.098 5.703-7.24 0-3.844-3.283-7.652-7.78-7.652Z"/></svg></a>
        <a class="article-share-link" href="${esc(shareLinks.whatsapp)}" target="_blank" rel="noopener" aria-label="Share on WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.186 8.186 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.32a8.188 8.188 0 0 1-1.26-4.38c.01-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.86-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.76 2.67 4.25 3.73.59.27 1.05.42 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.16-.48-.27-.25-.14-1.47-.74-1.69-.82-.23-.08-.37-.12-.56.12-.16.25-.64.81-.78.97-.15.17-.29.19-.53.07-.26-.13-1.06-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.12-.24-.01-.39.11-.5.11-.11.27-.29.37-.44.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.11-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43-.14 0-.3-.01-.47-.01"/></svg></a>
      </div>
    </div>
  </article>

  <nav class="article-nav" aria-label="More articles">
    ${prevPost
      ? `<a class="article-nav-card" href="${prefix}${prevPost.category}/${prevPost.slug}/" rel="prev">
      <span class="article-nav-label"><span aria-hidden="true">&larr;</span> Previous article</span>
      <span class="article-nav-title">${esc(prevPost.title)}</span>
    </a>`
      : nextPost
        ? `<a class="article-nav-card" href="${prefix}${urlPathFor(post.category, 1)}" rel="prev">
      <span class="article-nav-label"><span aria-hidden="true">&larr;</span> Browse all articles</span>
      <span class="article-nav-title">${category.label}</span>
    </a>`
        : ""}
    ${nextPost
      ? `<a class="article-nav-card article-nav-card--next" href="${prefix}${nextPost.category}/${nextPost.slug}/" rel="next">
      <span class="article-nav-label">Next article <span aria-hidden="true">&rarr;</span></span>
      <span class="article-nav-title">${esc(nextPost.title)}</span>
    </a>`
      : prevPost
        ? `<a class="article-nav-card article-nav-card--next" href="${prefix}${urlPathFor(post.category, 1)}" rel="next">
      <span class="article-nav-label">Browse all articles <span aria-hidden="true">&rarr;</span></span>
      <span class="article-nav-title">${category.label}</span>
    </a>`
        : `<a class="article-nav-card article-nav-card--solo" href="${prefix}${urlPathFor(post.category, 1)}">
      <span class="article-nav-label">Browse all articles <span aria-hidden="true">&rarr;</span></span>
      <span class="article-nav-title">${category.label}</span>
    </a>`}
  </nav>
</main>

<!-- ============================ B2B INQUIRY ============================ -->
${inquirySection()}

<!-- ============================ FOOTER ============================ -->
${footer(prefix)}
<script src="${prefix}assets/js/core/utils.js"></script>
<script src="${prefix}assets/js/vendor/lenis.1.3.11.min.js?v=2"></script>
<script src="${prefix}assets/js/core/smooth-scroll.js"></script>
<script src="${prefix}assets/js/core/site.js"></script>
<script src="${prefix}assets/js/forms/inquiry-form.js"></script>
<script>(function(){var t=document.querySelector(".article-toc-toggle"),l=document.getElementById("article-toc-list");if(!t||!l)return;t.addEventListener("click",function(){var wasHidden=l.hidden;l.hidden=!wasHidden;t.setAttribute("aria-expanded",wasHidden?"true":"false");t.textContent=wasHidden?"[ hide ]":"[ show ]";});})();</script>
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

for (const listing of CATEGORIES) {
  const totalPages = pageCount(listing.slug);
  for (let page = 1; page <= totalPages; page += 1) {
    emit(filePathFor(listing.slug, page), listingPage(listing, page));
  }
}

// Article pages for posts with full content (POST_CONTENT); custom posts
// keep their hand-built page untouched.
for (const post of POSTS) {
  if (POST_CONTENT[post.slug] && !post.custom) {
    emit(`${post.category}/${post.slug}/index.html`, articlePage(post));
  }
}

// The Blog listing is a single URL now, so both legacy URLs land on it.
emit("technical-guides.html", redirectPage("technical-guides.html", "blog.html"));
emit(join("technical-guides", "page", "2", "index.html"), redirectPage("technical-guides/page/2/index.html", "blog.html"));

// Sitemap covering every paginated blog listing URL.
const today = new Date().toISOString().slice(0, 10);
const sitemapUrls = [
  ...CATEGORIES.flatMap((listing) =>
    Array.from({ length: pageCount(listing.slug) }, (_, i) => ({
      loc: `${SITE_URL}/${urlPathFor(listing.slug, i + 1)}`,
      priority: i === 0 ? "0.8" : "0.6",
    }))
  ),
  ...POSTS.filter((p) => POST_CONTENT[p.slug] || p.custom).map((p) => ({
    loc: `${SITE_URL}/${p.category}/${p.slug}/`,
    priority: "0.7",
  })),
];
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
emit("sitemap-blog.xml", sitemap);

// Flat catalog export — the data source for a future WordPress/Elementor
// import. Kept out of the public web root on purpose.
const csvEscape = (value) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
const csvRows = [
  ["slug", "title", "category", "date", "image", "alt", "excerpt", "topic"],
  ...POSTS.map((p) => [p.slug, p.title, p.category, p.date, p.image, p.alt, p.excerpt, p.topic || ""]),
];
writeFileSync(join(TOOLS_DIR, "blog-catalog.csv"), csvRows.map((row) => row.map(csvEscape).join(",")).join("\n") + "\n", "utf8");

console.log(`Generated ${written.length} pages + tools/blog-catalog.csv:`);
for (const f of written) console.log(`  ${f}`);
