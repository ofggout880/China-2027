/**
 * website/src/main.js
 * Application Entry Point & Orchestrator
 * Bootstraps responsive navigation, 3D WebGL canvas scene, reactive store, and view mount points.
 *
 * Milestone M2 Dashboard Integration:
 * 1. Mounts September 2027 Countdown Timer (M2.3) into #countdown-container
 * 2. Mounts Modern China Macroeconomic Metrics (M2.1) into #china-metrics-container / #stats-grid
 * 3. Mounts Responsive SVG Visualizations (M2.2) into #charts-container
 *
 * Milestone M3 Roadmap Tools Integration:
 * 1. Mounts Premier Chinese Universities Directory & Dynamic Filter (M3.1) into #school-finder-container
 * 2. Mounts Chinese Language Learning Timeline & HSK Roadmap (M3.2) into #language-timeline-container
 * 3. Mounts Application Document Checklist & Dossier Tracker (M3.3) into #document-checklist-container
 */

import { renderTopHeader, renderBottomNav, setupNavigationEvents, syncNavigationDOM } from './components/navigation.js';
import { renderHeroBanner, mountHeroBanner } from './components/heroBanner.js';
import { initSceneController } from './three/sceneController.js';
import { store } from './store.js';

// Milestone M2 Components
import { mountCountdownTimer } from './components/countdownTimer.js';
import { mountChinaMetrics } from './components/chinaMetrics.js';
import { renderStudentGrowthChart, setupStudentGrowthChart } from './components/charts/studentGrowthChart.js';
import { renderDisciplineDonutChart, setupDisciplineDonutChart } from './components/charts/disciplineDonutChart.js';
import { chinaStatistics } from './data/chinaStatistics.js';

// Milestone M3 Components
import { mountSchoolFinder } from './components/schoolFinder.js';
import { universitiesData } from './data/universitiesData.js';
import { mountLanguageTimeline } from './components/languageTimeline.js';
import { hskMilestones } from './data/hskMilestones.js';
import { mountDocumentChecklist } from './components/documentChecklist.js';
import { checklistData } from './data/checklistData.js';
import { mountChinaNews } from './components/chinaNews.js';
import { newsData } from './data/newsData.js';
import { setupI18n } from './i18n.js';
import { initWelcomeModal } from './components/welcomeModal.js';
import { mountScrollProgress } from './components/ui/scroll-progress.js';

export function bootstrapApp() {
  // 1. Mount Top Header
  const headerContainer = document.getElementById('app-header');
  if (headerContainer) {
    headerContainer.innerHTML = renderTopHeader();
  }

  // 1b. Mount Magic UI ScrollProgress bar under header
  try {
    mountScrollProgress();
  } catch (err) {
    console.warn('[main] ScrollProgress mount handled with fallback:', err);
  }

  // 2. Mount Mobile Bottom Navigation
  const bottomNavContainer = document.getElementById('bottom-nav-container');
  if (bottomNavContainer) {
    bottomNavContainer.innerHTML = renderBottomNav();
  }

  // 3. Mount Hero Banner
  const heroContainer = document.getElementById('hero-container');
  if (heroContainer) {
    heroContainer.innerHTML = renderHeroBanner();
    try {
      mountHeroBanner();
    } catch (err) {
      console.warn('[main] Hero globe mount fallback:', err);
    }
  }

  // 4. Setup Interactive Navigation Event Listeners
  setupNavigationEvents();

  // 5. Mount Preparation Dashboard Components (Milestone M2)
  initDashboardView();

  // 6. Mount Roadmap Tools (Milestone M3: Schools, Timeline, Checklist)
  initRoadmapTools();

  // 7. Initialize 3D WebGL Canvas Scene with fallback resilience
  const canvas = document.getElementById('bg-canvas');
  if (canvas) {
    try {
      initSceneController(canvas);
    } catch (err) {
      console.warn('[main] 3D canvas controller initialization handled with fallback:', err);
    }
  }

  // 8. Sync initial active view from store and align DOM visibility
  const initialTab = store.getState().activeTab || 'dashboard';
  store.setTab(initialTab);
  syncNavigationDOM(initialTab);

  // 9. Setup Translations
  setupI18n();

  // 10. Display First-Visit Disclaimer Warning Modal
  try {
    initWelcomeModal();
  } catch (err) {
    console.warn('[main] Welcome modal initialization fallback:', err);
  }
}

if (typeof window !== 'undefined') {
window.addEventListener('languagechange', () => {
  // Re-mount the components to apply translations
  const headerContainer = document.getElementById('app-header');
  if (headerContainer) headerContainer.innerHTML = renderTopHeader();

  const bottomNavContainer = document.getElementById('bottom-nav-container');
  if (bottomNavContainer) bottomNavContainer.innerHTML = renderBottomNav();
  
  const heroContainer = document.getElementById('hero-container');
  if (heroContainer) {
    heroContainer.innerHTML = renderHeroBanner();
    try { mountHeroBanner(); } catch (_) {}
  }

  initDashboardView();
  initRoadmapTools();
  syncNavigationDOM(store.getState().activeTab);
});

window.addEventListener('profilechange', () => {
  // Re-mount header and roadmap tools with the new profile data
  const headerContainer = document.getElementById('app-header');
  if (headerContainer) headerContainer.innerHTML = renderTopHeader();

  initRoadmapTools();
  syncNavigationDOM(store.getState().activeTab);
});
}

import { renderDashboardBento } from './components/dashboardBento.js';

/**
 * Initializes and mounts all Milestone M2 Preparation Dashboard components inside Bento Grid.
 * Employs defensive error boundaries to ensure zero uncaught runtime exceptions.
 */
export function initDashboardView() {
  const bentoSlot = document.getElementById('dashboard-bento-container') || document.getElementById('view-dashboard');
  if (bentoSlot) {
    if (bentoSlot.id === 'view-dashboard') {
      let innerSlot = bentoSlot.querySelector('#dashboard-bento-container');
      if (!innerSlot) {
        innerSlot = document.createElement('div');
        innerSlot.id = 'dashboard-bento-container';
        bentoSlot.appendChild(innerSlot);
      }
      innerSlot.innerHTML = renderDashboardBento();
    } else {
      bentoSlot.innerHTML = renderDashboardBento();
    }
  }

  // A. Mount September 2027 Countdown Timer (M2.3)
  const countdownContainer = document.getElementById('countdown-container');
  if (countdownContainer) {
    try {
      mountCountdownTimer(countdownContainer);
    } catch (err) {
      console.warn('[main] Countdown timer mount handled with fallback:', err);
    }
  }

  // B. Mount Modern China Macroeconomic Metrics (M2.1)
  const metricsContainer = document.getElementById('china-metrics-container');
  if (metricsContainer) {
    try {
      mountChinaMetrics(metricsContainer, chinaStatistics.macroStats);
    } catch (err) {
      console.warn('[main] China metrics mount handled with fallback:', err);
    }
  }

  // C. Mount Visual Analytics Charts into Bento Slots (M2.2)
  const growthSlot = document.getElementById('charts-growth-slot');
  const donutSlot = document.getElementById('charts-donut-slot');
  const growthData = chinaStatistics?.charts?.studentEnrollmentTrend?.data;
  const donutData = chinaStatistics?.charts?.disciplineDistribution?.data;

  if (growthSlot && growthData) {
    try {
      growthSlot.innerHTML = renderStudentGrowthChart(growthData);
      const growthCard = growthSlot.querySelector('#chart-card-student-growth');
      if (growthCard) setupStudentGrowthChart(growthCard, growthData);
    } catch (err) {
      console.warn('[main] Student growth chart mount handled with fallback:', err);
    }
  }

  if (donutSlot && donutData) {
    try {
      donutSlot.innerHTML = renderDisciplineDonutChart(donutData);
      const donutCard = donutSlot.querySelector('#chart-card-discipline-donut');
      if (donutCard) setupDisciplineDonutChart(donutCard, donutData);
    } catch (err) {
      console.warn('[main] Discipline donut chart mount handled with fallback:', err);
    }
  }

  // D. Mount China Weekly Intelligence & News Feed
  const newsContainer = document.getElementById('china-news-container');
  if (newsContainer) {
    try {
      mountChinaNews(newsContainer, newsData);
    } catch (err) {
      console.warn('[main] China news mount handled with fallback:', err);
    }
  }
}

/**
 * Initializes and mounts all Milestone M3 Roadmap Tools:
 * - School Finder into #school-finder-container
 * - Language Timeline into #language-timeline-container
 * - Document Checklist into #document-checklist-container
 */
export function initRoadmapTools() {
  // A. Mount School Finder Directory & Dynamic Filter (M3.1)
  const sf = document.getElementById('school-finder-container');
  if (sf) {
    try {
      mountSchoolFinder(sf, universitiesData);
    } catch (err) {
      console.warn('[main] School Finder mount handled with fallback:', err);
    }
  }

  // B. Mount Chinese Language Learning Timeline & HSK Tracker (M3.2)
  const lt = document.getElementById('language-timeline-container');
  if (lt) {
    try {
      mountLanguageTimeline(lt, hskMilestones);
    } catch (err) {
      console.warn('[main] Language Timeline mount handled with fallback:', err);
    }
  }

  // C. Mount Application Document Checklist & Dossier Tracker (M3.3)
  const dc = document.getElementById('document-checklist-container');
  if (dc) {
    try {
      mountDocumentChecklist(dc, { items: checklistData });
    } catch (err) {
      console.warn('[main] Document Checklist mount handled with fallback:', err);
    }
  }

  // If a secondary legacy #checklist-container exists in DOM, ensure it does not duplicate
  const legacyChecklist = document.getElementById('checklist-container');
  if (legacyChecklist && legacyChecklist !== dc && !legacyChecklist.innerHTML.trim()) {
    legacyChecklist.style.display = 'none';
  }
}

/**
 * Retains placeholder cards fallback if needed
 */
export function populateRemainingPlaceholders() {
  // No-op retained for backwards compatibility
}

// Bootstrap on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
  } else {
    bootstrapApp();
  }
}
