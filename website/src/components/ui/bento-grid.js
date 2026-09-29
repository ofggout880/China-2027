/**
 * src/components/ui/bento-grid.js
 * Bento Grid UI Component System
 * Implements a dynamic, content-adaptive Bento Grid & Bento Card architecture.
 */

/**
 * BentoGrid Container
 * @param {Object} props
 * @param {string} [props.children] - Inner HTML of cards
 * @param {string} [props.className] - Additional CSS classes
 * @returns {string} HTML string
 */
export function BentoGrid({ children = '', className = '' } = {}) {
  return `
    <div class="bento-grid ${className}">
      ${children}
    </div>
  `.trim();
}

/**
 * BentoCard Component
 * @param {Object} props
 * @param {string} [props.name] - Title of the card
 * @param {string} [props.className] - Additional CSS classes (e.g. bento-col-8, bento-row-2)
 * @param {string} [props.background] - Optional background decoration/glow HTML
 * @param {string} [props.Icon] - Optional icon SVG string
 * @param {string} [props.badge] - Optional category badge
 * @param {string} [props.description] - Subtitle or description
 * @param {string} [props.content] - Main content/widget HTML
 * @param {string} [props.cta] - Optional CTA label
 * @param {string} [props.href] - Optional link or tab navigation target
 * @param {string} [props.id] - Optional DOM ID
 * @returns {string} HTML string
 */
export function BentoCard({
  name = '',
  className = '',
  background = '',
  Icon = '',
  badge = '',
  description = '',
  content = '',
  cta = '',
  href = '',
  id = ''
} = {}) {
  const idAttr = id ? `id="${id}"` : '';
  const ctaHtml = cta
    ? `<div class="bento-card-cta-wrap">
        <a href="${href || '#'}" class="bento-card-cta" ${href && !href.startsWith('http') ? `data-nav="${href}"` : ''}>
          <span>${cta}</span>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </a>
      </div>`
    : '';

  return `
    <div class="bento-card ${className}" ${idAttr}>
      ${background ? `<div class="bento-card-bg">${background}</div>` : ''}
      <div class="bento-card-inner">
        ${
          name || badge || Icon || description
            ? `
          <div class="bento-card-header">
            <div class="bento-header-top">
              ${badge ? `<span class="bento-badge">${badge}</span>` : ''}
              ${Icon ? `<div class="bento-icon-wrap">${Icon}</div>` : ''}
            </div>
            ${name ? `<h3 class="bento-title">${name}</h3>` : ''}
            ${description ? `<p class="bento-desc">${description}</p>` : ''}
          </div>
        `
            : ''
        }

        <div class="bento-card-content">
          ${content}
        </div>

        ${ctaHtml}
      </div>
    </div>
  `.trim();
}
