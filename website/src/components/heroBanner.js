/**
 * src/components/heroBanner.js
 * Streamlined Hero Header: Retains Target China title, Fall 2027 badge, and quick stats ribbon
 */
import { t } from '../i18n.js';
import { store } from '../store.js';

export function renderHeroBanner() {
  const isFr = store && store.getState().language === 'fr';
  return `
    <section class="hero-banner hero-section" id="hero-banner">
      <div class="hero-glow-orb"></div>
      <div class="hero-content hero-container">
        <!-- Intake Status Badge -->
        <div class="hero-badge-wrap">
          <div class="hero-badge hero-tag">
            <span class="badge-dot pulse-animation"></span>
            <span class="badge-text tag-text">${t('Fall 2027 Intake · 2027年秋季入学 · Beijing: 39.9°N, 116.4°E')}</span>
          </div>
        </div>

        <!-- Headline -->
        <h1 class="hero-title">
          <span class="hero-title-main">${isFr ? 'Objectif <span class="highlight-year text-red">Chine 2027</span>' : 'Target <span class="highlight-year text-red">China 2027</span>'}</span>
          <span class="hero-title-sub">启航中国 · 全方位留学规划与追踪系统</span>
        </h1>

        <!-- Hero Quick Metric Ribbon -->
        <div class="hero-stats-ribbon">
          <div class="stat-chip" data-nav="checklist" role="button" tabindex="0" aria-label="Target Intake: Sept 1, 2027">
            <span class="stat-chip-val text-accent-red">Sept 1, 2027</span>
            <span class="stat-chip-label">${t('Target Intake')}</span>
          </div>
          <div class="stat-chip-divider"></div>
          <div class="stat-chip" data-nav="schools" role="button" tabindex="0" aria-label="10 Elite Universities C9 & 985 League">
            <span class="stat-chip-val text-accent-gold">10 Elite Unis</span>
            <span class="stat-chip-label">${t('C9 & 985 League')}</span>
          </div>
          <div class="stat-chip-divider"></div>
          <div class="stat-chip" data-nav="timeline" role="button" tabindex="0" aria-label="Language Ladder HSK 1 to 6">
            <span class="stat-chip-val text-accent-cyan">HSK 1 → 6</span>
            <span class="stat-chip-label">${t('Language Ladder')}</span>
          </div>
        </div>
      </div>
    </section>
  `.trim();
}
