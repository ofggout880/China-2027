import fs from 'fs';

let content = fs.readFileSync('src/components/documentChecklist.js', 'utf-8');

content = content.replace(/\'\$\{t\(\'All Documents Ready\'\)\}\'/g, "t('All Documents Ready')");

fs.writeFileSync('src/components/documentChecklist.js', content);
