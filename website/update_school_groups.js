import fs from 'fs';

let content = fs.readFileSync('src/components/schoolFinder.js', 'utf-8');

// 1. Add renderSchoolGrid(universities)
const renderSchoolGrid = `
export function renderSchoolGrid(universitiesToRender) {
  const groups = {};
  universitiesToRender.forEach(u => {
    const cat = u.teachingCategory || 'Autre';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(u);
  });
  
  // Sort categories by predefined order
  const order = ['Engineering & Technology', 'Comprehensive & Humanities', 'Languages & Cultural Studies', 'Autre'];
  const sortedCategories = Object.keys(groups).sort((a, b) => {
    let indexA = order.indexOf(a);
    let indexB = order.indexOf(b);
    if (indexA === -1) indexA = 99;
    if (indexB === -1) indexB = 99;
    return indexA - indexB;
  });

  return sortedCategories.map(cat => \`
    <div class="school-category-section" data-category="\${cat}">
      <h3 class="school-category-header">\${t(cat)}</h3>
      <div class="school-category-grid" role="list">
        \${groups[cat].map(u => renderUniversityCard(u)).join('\\n')}
      </div>
    </div>
  \`).join('\\n');
}
`;

content = content.replace('export function renderSchoolFinder', renderSchoolGrid + '\nexport function renderSchoolFinder');

// 2. Modify renderSchoolFinder to use renderSchoolGrid
content = content.replace(/const cardsHtml = sortedUnis\.map\(\(u\) => renderUniversityCard\(u\)\)\.join\('\\n'\);/, 'const cardsHtml = renderSchoolGrid(sortedUnis);');

// 3. Modify mountSchoolFinder gridEl update
content = content.replace(/gridEl\.innerHTML = sortedUnis\.map\(\(u\) => renderUniversityCard\(u\)\)\.join\('\\n'\);/, 'gridEl.innerHTML = renderSchoolGrid(sortedUnis);');

// 4. Modify applyFiltering to hide empty categories
const filterLogic = `
    let visibleCount = 0;
    cards.forEach((card) => {
      const id = card.getAttribute('data-university');
      if (matchingIds.has(id)) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Hide empty category sections
    container.querySelectorAll('.school-category-section').forEach(section => {
       const hasVisibleCards = Array.from(section.querySelectorAll('.school-card')).some(c => c.style.display !== 'none');
       section.style.display = hasVisibleCards ? 'block' : 'none';
    });
`;

content = content.replace(/let visibleCount = 0;\s+cards\.forEach\(\(card\) => \{[\s\S]*?\}\);\n/, filterLogic + '\n');

fs.writeFileSync('src/components/schoolFinder.js', content);
