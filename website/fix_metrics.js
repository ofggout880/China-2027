import fs from 'fs';

const dict = {
  "National Benchmark": "Référence Nationale",
  "Macro Insight": "Aperçu Macro",
  "Official Data": "Données Officielles",
  "National Development Indicators": "Indicateurs de Développement National",
  "Modern China Macro Metrics": "Indicateurs Macro de la Chine Moderne",
  "Key macroeconomic indicators, technological leadership, and higher education investments shaping your 2027 international study environment.": "Principaux indicateurs macroéconomiques, leadership technologique et investissements dans l'enseignement supérieur qui façonnent votre environnement d'études international pour 2027."
};

let i18n = fs.readFileSync('src/i18n.js', 'utf-8');
const dictStr = JSON.stringify(dict, null, 2).slice(1, -1);
i18n = i18n.replace('export const dictionary = {', 'export const dictionary = {' + dictStr + ',');
fs.writeFileSync('src/i18n.js', i18n);

let content = fs.readFileSync('src/components/chinaMetrics.js', 'utf-8');

content = content.replace(/'National Benchmark'/g, 't(\'National Benchmark\')');
content = content.replace(/'Macro Insight'/g, 't(\'Macro Insight\')');
content = content.replace(/<span>Official Data<\/span>/g, '<span>${t(\'Official Data\')}</span>');
content = content.replace(/<span>National Development Indicators<\/span>/g, '<span>${t(\'National Development Indicators\')}</span>');
content = content.replace(/Modern China <span class="text-red">Macro Metrics<\/span>/g, '${t(\'Modern China Macro Metrics\').replace(\'Macro\', \'<span class="text-red">Macro\').replace(\'Metrics\', \'Metrics</span>\')}');
content = content.replace(/Key macroeconomic indicators, technological leadership, and higher education investments shaping your 2027 international study environment./g, '${t(\'Key macroeconomic indicators, technological leadership, and higher education investments shaping your 2027 international study environment.\')}');

if (!content.includes('import { t }')) {
  content = "import { t } from '../i18n.js';\n" + content;
}

fs.writeFileSync('src/components/chinaMetrics.js', content);
