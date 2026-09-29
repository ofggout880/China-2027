import { store } from '../store.js';
import { t } from '../i18n.js';
/**
 * website/src/components/chinaMetrics.js
 * Modern China Key Macroeconomic Metrics Component
 * Milestone: M2 (Modern China Data Dashboard & Countdown Timer)
 * References: ORIGINAL_REQUEST.md (R2, R4), PROJECT.md (Feature 4), live-functional.spec.js (Test 04)
 */

import { chinaStatistics } from '../data/chinaStatistics.js';

/**
 * High-precision inline SVG icon definitions for 0-dependency, high-DPI rendering
 */
const METRIC_ICONS = {
  gdp: `
    <svg class="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
      <path d="M4 20h16"></path>
    </svg>
  `,
  rd: `
    <svg class="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
      <rect x="9" y="9" width="6" height="6"></rect>
      <line x1="9" y1="1" x2="9" y2="4"></line>
      <line x1="15" y1="1" x2="15" y2="4"></line>
      <line x1="9" y1="20" x2="9" y2="23"></line>
      <line x1="15" y1="20" x2="15" y2="23"></line>
      <line x1="20" y1="9" x2="23" y2="9"></line>
      <line x1="20" y1="14" x2="23" y2="14"></line>
      <line x1="1" y1="9" x2="4" y2="9"></line>
      <line x1="1" y1="14" x2="4" y2="14"></line>
    </svg>
  `,
  patents: `
    <svg class="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      <polyline points="9 12 11 14 15 10"></polyline>
    </svg>
  `,
  hsr: `
    <svg class="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="4" y="3" width="16" height="13" rx="3"></rect>
      <path d="M4 11h16"></path>
      <circle cx="8.5" cy="7.5" r="1"></circle>
      <circle cx="15.5" cy="7.5" r="1"></circle>
      <path d="m5 19-2 2"></path>
      <path d="m19 19 2 2"></path>
      <path d="M8 19h8"></path>
      <path d="m9 16-1 3"></path>
      <path d="m15 16 1 3"></path>
    </svg>
  `,
  intl_students: `
    <svg class="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  `,
  rankings: `
    <svg class="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
      <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
    </svg>
  `,
  default: `
    <svg class="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9"></circle>
      <polyline points="12 7 12 12 15 15"></polyline>
    </svg>
  `
};

const TREND_UP_ICON = `
  <svg class="stat-growth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
`;

/**
 * Render a single macroeconomic metric card
 * Compliant with test selectors: .stat-card, [data-stat], .metric-card
 * @param {Object} stat
 * @returns {string} HTML string
 */
export function renderMetricCard(stat) {
  if (!stat || typeof stat !== 'object') return '';

  const id = stat.id || 'unknown';
  const label = stat.label || 'Macro Metric';
  const labelZh = stat.labelZh || '';
  const value = stat.value || '--';
  const growth = stat.growth || '';
  const badge = stat.badge || t('National Benchmark');
  const category = stat.category || t('Macro Insight');
  const desc = stat.description || '';
  const iconMarkup = METRIC_ICONS[id] || METRIC_ICONS[stat.icon] || METRIC_ICONS.default;

  const isGoldBadge = id === 'rankings' || id === 'hsr' || id === 'intl_students';
  const badgeClass = isGoldBadge ? 'stat-badge badge-gold' : 'stat-badge badge-red';

  return `
    <article class="card stat-card metric-card" data-stat="${id}" role="article" aria-label="${label}: ${value}" tabindex="0">
      <div class="stat-card-glow-halo" aria-hidden="true"></div>
      
      <div class="stat-card-header">
        <div class="stat-icon-wrapper" aria-hidden="true">
          ${iconMarkup}
        </div>
        <span class="${badgeClass}">${badge}</span>
      </div>

      <div class="stat-card-body">
        <div class="stat-value-group">
          <span class="stat-value">${value}</span>
          ${growth ? `
            <span class="stat-growth-tag">
              ${TREND_UP_ICON}
              <span>${growth}</span>
            </span>
          ` : ''}
        </div>

        <div class="stat-label-group">
          <h3 class="stat-label">${label}</h3>
          ${labelZh ? `<span class="stat-label-zh">${labelZh}</span>` : ''}
        </div>

        ${desc ? `<p class="stat-desc">${desc}</p>` : ''}
      </div>

      <div class="stat-card-footer">
        <span class="stat-category-pill">${category}</span>
        <span class="stat-verified-indicator">
          <span class="pulse-dot" aria-hidden="true"></span>
          <span>${t('Official Data')}</span>
        </span>
      </div>
    </article>
  `.trim();
}

/**
 * Render the section header block for Modern China Metrics
 * @returns {string} HTML string
 */
export function renderMetricsHeader() {
  return `
    <div class="metrics-header-block">
      <div class="metrics-section-tag">
        <span aria-hidden="true">★</span>
        <span>${t('National Development Indicators')}</span>
      </div>
      <h2 class="metrics-section-title">
        ${store && store.getState().language === "fr" ? "Indicateurs Macro de la <span class=\"text-red\">Chine Moderne</span>" : "Modern China <span class=\"text-red\">Macro Metrics</span>"}
      </h2>
      <p class="metrics-section-subtitle">
        ${t('Key macroeconomic indicators, technological leadership, and higher education investments shaping your 2027 international study environment.')}
      </p>
    </div>
  `.trim();
}

/**
 * Render the complete China Metrics section including header and responsive card grid
 * @param {Array} metrics
 * @returns {string} HTML string
 */
export function renderChinaMetrics(metrics = chinaStatistics.macroStats) {
  const statsList = Array.isArray(metrics) && metrics.length > 0
    ? metrics
    : chinaStatistics.macroStats;

  const cardsHtml = statsList.map((stat) => renderMetricCard(stat)).join('\n');

  return `
    <section class="china-metrics-section" aria-labelledby="china-metrics-heading">
      ${renderMetricsHeader()}
      <div class="stats-grid" role="list">
        ${cardsHtml}
      </div>
    </section>
  `.trim();
}

/**
 * Mount the China Metrics component into the DOM
 * Handles various mounting configurations:
 * 1. Mounting into #china-metrics-container and leveraging sibling #stats-grid if present.
 * 2. Mounting directly into #stats-grid.
 * 3. Mounting standalone into any custom container element or selector.
 *
 * @param {HTMLElement|string} target
 * @param {Array} metrics
 * @returns {HTMLElement|null}
 */
export function mountChinaMetrics(target, metrics = chinaStatistics.macroStats) {
  let container = null;

  if (typeof target === 'string') {
    container = document.querySelector(target);
  } else if (target instanceof HTMLElement) {
    container = target;
  } else {
    // Default fallback to standard ID in index.html
    container = document.getElementById('china-metrics-container') || document.getElementById('stats-grid');
  }

  if (!container) {
    console.warn('[chinaMetrics] Target container element not found for mount.');
    return null;
  }

  const statsList = Array.isArray(metrics) && metrics.length > 0
    ? metrics
    : chinaStatistics.macroStats;

  // Case A: Container is directly the stats-grid container
  if (container.id === 'stats-grid' || container.classList.contains('stats-grid')) {
    container.innerHTML = statsList.map((stat) => renderMetricCard(stat)).join('\n');
    attachMetricInteractions(container);
    return container;
  }

  // Case B: Container is china-metrics-container and has sibling #stats-grid in index.html
  const siblingStatsGrid = document.getElementById('stats-grid');
  if (siblingStatsGrid && siblingStatsGrid.parentElement === container.parentElement) {
    container.innerHTML = renderMetricsHeader();
    siblingStatsGrid.innerHTML = statsList.map((stat) => renderMetricCard(stat)).join('\n');
    attachMetricInteractions(siblingStatsGrid);
    return container;
  }

  // Case C: Standard single-container mount
  container.innerHTML = renderChinaMetrics(statsList);
  attachMetricInteractions(container);
  return container;
}

/**
 * Attach subtle micro-interactions and keyboard accessibility enhancements to cards
 * @param {HTMLElement} rootElement
 */
function attachMetricInteractions(rootElement) {
  if (!rootElement) return;

  const cards = rootElement.querySelectorAll('.stat-card.metric-card');
  cards.forEach((card) => {
    // Keyboard activation (Enter / Space)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.classList.toggle('card-focused');
      }
    });

    // Touch / click visual feedback
    card.addEventListener('click', () => {
      card.classList.add('card-tapped');
      setTimeout(() => {
        card.classList.remove('card-tapped');
      }, 300);
    });
  });
}

export default {
  renderChinaMetrics,
  renderMetricCard,
  renderMetricsHeader,
  mountChinaMetrics,
  METRIC_ICONS
};
