import fs from 'fs';

const dict = {
  "Target Intake": "Objectif Rentrée",
  "September 1, 2027 (00:00 UTC)": "1er Septembre 2027 (00:00 UTC)",
  "Fall 2027 Admission Countdown": "Compte à rebours Admission Automne 2027",
  "Tracking remaining time until Chinese university admissions and CSC scholarship intake commence.": "Suivi du temps restant avant l'ouverture des admissions universitaires chinoises et des bourses CSC.",
  "Days": "Jours",
  "Hours": "Heures",
  "Minutes": "Minutes",
  "Seconds": "Secondes",
  "Preparation Journey: Sept 2026 – Sept 2027": "Parcours de Préparation : Sept 2026 – Sept 2027",
  " Elapsed": " Écoulé",
  "Sept 2026 (Kickoff)": "Sept 2026 (Lancement)",
  "Mar 2027 (CSC Deadline)": "Mars 2027 (Date limite CSC)",
  "Jun 2027 (Direct Apply)": "Juin 2027 (Candidature directe)",
  "Sept 2027 (Intake)": "Sept 2027 (Rentrée)",
  "CSC Scholarship Window:": "Fenêtre Bourses CSC :",
  "Jan 1 – Mar 31, 2027": "1er Jan – 31 Mars 2027",
  "University Portal Closes:": "Fermeture Portails Univ :",
  "Jun 15, 2027": "15 Juin 2027",
  "JW202 Visa / Registration:": "Visa JW202 / Inscription :",
  "Jul – Aug 2027": "Juil – Août 2027",
  "Applications Open / 2027 Intake Commenced!": "Candidatures Ouvertes / Rentrée 2027 Lancée !",
  "The September 2027 intake window is now officially open. Submit direct admissions dossiers.": "La fenêtre de la rentrée de septembre 2027 est désormais officiellement ouverte. Soumettez vos dossiers d'admission directe."
};

let i18n = fs.readFileSync('src/i18n.js', 'utf-8');
const dictStr = JSON.stringify(dict, null, 2).slice(1, -1);
i18n = i18n.replace('export const dictionary = {', 'export const dictionary = {' + dictStr + ',');
fs.writeFileSync('src/i18n.js', i18n);

let content = fs.readFileSync('src/components/countdownTimer.js', 'utf-8');
for (let key in dict) {
   if (key === 'Days' || key === 'Hours' || key === 'Minutes' || key === 'Seconds') {
      content = content.replace(new RegExp(`<span class="unit-label">${key}<\/span>`, 'g'), `<span class="unit-label">\${t('${key}')}</span>`);
   } else if (key === ' Elapsed') {
      content = content.replace(/% Elapsed/g, '%\${t(\' Elapsed\')}');
   } else {
      content = content.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `\${t('${key.replace(/'/g, "\\'")}')}`);
   }
}

if (!content.includes('import { t }')) {
  content = "import { t } from '../i18n.js';\n" + content;
}

fs.writeFileSync('src/components/countdownTimer.js', content);
