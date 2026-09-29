import fs from 'fs';

let content = fs.readFileSync('src/components/schoolFinder.js', 'utf-8');

content = content.replace(/<div class="section-label-text">Key Academic Disciplines<\/div>/g, '<div class="section-label-text">${t(\'Key Academic Disciplines\')}</div>');
content = content.replace(/<span class="detail-label">Chinese Track:<\/span>/g, '<span class="detail-label">${t(\'Chinese Track:\')}</span>');
content = content.replace(/<span class="detail-label">English Track:<\/span>/g, '<span class="detail-label">${t(\'English Track:\')}</span>');
content = content.replace(/<span class="detail-label">Tuition Estimate:<\/span>/g, '<span class="detail-label">${t(\'Tuition Estimate:\')}</span>');
content = content.replace(/<span class="scholarship-label">Available Aid:<\/span>/g, '<span class="scholarship-label">${t(\'Available Aid:\')}</span>');

content = content.replace(/<span>Higher Education Directory<\/span>/g, '<span>${t(\'Higher Education Directory\')}</span>');
content = content.replace(/Premier Chinese <span class="text-red">Universities<\/span>/g, '${t(\'Premier Chinese Universities\')}');
content = content.replace(/Explore and compare China's elite C9 League and Double First-Class institutions, tuition ranges, HSK admission thresholds, and CSC scholarship availability for 2027 intake./g, '${t(\'Explore and compare China elite institutions\')}');

content = content.replace(/placeholder="Search universities..."/g, 'placeholder="${t(\'Search universities...\')}"');
content = content.replace(/aria-label="Clear filters"/g, 'aria-label="${t(\'Clear filters\')}"');

content = content.replace(/<h3 class="filters-title">Filter Directory<\/h3>/g, '<h3 class="filters-title">${t(\'Filter Directory\')}</h3>');
content = content.replace(/Clear Filters &amp; Show All/g, '${t(\'Clear Filters & Show All\')}');
content = content.replace(/Clear Filters & Show All/g, '${t(\'Clear Filters & Show All\')}');
content = content.replace(/<p>No universities match your criteria.<\/p>/g, '<p>${t(\'No universities match your criteria.\')}</p>');

fs.writeFileSync('src/components/schoolFinder.js', content);
