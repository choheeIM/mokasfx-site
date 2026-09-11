# main.js Modular Refactor Design

## Goal

Split the monolithic `assets/js/main.js` into page-scoped, responsibility-focused vanilla JavaScript files without changing the existing HTML, CSS, URLs, visual effects, or interaction behavior.

## Architecture

The site remains a static multi-page site using ordinary `<script>` tags and no bundler. `core/site.js` owns only shared header navigation and mobile drawer behavior. Home, Products, Solutions, and inquiry-form behavior are loaded only by pages that use them; `solution-detail.js` remains the detail-page owner and no longer loads the old monolith.

Animation modules progressively enhance existing markup. Products and Solutions keep their current static-data fallback and dynamic renderer for compatibility, but those data/rendering concerns live only in their page modules and are marked for future WordPress server-rendered loops. No new framework, API integration, CSS selector rename, or visual redesign is included.

## Module ownership

- `assets/js/core/site.js`: sticky header, mega menu, mobile drawer.
- `assets/js/core/utils.js`: small shared DOM-ready, clamp, and rAF helpers under one `window.MokaLightUtils` namespace.
- `assets/js/components/light-effects.js`: homepage hero light mask and Why Choose scroll-linked lighting.
- `assets/js/components/marquee.js`: homepage partners marquee.
- `assets/js/components/scroll-reveal.js`: Solutions page reveal observer for existing and dynamically inserted cards.
- `assets/js/components/parallax.js`: Solutions page scroll-linked hero/card motion.
- `assets/js/pages/home.js`: homepage solution overview filter, accordion, and blog tabs.
- `assets/js/pages/products.js`: Products fallback data, category/query parsing, pagination and rendering.
- `assets/js/pages/solutions.js`: Solutions fallback scene data, category/query parsing, pagination and rendering.
- `assets/js/forms/inquiry-form.js`: validation and prototype submission state for all inquiry forms.
- `assets/js/solution-detail.js`: existing solution-detail-only interactions.

## Compatibility and SSR boundary

Existing product and solution fallback arrays remain temporarily because the current static build has no server-rendered archive. Their templates are isolated in page modules and include explicit TODO markers for future WordPress archive/page content. Shared site and animation modules never create SEO content.

## Verification

Run JavaScript syntax checks for every script, verify every HTML script reference resolves, confirm no HTML page references `main.js`, check that each page receives only its required modules, and inspect the final diff for duplicate listeners or repeated initialization owners. Browser-level visual/console checks should be completed with the local static server when available.
