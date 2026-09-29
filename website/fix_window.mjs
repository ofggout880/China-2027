import fs from 'fs';

let content = fs.readFileSync('src/main.js', 'utf-8');
content = content.replace(/window\.addEventListener\('languagechange', \(\) => \{/g, "if (typeof window !== 'undefined') {\nwindow.addEventListener('languagechange', () => {");
content = content.replace(/\s+mountDocumentChecklist\(document\.getElementById\('document-checklist-container'\)\);\n\}\);/g, "  mountDocumentChecklist(document.getElementById('document-checklist-container'));\n});\n}");

fs.writeFileSync('src/main.js', content);

let i18n = fs.readFileSync('src/i18n.js', 'utf-8');
i18n = i18n.replace(/window\.dispatchEvent\(new Event\('languagechange'\)\);/g, "if (typeof window !== 'undefined') { window.dispatchEvent(new Event('languagechange')); }");
fs.writeFileSync('src/i18n.js', i18n);

