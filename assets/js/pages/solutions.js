/* Solutions page: fallback scene data plus category/pagination UI. */
(function () {
  "use strict";

  const { onReady } = window.MokaLightUtils;
  onReady(() => {
    const solutionsPage = document.querySelector("[data-solutions-page]");
    if (!solutionsPage) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        // TODO: replace dynamic solution rendering with server-rendered WordPress archive/page content.
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
          Array.from(showcaseScenes.querySelectorAll("[data-solution-showcase-scene]")).forEach((scene) => {
              if (window.MokaLightScrollReveal) window.MokaLightScrollReveal.observe(scene);
            });
          if (window.MokaLightParallax) window.MokaLightParallax.request();
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
  });
})();

