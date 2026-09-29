import fs from 'fs';

const dict = {
  "Target Mastery": "Objectif de Maîtrise",
  "Admissions Benchmark": "Référence d'Admission",
  "Target Date:": "Date Cible :",
  "Total Vocab:": "Vocabulaire Total :",
  "Core Characters:": "Caractères de Base :",
  "Recommended Materials": "Matériel Recommandé",
  "Core Vocabulary Focus": "Focus sur le Vocabulaire",
  "All Levels": "Tous les Niveaux",
  "Completed": "Terminé",
  "In Progress": "En cours",
  "Upcoming": "À venir",
  "Current Status:": "Statut actuel :"
};

let i18n = fs.readFileSync('src/i18n.js', 'utf-8');
const dictStr = JSON.stringify(dict, null, 2).slice(1, -1);
i18n = i18n.replace('export const dictionary = {', 'export const dictionary = {' + dictStr + ',');
fs.writeFileSync('src/i18n.js', i18n);

let content = fs.readFileSync('src/components/languageTimeline.js', 'utf-8');

// Replace static strings with t()
content = content.replace(/Target Mastery/g, '${t(\'Target Mastery\')}');
content = content.replace(/Admissions Benchmark/g, '${t(\'Admissions Benchmark\')}');
content = content.replace(/Target Date:/g, '${t(\'Target Date:\')}');
content = content.replace(/Total Vocab:/g, '${t(\'Total Vocab:\')}');
content = content.replace(/Core Characters:/g, '${t(\'Core Characters:\')}');
content = content.replace(/Recommended Materials/g, '${t(\'Recommended Materials\')}');
content = content.replace(/Core Vocabulary Focus/g, '${t(\'Core Vocabulary Focus\')}');
content = content.replace(/label: 'All Levels'/g, 'label: t(\'All Levels\')');
content = content.replace(/label: 'Completed'/g, 'label: t(\'Completed\')');
content = content.replace(/label: 'In Progress'/g, 'label: t(\'In Progress\')');
content = content.replace(/label: 'Upcoming'/g, 'label: t(\'Upcoming\')');

// Add import t
if (!content.includes('import { t }')) {
  content = content.replace('import { store } from \'../store.js\';', 'import { store } from \'../store.js\';\nimport { t } from \'../i18n.js\';');
}

fs.writeFileSync('src/components/languageTimeline.js', content);
