/**
 * src/components/chinaNews.js
 * China Higher Education & Economic News Intelligence Feed
 */
import { newsData as defaultNews } from '../data/newsData.js';
import { t } from '../i18n.js';

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

  container.innerHTML = renderChinaNews(news);
}

export default {
  renderNewsCard,
  renderChinaNews,
  mountChinaNews
};
