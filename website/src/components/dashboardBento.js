/**
 * src/components/dashboardBento.js
 * Optimized Bento Grid View for Dashboard
 * Compact, zero-empty-gap layout with content-adaptive heights.
 */
import { BentoGrid, BentoCard } from './ui/bento-grid.js';
import { store } from '../store.js';
import { t } from '../i18n.js';

export function renderDashboardBento() {
  const isFr = store.getState().language === 'fr';
  const activeProfile = store.getState().activeProfile;
  const isAgathe = activeProfile === 'agathe';

  return BentoGrid({
    className: 'dashboard-bento-grid',
    children: `
      <!-- Row 1, Col 8: Hero Countdown Bento Card -->
      ${BentoCard({
        className: 'bento-col-8 bento-hero-countdown',
        badge: '★ ' + (isFr ? 'Rentrée Cible' : 'Target Intake'),
        name: isFr ? 'Compte à Rebours Septembre 2027' : 'September 2027 Intake Countdown',
        description: isFr
          ? 'Clôture des admissions universitaires et bourses gouvernementales CSC.'
          : 'Deadline countdown for university admissions and CSC scholarships.',
        Icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        content: `<div id="countdown-container"></div>`,
        cta: isFr ? 'Consulter ma checklist' : 'Check application checklist',
        href: 'checklist'
      })}

      <!-- Row 1, Col 4: Candidate Tracks Card -->
      ${BentoCard({
        className: 'bento-col-4 bento-candidates-card',
        badge: isFr ? 'Espace Candidats' : 'Candidate Tracks',
        name: isFr ? 'Parcours Dédiés' : 'Duo Pathways',
        description: isFr ? 'Basculez entre vos dossiers respectifs.' : 'Switch between your personal tracks.',
        Icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        content: `
          <div class="bento-candidate-grid">
            <div class="bento-candidate-item ${!isAgathe ? 'is-active' : ''}" data-profile="matthieu" role="button" tabindex="0">
              <div class="bento-candidate-top">
                <span class="candidate-monogram mono-matthieu">M</span>
                <div>
                  <div class="bento-candidate-name">Matthieu</div>
                  <span class="profile-badge badge-stem">STIM & IA</span>
                </div>
              </div>
              <p class="bento-candidate-desc">${isFr ? 'Master IA & Ingénierie C9' : 'AI & Engineering C9 Master'}</p>
            </div>

            <div class="bento-candidate-item ${isAgathe ? 'is-active' : ''}" data-profile="agathe" role="button" tabindex="0">
              <div class="bento-candidate-top">
                <span class="candidate-monogram mono-agathe">A</span>
                <div>
                  <div class="bento-candidate-name">Agathe</div>
                  <span class="profile-badge badge-mgmt">Management</span>
                </div>
              </div>
              <p class="bento-candidate-desc">${isFr ? 'Commerce International & Langues' : 'International Business & Lang.'}</p>
            </div>
          </div>
        `,
        cta: isFr ? 'Explorer les universités' : 'Explore target universities',
        href: 'schools'
      })}

      <!-- Row 2, Col 6: Student Growth Chart Card -->
      ${BentoCard({
        className: 'bento-col-6 bento-chart-growth-card',
        badge: isFr ? 'Données MOE' : 'MOE Data',
        name: isFr ? 'Flux des Étudiants Internationaux' : 'International Student Enrollment',
        description: isFr
          ? 'Évolution des admissions internationales et boursiers CSC.'
          : 'International admissions trajectory and CSC scholarships.',
        Icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>`,
        content: `<div id="charts-growth-slot"></div>`
      })}

      <!-- Row 2, Col 6: Discipline Donut Chart Card -->
      ${BentoCard({
        className: 'bento-col-6 bento-chart-donut-card',
        badge: isFr ? 'Filières Cibles' : 'Target Fields',
        name: isFr ? 'Répartition Disciplinaire' : 'Discipline Distribution',
        description: isFr ? 'Dominance des programmes STIM & Gestion.' : 'STEM & Management breakdown.',
        Icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>`,
        content: `<div id="charts-donut-slot"></div>`
      })}

      <!-- Row 3, Col 8: Key Macro Metrics Card -->
      ${BentoCard({
        className: 'bento-col-8 bento-metrics-card',
        badge: isFr ? 'Statistiques Clés' : 'Key Metrics',
        name: isFr ? 'Enseignement Supérieur & Financements' : 'Higher Education & Scholarships',
        description: isFr
          ? 'Indicateurs macroéconomiques, sélectivité et délivrance des visas.'
          : 'Macroeconomic indicators and visa delivery rates.',
        Icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
        content: `<div id="china-metrics-container"></div><div id="stats-grid" class="stats-grid" style="margin-top: 0.75rem;"></div>`
      })}

      <!-- Row 3, Col 4: Compact Weekly News Intelligence Card -->
      ${BentoCard({
        className: 'bento-col-4 bento-news-card',
        badge: isFr ? 'Veille Hebdo' : 'Weekly News',
        name: isFr ? 'Actualités 2027' : '2027 Intelligence',
        description: isFr
          ? 'Réformes, bourses CSC et opportunités récentes.'
          : 'Policy updates and scholarship announcements.',
        Icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>`,
        content: `<div id="china-news-container"></div>`
      })}
    `
  });
}
