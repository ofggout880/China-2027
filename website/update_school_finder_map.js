import fs from 'fs';

let content = fs.readFileSync('src/components/schoolFinder.js', 'utf-8');

// 1. Add import for schoolMap
if (!content.includes('schoolMap.js')) {
  content = `import { renderSchoolMapMarkup, mountSchoolMap } from './schoolMap.js';\n` + content;
}

// 2. Add locate button to renderUniversityCard footer
const oldFooter = `<div class="school-card-footer">
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
      </div>`;

const newFooter = `<div class="school-card-footer" style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
        <button type="button" class="school-locate-btn" data-locate-id="\${u.id}" aria-label="Locate \${u.name} on map">
          <span>📍 \${t('View on Map')}</span>
        </button>
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
      </div>`;

content = content.replace(oldFooter, newFooter);

// 3. Wrap Search Controls & Map in .school-dual-layout in renderSchoolFinder
const searchCardRegex = /<!-- Search & Multi-Filter Controls Bar -->[\s\S]*?<\/div>\s*<\/div>/;
const searchMatch = content.match(searchCardRegex);

if (searchMatch) {
  const searchControlsHTML = searchMatch[0];
  const dualLayoutHTML = `
      <!-- Dual Grid Layout: Left = Interactive Map, Right = Search & Filters -->
      <div class="school-dual-layout">
        <!-- Left: Interactive University Map -->
        <div id="school-map-wrapper">
          \${renderSchoolMapMarkup()}
        </div>

        <!-- Right: Search & Filters -->
        ${searchControlsHTML}
      </div>
  `;
  content = content.replace(searchControlsHTML, dualLayoutHTML);
}

// 4. In mountSchoolFinder, mount map and handle locate click
const mountMapLogic = `
  // Mount interactive map
  let mapController = null;
  const mapCard = container.querySelector('#school-map-card');
  if (mapCard) {
    try {
      mapController = mountSchoolMap(mapCard, universities);
    } catch (e) {
      console.warn('[schoolFinder] Failed to mount school map:', e);
    }
  }
`;

content = content.replace('container.innerHTML = renderSchoolFinder(universities);', 'container.innerHTML = renderSchoolFinder(universities);\n' + mountMapLogic);

const locateHandler = `
    const locateBtn = e.target.closest('.school-locate-btn');
    if (locateBtn && mapController) {
      const uId = locateBtn.getAttribute('data-locate-id');
      mapController.focusSchool(uId);
      const mapCardEl = container.querySelector('#school-map-card');
      if (mapCardEl && typeof window !== 'undefined' && window.innerWidth < 960) {
        mapCardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
`;

content = content.replace('const favBtn = e.target.closest(\'.favorite-btn\');', locateHandler + '\n    const favBtn = e.target.closest(\'.favorite-btn\');');

fs.writeFileSync('src/components/schoolFinder.js', content);
