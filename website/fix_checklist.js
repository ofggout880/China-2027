import fs from 'fs';

const dict = {
  "Dossier Readiness Tracker": "Suivi du Dossier d'Admission",
  "8 Verified Official Admission & CSC Scholarship Documents (Intake Sept 2027)": "8 Documents Officiels Vérifiés pour l'Admission (Rentrée Sept 2027)",
  "All Documents Ready": "Tous les Documents Sont Prêts",
  " Remaining": " Restants",
  "All (8)": "Tout (8)",
  "Reset Defaults": "Réinitialiser"
};

let i18n = fs.readFileSync('src/i18n.js', 'utf-8');
const dictStr = JSON.stringify(dict, null, 2).slice(1, -1);
i18n = i18n.replace('export const dictionary = {', 'export const dictionary = {' + dictStr + ',');
fs.writeFileSync('src/i18n.js', i18n);

let content = fs.readFileSync('src/components/documentChecklist.js', 'utf-8');

// Replace static strings with t()
content = content.replace(/Dossier Readiness Tracker/g, '${t(\'Dossier Readiness Tracker\')}');
content = content.replace(/8 Verified Official Admission & CSC Scholarship Documents \(Intake Sept 2027\)/g, '${t(\'8 Verified Official Admission & CSC Scholarship Documents (Intake Sept 2027)\')}');
content = content.replace(/All Documents Ready/g, '${t(\'All Documents Ready\')}');
content = content.replace(/ \$\{8 - completed\} Remaining/g, '${8 - completed}${t(\' Remaining\')}');
content = content.replace(/\$\{summary\.total - summary\.completed\} Remaining/g, '${summary.total - summary.completed}${t(\' Remaining\')}');
content = content.replace(/All \(8\)/g, '${t(\'All (8)\')}');
content = content.replace(/Reset Defaults/g, '${t(\'Reset Defaults\')}');
content = content.replace(/statusBadge\.textContent = isChecked \? 'Ready' : 'Pending';/g, 'statusBadge.textContent = isChecked ? t(\'Ready\') : t(\'Pending\');');

// Also inject import t from i18n
if (!content.includes('import { t }')) {
  content = content.replace('import { checklistData as DEFAULT_ITEMS } from \'../data/checklistData.js\';', 'import { checklistData as DEFAULT_ITEMS } from \'../data/checklistData.js\';\nimport { t } from \'../i18n.js\';');
}

fs.writeFileSync('src/components/documentChecklist.js', content);
