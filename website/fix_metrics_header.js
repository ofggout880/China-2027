import fs from 'fs';

let content = fs.readFileSync('src/components/chinaMetrics.js', 'utf-8');

// Replace the complicated replace logic with a direct HTML structure
content = content.replace(/\$\{t\('Modern China Macro Metrics'\)\.replace\('Macro', '<span class="text-red">Macro'\)\.replace\('Metrics', 'Metrics<\/span>'\)\}/g, 
  '${store && store.getState().language === "fr" ? "Indicateurs Macro de la <span class=\\"text-red\\">Chine Moderne</span>" : "Modern China <span class=\\"text-red\\">Macro Metrics</span>"}');

if (!content.includes('import { store }')) {
  content = "import { store } from '../store.js';\n" + content;
}

fs.writeFileSync('src/components/chinaMetrics.js', content);
