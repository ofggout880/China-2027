import fs from 'fs';

const dict = {
  "Profile:": "Profil :",
  "Active Profile": "Espace Candidat",
  "Candidate Workspace:": "Espace Candidat :",
  "Switch to Agathe": "Basculer vers Agathe",
  "Switch to Matthieu": "Basculer vers Matthieu",
  "Matthieu's Favorites": "Favoris de Matthieu",
  "Agathe's Favorites": "Favoris d'Agathe",
  "Matthieu's Checklist": "Dossier de Matthieu",
  "Agathe's Checklist": "Dossier d'Agathe",
  "Matthieu's Language Pathway": "Parcours Linguistique de Matthieu",
  "Agathe's Language Pathway": "Parcours Linguistique d'Agathe",
  "Target Track:": "Filière cible :",
  "Target Level:": "Objectif HSK :",
  "Engineering & AI (STEM)": "Ingénierie & IA (STIM)",
  "Management & Languages": "Management & Langues",
  "Personalized Workspace": "Espace Personnalisé",
  "Matthieu": "Matthieu",
  "Agathe": "Agathe"
};

let i18n = fs.readFileSync('src/i18n.js', 'utf-8');
const dictStr = JSON.stringify(dict, null, 2).slice(1, -1);
i18n = i18n.replace('export const dictionary = {', 'export const dictionary = {' + dictStr + ',');
fs.writeFileSync('src/i18n.js', i18n);
