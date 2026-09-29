import fs from 'fs';

const dict = {
  "Explore Universities": "Explorer les Universités",
  "Application Checklist": "Liste des Documents",
  "HSK Roadmap": "Feuille de route HSK",
  "Target Intake": "Objectif Rentrée",
  "10 Elite Unis": "10 Universités d'Élite",
  "C9 & 985 League": "Ligue C9 & Projet 985",
  "Language Ladder": "Échelle Linguistique",
  "An interactive, data-driven mission control center for your academic journey to China. Explore premier C9 League universities, navigate the HSK 1–6 language roadmap, and organize admission dossiers with live countdown intelligence.": "Un centre de contrôle interactif pour votre parcours académique vers la Chine. Explorez les meilleures universités de la Ligue C9, suivez la progression HSK 1–6 et organisez vos dossiers d'admission avec un compte à rebours en temps réel.",
  "Fall 2027 Intake · 2027年秋季入学 · Beijing: 39.9°N, 116.4°E": "Rentrée Automne 2027 · 2027年秋季入学 · Pékin: 39.9°N, 116.4°E"
};

let i18n = fs.readFileSync('src/i18n.js', 'utf-8');
const dictStr = JSON.stringify(dict, null, 2).slice(1, -1);
i18n = i18n.replace('export const dictionary = {', 'export const dictionary = {' + dictStr + ',');
fs.writeFileSync('src/i18n.js', i18n);

const heroCode = `/**
 * src/components/heroBanner.js
 * High-Impact 3D Overlay Hero Banner with China Red Aesthetics & Quick Action CTAs
 */
import { t } from '../i18n.js';
import { store } from '../store.js';

export function renderHeroBanner() {
  const isFr = store && store.getState().language === 'fr';
  return \`
    <section class="hero-banner hero-section" id="hero-banner">
      <div class="hero-glow-orb"></div>
      <div class="hero-content hero-container">
        <!-- Intake Status Badge -->
        <div class="hero-badge-wrap">
          <div class="hero-badge hero-tag">
            <span class="badge-dot pulse-animation"></span>
            <span class="badge-text tag-text">\${t('Fall 2027 Intake · 2027年秋季入学 · Beijing: 39.9°N, 116.4°E')}</span>
          </div>
        </div>

        <!-- Headline -->
        <h1 class="hero-title">
          <span class="hero-title-main">\${isFr ? 'Objectif <span class="highlight-year text-red">Chine 2027</span>' : 'Target <span class="highlight-year text-red">China 2027</span>'}</span>
          <span class="hero-title-sub">启航中国 · 全方位留学规划与追踪系统</span>
        </h1>

        <!-- Subtitle & Vision -->
        <p class="hero-description hero-subtitle">
          \${t('An interactive, data-driven mission control center for your academic journey to China. Explore premier C9 League universities, navigate the HSK 1–6 language roadmap, and organize admission dossiers with live countdown intelligence.')}
        </p>

        <!-- Quick Action CTAs (Directly switch views via store.setTab) -->
        <div class="hero-actions">
          <button type="button" class="btn btn-primary" data-nav="schools" data-action="explore-schools" aria-label="Explore Universities">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
            <span>\${t('Explore Universities')}</span>
          </button>
          
          <button type="button" class="btn btn-secondary" data-nav="checklist" data-action="view-checklist" aria-label="Application Checklist">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <span>\${t('Application Checklist')}</span>
          </button>

          <button type="button" class="btn btn-ghost" data-nav="timeline" data-action="view-timeline" aria-label="HSK Timeline">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>\${t('HSK Roadmap')}</span>
          </button>
        </div>

        <!-- Hero Quick Metric Chips -->
        <div class="hero-stats-ribbon">
          <div class="stat-chip">
            <span class="stat-chip-val text-accent-red">Sept 1, 2027</span>
            <span class="stat-chip-label">\${t('Target Intake')}</span>
          </div>
          <div class="stat-chip-divider"></div>
          <div class="stat-chip">
            <span class="stat-chip-val text-accent-gold">10 Elite Unis</span>
            <span class="stat-chip-label">\${t('C9 & 985 League')}</span>
          </div>
          <div class="stat-chip-divider"></div>
          <div class="stat-chip">
            <span class="stat-chip-val text-accent-cyan">HSK 1 → 6</span>
            <span class="stat-chip-label">\${t('Language Ladder')}</span>
          </div>
        </div>
      </div>
    </section>
  \`;
}
`;

fs.writeFileSync('src/components/heroBanner.js', heroCode);
