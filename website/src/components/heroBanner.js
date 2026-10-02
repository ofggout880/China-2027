/**
 * src/components/heroBanner.js
 * Aceternity-style Globe3D Hero Card
 * Left: Target China 2027 title + Chinese tagline + stats ribbon
 * Right: Interactive 3D Earth with panda pins on Beijing & Shanghai
 */
import { t } from '../i18n.js';
import { store } from '../store.js';
import { Globe3D, mountGlobe3D } from './ui/3d-globe.js';

let globeCleanup = null;

export function renderHeroBanner() {
  const isFr = store && store.getState().language === 'fr';

  return `
    <section class="hero-banner hero-section" id="hero-banner" aria-label="Target China 2027">
      <!-- Aceternity-style dark card — full-width, clipped overflow like the reference -->
      <div class="hero-globe-card" id="hero-globe-card">

        <!-- Subtle ambient glows -->
        <div class="hgc-glow hgc-glow-red" aria-hidden="true"></div>
        <div class="hgc-glow hgc-glow-gold" aria-hidden="true"></div>

        <!-- ── LEFT: text content ───────────────────────── -->
        <div class="hgc-left">
          <!-- Live badge -->
          <div class="hero-badge hero-tag">
            <span class="badge-dot pulse-animation"></span>
            <span class="badge-text tag-text">${t('Fall 2027 Intake · 2027年秋季入学 · Beijing: 39.9°N, 116.4°E')}</span>
          </div>

          <!-- Main headline -->
          <h1 class="hero-title hgc-title">
            <span class="hero-title-main">
              ${isFr
                ? 'Objectif <span class="highlight-year text-red">Chine 2027</span>'
                : 'Target <span class="highlight-year text-red">China 2027</span>'}
            </span>
            <span class="hero-title-sub">启航中国 · 全方位留学规划与追踪系统</span>
          </h1>

          <!-- Stats ribbon -->
          <div class="hero-stats-ribbon hgc-ribbon">
            <div class="stat-chip" data-nav="checklist" role="button" tabindex="0" aria-label="Target Intake Sept 1 2027">
              <span class="stat-chip-val text-accent-red">Sept 1, 2027</span>
              <span class="stat-chip-label">${t('Target Intake')}</span>
            </div>
            <div class="stat-chip-divider"></div>
            <div class="stat-chip" data-nav="schools" role="button" tabindex="0" aria-label="10 Elite Universities C9 985 League">
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

        <!-- ── RIGHT: 3D Globe ─────────────────────────── -->
        <div class="hgc-right" aria-hidden="true">
          ${Globe3D({ id: 'hero-globe-canvas' })}
        </div>

      </div>
    </section>
  `.trim();
}

export function mountHeroBanner() {
  if (typeof window === 'undefined') return;

  if (globeCleanup) {
    try { globeCleanup(); } catch (_) {}
    globeCleanup = null;
  }

  const canvas = document.getElementById('hero-globe-canvas');
  if (canvas) {
    globeCleanup = mountGlobe3D(canvas, { autoRotateSpeed: 0.0028 });
  }
}

export default { renderHeroBanner, mountHeroBanner };
