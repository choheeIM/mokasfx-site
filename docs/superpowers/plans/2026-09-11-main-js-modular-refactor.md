# main.js Modular Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the all-page `main.js` with page-scoped vanilla JavaScript modules while preserving current site behavior.

**Architecture:** Keep ordinary scripts and existing selectors. Shared navigation lives in `core/site.js`; home animation and page behavior are split from Products, Solutions, and inquiry-form modules. Existing dynamic product/solution fallback rendering remains isolated and explicitly marked for future server-rendered WordPress loops.

**Tech Stack:** HTML, CSS, vanilla JavaScript, browser APIs (`DOMContentLoaded`, `IntersectionObserver`, `requestAnimationFrame`, `URLSearchParams`).

**Spec:** `docs/superpowers/specs/2026-09-11-main-js-modular-refactor-design.md`

## Global Constraints

- Do not change page visual design, DOM structure, CSS classes/selectors, animation timing/direction, responsive behavior, or URL behavior.
- Do not introduce React, Vue, a bundler, a build system, third-party APIs, or a new animation library.
- Core content remains HTML/server-rendered in the target architecture; current Products/Solutions fallback rendering is temporary and isolated.
- Each page loads only shared modules and modules used by that page.
- Every module initializes once from a single `DOMContentLoaded` entry point and uses null guards only inside its own scope.

### Task 1: Add core and component modules

**Files:**
- Create: `assets/js/core/utils.js`
- Create: `assets/js/core/site.js`
- Create: `assets/js/components/light-effects.js`
- Create: `assets/js/components/marquee.js`
- Create: `assets/js/components/scroll-reveal.js`
- Create: `assets/js/components/parallax.js`

**Interfaces:**
- `core/utils.js` exposes `window.MokaLightUtils` with `onReady`, `clamp`, and `createRafScheduler`.
- `scroll-reveal.js` exposes `window.MokaLightScrollReveal.observe(element)` for dynamic Solutions scenes.

- [ ] Copy the shared header, mega-menu, mobile drawer, home light-mask, marquee, Solutions reveal, and Solutions motion behavior into their single-owner files.
- [ ] Keep each file guarded by its own page/component hook and initialize through `onReady`.
- [ ] Ensure high-frequency updates remain rAF-scheduled and reduced-motion behavior is unchanged.
- [ ] Run `node --check` on each new file.

### Task 2: Add page and form modules

**Files:**
- Create: `assets/js/pages/home.js`
- Create: `assets/js/pages/products.js`
- Create: `assets/js/pages/solutions.js`
- Create: `assets/js/forms/inquiry-form.js`

**Interfaces:**
- `home.js` owns homepage-only filters, accordion, and blog tabs.
- `products.js` owns Products fallback data, query parameters, category links, cards, summary, and pagination.
- `solutions.js` owns Solutions fallback data, category tabs, scene rendering, query parameters, and pagination.
- `inquiry-form.js` owns validation, loading, prototype success state, and field feedback for `[data-inquiry-form]`.

- [ ] Preserve current Products and Solutions fallback arrays/templates exactly enough to retain visible output and URL behavior.
- [ ] Add explicit WordPress SSR TODO markers next to dynamic core-content renderers.
- [ ] Keep form mock submission behavior and label/feedback strings unchanged; mark the future Fluent Forms/server submission boundary.
- [ ] Run `node --check` on each new file.

### Task 3: Replace page script references and remove the monolith

**Files:**
- Modify: `index.html`
- Modify: `products.html`
- Modify: `solutions.html`
- Modify: `solution-detail.html`
- Modify: `contact.html`
- Delete: `assets/js/main.js`

- [ ] Replace all `main.js` references with page-specific script lists.
- [ ] Load `solution-detail.js` only with shared site/form modules on the detail page.
- [ ] Confirm no HTML page references `main.js` and every referenced file exists.
- [ ] Confirm no script is listed twice on a page.

### Task 4: Verify regression boundaries

**Files:**
- Inspect: all changed JavaScript and HTML files.

- [ ] Run syntax checks for every JavaScript file in `assets/js`.
- [ ] Run reference checks for all five HTML pages.
- [ ] Search for remaining duplicate owners, `window.onload`, and unexpected global data variables.
- [ ] If a local static server/browser is available, inspect each required page and console; otherwise report the limitation explicitly.
