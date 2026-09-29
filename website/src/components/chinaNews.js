/**
 * src/components/chinaNews.js
 * China Higher Education & Economic News Intelligence Feed
 * Supports both modal drawer and teaser views for space optimization.
 */
import { newsData as defaultNews } from '../data/newsData.js';
import { t } from '../i18n.js';
import { store } from '../store.js';

export function renderNewsCard(item) {
  if (!item) return '';

  return `
    <article class="card news-card" data-news-id="${item.id}" role="article">
      <div class="news-card-header">
        <div class="news-badge-group">
          <span class="badge-category news-category-badge">${item.category}</span>
          <span class="news-tag-pill">${item.tag}</span>
        </div>
        <span class="news-date-text">${item.date}</span>
      </div>

      <div class="news-card-body">
        <h3 class="news-card-title">${item.title}</h3>
        ${item.titleZh ? `<span class="news-card-title-zh">${item.titleZh}</span>` : ''}
        <p class="news-card-summary">${item.summary}</p>
      </div>

      <div class="news-card-footer">
        <div class="news-source-meta">
          <span class="news-source-name">📰 ${item.source}</span>
          <span class="news-read-time">⏱ ${item.readTime}</span>
        </div>
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="news-read-link" aria-label="Read full article from ${item.source}">
          <span>${t('Read Article')}</span>
          <svg class="news-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
    </article>
  `.trim();
}

export function renderChinaNews(news = defaultNews) {
  const cardsHtml = news.map((item) => renderNewsCard(item)).join('\n');

  return `
    <section class="china-news-section" aria-labelledby="china-news-heading">
      <div class="news-header-block">
        <div class="section-tag-pill">
          <span aria-hidden="true">★</span>
          <span>${t('Weekly Update Schedule')}</span>
        </div>
        <h2 id="china-news-heading" class="news-section-title">
          ${t('Weekly China Intelligence & News')}
        </h2>
        <p class="news-section-subtitle">
          ${t('Curated economic insights, university developments, visa policies, and international student updates for 2027.')}
        </p>
      </div>

      <div class="news-grid" role="list">
        ${cardsHtml}
      </div>
    </section>
  `.trim();
}

/**
 * Renders full-width news entries that fill the Bento Card cleanly.
 * The bottom button opens the full Intelligence Journal modal & archives.
 */
export function renderNewsTeaser(news = defaultNews) {
  const isFr = store.getState().language === 'fr';
  const count = news.length;

  const itemsHtml = news.map((item, index) => `
    <article class="news-feed-entry" data-news-id="${item.id}">
      <div class="news-entry-header">
        <span class="news-entry-tag">${item.tag || item.category || 'Actualité'}</span>
        <span class="news-entry-date">${item.date || ''}</span>
      </div>
      <h4 class="news-entry-title">
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="news-entry-link" title="${item.title}">
          ${item.title}
        </a>
      </h4>
      <p class="news-entry-desc">${item.summary || ''}</p>
      <div class="news-entry-footer">
        <span class="news-entry-source">📰 ${item.source}</span>
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="news-entry-read-link">
          <span>${isFr ? 'Source' : 'Source'}</span>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
      ${index < news.length - 1 ? '<div class="news-entry-divider"></div>' : ''}
    </article>
  `).join('\n');

  return `
    <div class="news-teaser-container">
      <div class="news-feed-wrap" role="feed" aria-label="${isFr ? 'Actualités Chine 2027' : 'China 2027 News Feed'}">
        ${itemsHtml}
      </div>

      <button type="button" id="open-news-modal-btn" class="btn btn-secondary news-open-btn" aria-label="${isFr ? 'Ouvrir les archives et journal complet' : 'Open intelligence journal and archives'}">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
          <path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>
        </svg>
        <span>${isFr ? `Consulter le journal & archives (${count} articles) →` : `Read intelligence journal & archives (${count} articles) →`}</span>
      </button>
    </div>
  `.trim();
}

/**
 * Renders the full news modal / slide-over dialog
 */
export function renderNewsModal(news = defaultNews) {
  const isFr = store.getState().language === 'fr';
  const cardsHtml = news.map((item) => renderNewsCard(item)).join('\n');

  return `
    <div id="news-modal-overlay" class="news-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="news-modal-title">
      <div id="news-modal-backdrop" class="news-modal-backdrop"></div>
      <div class="news-modal-dialog">
        <div class="news-modal-header">
          <div>
            <div class="section-tag-pill">
              <span aria-hidden="true">★</span>
              <span>${isFr ? 'Veille Chine 2027' : 'China 2027 Intelligence'}</span>
            </div>
            <h2 id="news-modal-title" class="news-modal-title">
              ${isFr ? 'Journal Hebdomadaire & Actualités' : 'Weekly Intelligence Journal'}
            </h2>
            <p class="news-modal-sub">
              ${isFr ? 'Sélection d’actualités sur l’enseignement supérieur, les bourses CSC et les visas étudiants.' : 'Curated updates on higher education, CSC scholarships, and student visas.'}
            </p>
          </div>
          <button type="button" id="news-modal-close-btn" class="drawer-close-btn" aria-label="Close news dialog">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="news-modal-body">
          <div class="news-grid">
            ${cardsHtml}
          </div>
        </div>
      </div>
    </div>
  `.trim();
}

export function openNewsModal(news = defaultNews) {
  let root = document.getElementById('news-modal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'news-modal-root';
    document.body.appendChild(root);
  }

  root.innerHTML = renderNewsModal(news);

  const overlay = document.getElementById('news-modal-overlay');
  const closeBtn = document.getElementById('news-modal-close-btn');
  const backdrop = document.getElementById('news-modal-backdrop');

  const close = () => {
    if (overlay) {
      overlay.classList.add('fade-out');
      setTimeout(() => {
        if (root && root.parentNode) root.innerHTML = '';
      }, 250);
    }
  };

  if (closeBtn) closeBtn.addEventListener('click', close);
  if (backdrop) backdrop.addEventListener('click', close);

  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
}

export function mountChinaNews(target, news = defaultNews) {
  if (typeof document === 'undefined') return;

  let container = null;
  if (typeof target === 'string') {
    container = document.querySelector(target);
  } else if (target instanceof HTMLElement) {
    container = target;
  } else {
    container = document.getElementById('china-news-container');
  }

  if (!container) return;

  // Mount teaser by default inside Bento slot
  container.innerHTML = renderNewsTeaser(news);

  const openBtn = container.querySelector('#open-news-modal-btn');
  if (openBtn) {
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openNewsModal(news);
    });
  }
}

export default {
  renderNewsCard,
  renderChinaNews,
  renderNewsTeaser,
  renderNewsModal,
  openNewsModal,
  mountChinaNews
};
