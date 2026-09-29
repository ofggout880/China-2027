import fs from 'fs';

const schoolFinderContent = `/**
 * website/src/components/schoolFinder.js
 * School Finder Directory & Dynamic Multi-Filter Component
 * Milestone: M3 (Roadmap Tools: School Finder, Timeline, Checklist)
 */

import { universitiesData as defaultData } from '../data/universitiesData.js';
import { store } from '../store.js';
import { t } from '../i18n.js';

/**
 * Normalizes text by removing diacritical marks (tone marks) and converting to lowercase.
 */
export function normalizeText(str = '') {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .toLowerCase();
}

/**
 * Core university filtering algorithm.
 */
export function filterUniversities(universities = [], query = '', filters = {}) {
  if (!Array.isArray(universities)) return [];

  const rawQuery = typeof query === 'string' ? query : '';
  const trimmed = rawQuery.trim();
  const normalizedQuery = normalizeText(trimmed);

  const activeFilters = filters && typeof filters === 'object' ? filters : {};

  return universities.filter((u) => {
    if (!u || typeof u !== 'object') return false;

    // 1. Keyword search (case-insensitive & accent-agnostic substring search)
    if (trimmed) {
      const matchName = normalizeText(u.name).includes(normalizedQuery);
      const matchNameZh = typeof u.nameZh === 'string' && u.nameZh.includes(trimmed);
      const matchPinyin = normalizeText(u.pinyin).includes(normalizedQuery);
      const matchCity = normalizeText(u.city).includes(normalizedQuery);
      const matchPrograms = Array.isArray(u.topPrograms) && u.topPrograms.some((prog) =>
        normalizeText(prog).includes(normalizedQuery)
      );
      const matchLeague = normalizeText(u.league).includes(normalizedQuery);
      const matchCat = normalizeText(u.teachingCategory).includes(normalizedQuery);

      if (!matchName && !matchNameZh && !matchPinyin && !matchCity && !matchPrograms && !matchLeague && !matchCat) {
        return false;
      }
    }

    // 2. Teaching Category filter
    if (activeFilters.category && activeFilters.category !== 'all') {
      if (normalizeText(u.teachingCategory) !== normalizeText(activeFilters.category)) {
        return false;
      }
    }

    // 3. City location filter
    if (activeFilters.city && activeFilters.city !== 'all') {
      if (normalizeText(u.city) !== normalizeText(activeFilters.city)) {
        return false;
      }
    }

    // 4. League / Tier filter
    if (activeFilters.league && activeFilters.league !== 'all') {
      if (!normalizeText(u.league).includes(normalizeText(activeFilters.league))) {
        return false;
      }
    }

    // 5. Scholarship type filter
    if (activeFilters.scholarship && activeFilters.scholarship !== 'all') {
      const matchScholarship = Array.isArray(u.scholarships) && u.scholarships.some((sch) =>
        normalizeText(sch).includes(normalizeText(activeFilters.scholarship))
      );
      if (!matchScholarship) {
        return false;
      }
    }

    return true;
  });
}

export const searchUniversities = filterUniversities;

const ICONS = {
  search: \`
    <svg class="search-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  \`,
  clear: \`
    <svg class="clear-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  \`,
  location: \`
    <svg class="location-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  \`,
  trophy: \`
    <svg class="trophy-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
      <path d="M4 22h16"></path>
      <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1s.45 1 1 1h8c.55 0 1-.45 1-1s-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34"></path>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path>
    </svg>
  \`,
  externalLink: \`
    <svg class="external-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  \`,
  empty: \`
    <svg class="empty-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="m15 9-6 6"></path>
      <path d="m9 9 6 6"></path>
    </svg>
  \`,
  filter: \`
    <svg class="filter-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </svg>
  \`,
  heart: \`
    <svg class="heart-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  \`
};

/**
 * Filter Badges Configuration
 */
export const CATEGORY_FILTERS = [
  { id: 'all', label: 'All Categories' },
  { id: 'Engineering & Technology', label: 'Engineering & Tech' },
  { id: 'Comprehensive & Humanities', label: 'Comprehensive & Humanities' },
  { id: 'Languages & Cultural Studies', label: 'Languages & Culture' }
];

export const LEAGUE_FILTERS = [
  { id: 'all', label: 'All Leagues' },
  { id: 'C9', label: 'C9 League (Top 9)' },
  { id: 'Project 985', label: 'Project 985' }
];

export const CITY_FILTERS = [
  { id: 'all', label: 'All Cities' },
  { id: 'Beijing', label: 'Beijing (北京)' },
  { id: 'Shanghai', label: 'Shanghai (上海)' },
  { id: 'Hangzhou', label: 'Hangzhou (杭州)' },
  { id: 'Nanjing', label: 'Nanjing (南京)' },
  { id: 'Harbin', label: 'Harbin (哈尔滨)' },
  { id: 'Hefei', label: 'Hefei (合肥)' },
  { id: 'Guangzhou', label: 'Guangzhou (广州)' }
];

/**
 * Renders a single university card.
 */
export function renderUniversityCard(u) {
  if (!u) return '';

  const isC9 = u.league && u.league.includes('C9');
  const leagueBadgeClass = isC9 ? 'badge-league badge-c9' : 'badge-league badge-985';

  const programsHtml = (u.topPrograms || [])
    .map((prog) => \`<span class="program-tag">\${prog}</span>\`)
    .join('');

  const scholarshipsHtml = (u.scholarships || [])
    .slice(0, 2)
    .map((sch) => \`<span class="scholarship-pill">\${sch}</span>\`)
    .join('');

  const favs = store.getState().favoriteSchools || [];
  const isFav = favs.includes(u.id);
  const heartClass = isFav ? 'favorite-btn is-favorite' : 'favorite-btn';

  return \`
    <article
      class="card school-card university-card"
      data-university="\${u.id}"
      data-city="\${u.city}"
      data-league="\${u.league}"
      data-category="\${u.teachingCategory || ''}"
      role="article"
      aria-label="\${u.name} (\${u.nameZh})"
    >
      <div class="school-card-top-accent" aria-hidden="true"></div>

      <!-- Card Header -->
      <div class="school-card-header">
        <div class="school-league-tag-wrap" style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <span class="\${leagueBadgeClass}">
            <span class="badge-star" aria-hidden="true">★</span>
            <span>\${u.league}</span>
          </span>
          \${u.teachingCategory ? \`
            <span class="badge-category" style="background: rgba(255, 42, 74, 0.12); border: 1px solid rgba(255, 42, 74, 0.3); color: #ff8a9a;">
              <span>\${t(u.teachingCategory)}</span>
            </span>
          \` : ''}
          <button class="\${heartClass}" aria-label="Toggle Favorite" data-fav-id="\${u.id}">
            \${ICONS.heart}
          </button>
        </div>
        <div class="school-rankings-badge" title="QS World Rank #\${u.rankQs} | THE World Rank #\${u.rankThe}">
          <span class="rank-qs">QS #\${u.rankQs}</span>
          <span class="rank-divider">·</span>
          <span class="rank-the">THE #\${u.rankThe}</span>
        </div>
      </div>

      <!-- University Identity & Location -->
      <div class="school-card-identity">
        <h3 class="school-name-en">\${u.name}</h3>
        <div class="school-name-zh-group">
          <span class="school-name-zh">\${u.nameZh}</span>
          <span class="school-name-pinyin">\${u.pinyin}</span>
        </div>
        <div class="school-location-pill">
          \${ICONS.location}
          <span>\${u.city}, \${u.province}</span>
        </div>
      </div>

      <!-- Top Academic Programs -->
      <div class="school-card-section">
        <div class="section-label-text">\${t('Key Academic Disciplines')}</div>
        <div class="school-programs-list">
          \${programsHtml}
        </div>
      </div>

      <!-- Admission Requirements & Tuition -->
      <div class="school-card-details-grid">
        <div class="detail-cell">
          <span class="detail-label">\${t('Chinese Track:')}</span>
          <span class="detail-val detail-highlight">\${u.languageReqs?.chineseTaught || 'HSK 5+'}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-label">\${t('English Track:')}</span>
          <span class="detail-val">\${u.languageReqs?.englishTaught || 'IELTS 6.5+'}</span>
        </div>
        <div class="detail-cell full-width">
          <span class="detail-label">\${t('Tuition Estimate:')}</span>
          <span class="detail-val tuition-val">\${u.tuitionRMB}</span>
        </div>
      </div>

      <!-- Scholarships -->
      <div class="school-card-scholarships">
        <span class="scholarship-label">\${t('Available Aid:')}</span>
        <div class="scholarship-pills-wrap">
          \${scholarshipsHtml}
        </div>
      </div>

      <!-- Campus Highlights -->
      <p class="school-campus-features">\${u.campusFeatures}</p>

      <!-- Footer CTA -->
      <div class="school-card-footer">
        <a
          href="\${u.website}"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-secondary school-portal-link"
          aria-label="Visit official website of \${u.name}"
        >
          <span>Official Portal</span>
          \${ICONS.externalLink}
        </a>
      </div>
    </article>
  \`.trim();
}

/**
 * Renders the complete School Finder view markup.
 */
export function renderSchoolFinder(universities = defaultData) {
  const favs = (store && store.getState().favoriteSchools) || [];
  const sortedUnis = [...universities].sort((a, b) => {
    const aFav = favs.includes(a.id) ? 1 : 0;
    const bFav = favs.includes(b.id) ? 1 : 0;
    return bFav - aFav;
  });
  const cardsHtml = sortedUnis.map((u) => renderUniversityCard(u)).join('\\n');

  return \`
    <section class="school-finder-section" aria-labelledby="school-finder-heading">
      <!-- Section Header -->
      <div class="school-finder-header">
        <div class="section-tag-pill">
          <span aria-hidden="true">★</span>
          <span>\${t('Higher Education Directory')}</span>
        </div>
        <h2 id="school-finder-heading" class="school-finder-title">
          \${t('Premier Chinese Universities')}
        </h2>
        <p class="school-finder-subtitle">
          \${t('Explore and compare China elite institutions')}
        </p>
      </div>

      <!-- Search & Multi-Filter Controls Bar -->
      <div class="school-controls-card card">
        <!-- Search Box -->
        <div class="school-search-row">
          <div class="school-search-box">
            <span class="search-icon-wrap" aria-hidden="true">
              \${ICONS.search}
            </span>
            <input
              type="search"
              id="school-search"
              class="school-search-input"
              placeholder="\${t('Search universities...')}"
              aria-label="Search premier Chinese universities"
              autocomplete="off"
              spellcheck="false"
            />
            <button
              type="button"
              id="school-search-clear"
              class="school-search-clear-btn"
              aria-label="Clear search input"
              style="display: none;"
            >
              \${ICONS.clear}
            </button>
          </div>
        </div>

        <!-- Filter Chips Row: Category, League & City -->
        <div class="school-filter-groups-wrap" style="display: flex; flex-direction: column; gap: 1rem;">
          <!-- Teaching Category Filter -->
          <div class="filter-group" role="group" aria-label="Filter by Category">
            <span class="filter-group-label">\${t('Category:')}</span>
            <div class="filter-chips-list" id="category-chips-list">
              \${CATEGORY_FILTERS.map(
                (f) => \`
                <button
                  type="button"
                  class="filter-chip \${f.id === 'all' ? 'active' : ''}"
                  data-filter-group="category"
                  data-filter-value="\${f.id}"
                  aria-pressed="\${f.id === 'all' ? 'true' : 'false'}"
                >
                  \${t(f.label)}
                </button>
              \`
              ).join('')}
            </div>
          </div>

          <!-- League Tier Filter -->
          <div class="filter-group" role="group" aria-label="Filter by League">
            <span class="filter-group-label">\${t('Tier:')}</span>
            <div class="filter-chips-list" id="league-chips-list">
              \${LEAGUE_FILTERS.map(
                (f) => \`
                <button
                  type="button"
                  class="filter-chip \${f.id === 'all' ? 'active' : ''}"
                  data-filter-group="league"
                  data-filter-value="\${f.id}"
                  aria-pressed="\${f.id === 'all' ? 'true' : 'false'}"
                >
                  \${t(f.label)}
                </button>
              \`
              ).join('')}
            </div>
          </div>

          <!-- City Location Filter -->
          <div class="filter-group" role="group" aria-label="Filter by City">
            <span class="filter-group-label">\${t('City:')}</span>
            <div class="filter-chips-list" id="city-chips-list">
              \${CITY_FILTERS.map(
                (f) => \`
                <button
                  type="button"
                  class="filter-chip \${f.id === 'all' ? 'active' : ''}"
                  data-filter-group="city"
                  data-filter-value="\${f.id}"
                  aria-pressed="\${f.id === 'all' ? 'true' : 'false'}"
                >
                  \${t(f.label)}
                </button>
              \`
              ).join('')}
            </div>
          </div>
        </div>

        <!-- Results Counter & Reset Action -->
        <div class="school-meta-bar">
          <div class="school-results-count" id="school-results-count" aria-live="polite">
            \${t('Showing')} \${universities.length} \${t('of')} \${universities.length} \${t('premier universities')}
          </div>
          <button
            type="button"
            id="school-reset-all-btn"
            class="school-reset-link"
            style="display: none;"
          >
            \${t('Clear filters')}
          </button>
        </div>
      </div>

      <!-- Empty State (Shown when 0 cards match) -->
      <div id="school-empty-state" class="school-empty-state card" role="alert" style="display: none;">
        <div class="empty-icon-wrap" aria-hidden="true">
          \${ICONS.empty}
        </div>
        <h3 class="empty-state-title">\${t('No universities match your criteria.')}</h3>
        <p class="empty-state-desc">
          No institutions match your current search query or filter combination. Try adjusting keywords, removing filters, or clearing the search.
        </p>
        <button type="button" class="btn btn-secondary school-empty-reset-btn" id="empty-state-reset-btn">
          \${t('Clear Filters & Show All')}
        </button>
      </div>

      <!-- University Responsive Cards Grid -->
      <div id="university-grid" class="school-grid" role="list">
        \${cardsHtml}
      </div>
    </section>
  \`.trim();
}

/**
 * Mounts the School Finder component into a target DOM element.
 */
export function mountSchoolFinder(target, universities = defaultData) {
  if (typeof document === 'undefined') {
    return { unmount: () => {} };
  }

  let container = null;
  if (typeof target === 'string') {
    container = document.querySelector(target);
  } else if (target instanceof HTMLElement) {
    container = target;
  } else {
    container = document.getElementById('school-finder-container');
  }

  if (!container) {
    console.warn('[schoolFinder] Mount failed: Target container not found in DOM.');
    return { unmount: () => {} };
  }

  // 1. Render markup
  container.innerHTML = renderSchoolFinder(universities);

  // 2. Query key DOM elements
  const searchInput = container.querySelector('#school-search');
  const clearBtn = container.querySelector('#school-search-clear');
  const resetAllBtn = container.querySelector('#school-reset-all-btn');
  const emptyStateResetBtn = container.querySelector('#empty-state-reset-btn');
  const counterEl = container.querySelector('#school-results-count');
  const emptyStateEl = container.querySelector('#school-empty-state');
  const gridEl = container.querySelector('#university-grid');
  let cards = container.querySelectorAll('.school-card');

  // Internal state
  let currentQuery = '';
  let activeLeague = 'all';
  let activeCity = 'all';
  let activeCategory = 'all';

  // Hydrate from store if query or filter was previously recorded
  try {
    if (store && typeof store.getState === 'function') {
      const storeState = store.getState();
      if (storeState.schoolSearchQuery) {
        currentQuery = storeState.schoolSearchQuery;
        if (searchInput) searchInput.value = currentQuery;
      }
      if (storeState.selectedSchoolBadgeFilter && storeState.selectedSchoolBadgeFilter !== 'all') {
        activeLeague = storeState.selectedSchoolBadgeFilter;
      }
    }
  } catch (err) {
    // Graceful fallback
  }

  /**
   * Evaluates filters and updates card visibility in the DOM.
   */
  function applyFiltering() {
    const query = searchInput ? searchInput.value : currentQuery;
    currentQuery = query;

    // Show/hide search clear button
    if (clearBtn) {
      clearBtn.style.display = query.trim().length > 0 ? 'inline-flex' : 'none';
    }

    // Determine matching university IDs
    const filteredList = filterUniversities(universities, query, {
      league: activeLeague,
      city: activeCity,
      category: activeCategory
    });
    const matchingIds = new Set(filteredList.map((u) => u.id));

    let visibleCount = 0;
    cards.forEach((card) => {
      const id = card.getAttribute('data-university');
      if (matchingIds.has(id)) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Toggle empty state
    if (emptyStateEl) {
      emptyStateEl.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    // Update results counter
    if (counterEl) {
      counterEl.textContent = \`\${t('Showing')} \${visibleCount} \${t('of')} \${universities.length} \${t('premier universities')}\`;
    }

    // Show/hide reset button
    const hasActiveFilters = Boolean(
      (query && query.trim().length > 0) || activeLeague !== 'all' || activeCity !== 'all' || activeCategory !== 'all'
    );
    if (resetAllBtn) {
      resetAllBtn.style.display = hasActiveFilters ? 'inline-block' : 'none';
    }

    // Synchronize to store
    try {
      if (store) {
        if (typeof store.setSearchQuery === 'function') {
          store.setSearchQuery(query);
        }
        if (typeof store.setSchoolBadgeFilter === 'function') {
          store.setSchoolBadgeFilter(activeLeague);
        }
      }
    } catch (e) {
      // Store sync handled safely
    }
  }

  // 3. Attach input event listener (real-time filtering)
  const onSearchInput = () => {
    applyFiltering();
  };

  if (searchInput) {
    searchInput.addEventListener('input', onSearchInput);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        applyFiltering();
        searchInput.blur();
      }
    });
  }

  // 4. Attach clear button listener
  const onClearClick = () => {
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    applyFiltering();
  };
  if (clearBtn) {
    clearBtn.addEventListener('click', onClearClick);
  }

  // 5. Attach chip click listeners (delegated)
  const onChipsClick = (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;

    const group = chip.getAttribute('data-filter-group');
    const val = chip.getAttribute('data-filter-value');
    if (!group || !val) return;

    // Update active class on siblings in the same group
    const parentList = chip.closest('.filter-chips-list');
    if (parentList) {
      parentList.querySelectorAll('.filter-chip').forEach((c) => {
        c.classList.remove('active');
        c.setAttribute('aria-pressed', 'false');
      });
    }
    chip.classList.add('active');
    chip.setAttribute('aria-pressed', 'true');

    if (group === 'league') {
      activeLeague = val;
    } else if (group === 'city') {
      activeCity = val;
    } else if (group === 'category') {
      activeCategory = val;
    }

    applyFiltering();
  };

  container.addEventListener('click', (e) => {
    // Check if it's a favorite button click
    const favBtn = e.target.closest('.favorite-btn');
    if (favBtn) {
      const uId = favBtn.getAttribute('data-fav-id');
      if (uId && typeof store.toggleFavoriteSchool === 'function') {
        const isFav = store.toggleFavoriteSchool(uId);
        favBtn.classList.toggle('is-favorite', isFav);
        // Re-render the grid to re-sort
        if (gridEl) {
          const favs = store.getState().favoriteSchools || [];
          const sortedUnis = [...universities].sort((a, b) => {
            const aFav = favs.includes(a.id) ? 1 : 0;
            const bFav = favs.includes(b.id) ? 1 : 0;
            return bFav - aFav;
          });
          gridEl.innerHTML = sortedUnis.map((u) => renderUniversityCard(u)).join('\\n');
          // Re-query cards
          cards = container.querySelectorAll('.school-card');
          applyFiltering();
        }
      }
      return;
    }

    onChipsClick(e);
  });

  // 6. Reset all filters helper
  const resetFilters = () => {
    if (searchInput) searchInput.value = '';
    activeLeague = 'all';
    activeCity = 'all';
    activeCategory = 'all';

    // Reset chips visual state
    container.querySelectorAll('.filter-chip').forEach((chip) => {
      const val = chip.getAttribute('data-filter-value');
      const isDefault = val === 'all';
      chip.classList.toggle('active', isDefault);
      chip.setAttribute('aria-pressed', isDefault ? 'true' : 'false');
    });

    applyFiltering();
  };

  if (resetAllBtn) resetAllBtn.addEventListener('click', resetFilters);
  if (emptyStateResetBtn) emptyStateResetBtn.addEventListener('click', resetFilters);

  // Initial filtering application if pre-filtered
  if (currentQuery || activeLeague !== 'all' || activeCity !== 'all' || activeCategory !== 'all') {
    applyFiltering();
  }

  // Return teardown interface
  return {
    unmount: () => {
      if (searchInput) searchInput.removeEventListener('input', onSearchInput);
      if (clearBtn) clearBtn.removeEventListener('click', onClearClick);
      container.removeEventListener('click', onChipsClick);
      if (resetAllBtn) resetAllBtn.removeEventListener('click', resetFilters);
      if (emptyStateResetBtn) emptyStateResetBtn.removeEventListener('click', resetFilters);
      container.innerHTML = '';
    },
    filter: applyFiltering,
    setQuery: (q) => {
      if (searchInput) searchInput.value = q;
      applyFiltering();
    }
  };
}

export default {
  universitiesData: defaultData,
  filterUniversities,
  searchUniversities,
  normalizeText,
  renderUniversityCard,
  renderSchoolFinder,
  mountSchoolFinder,
  CATEGORY_FILTERS,
  LEAGUE_FILTERS,
  CITY_FILTERS
};
`;

fs.writeFileSync('src/components/schoolFinder.js', schoolFinderContent);
