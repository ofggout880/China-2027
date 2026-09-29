import fs from 'fs';

const dict = {
  "Category:": "Catégorie :",
  "Tier:": "Catégorie :",
  "City:": "Ville :",
  "All Categories": "Toutes catégories",
  "All Leagues": "Toutes ligues",
  "Languages & Culture": "Langues & Culture",
  "Engineering & Tech": "Ingénierie & Tech",
  "Project 985": "Projet 985",
  "C9 League (Top 9)": "Ligue C9 (Top 9)"
};

let i18n = fs.readFileSync('src/i18n.js', 'utf-8');
const dictStr = JSON.stringify(dict, null, 2).slice(1, -1);
i18n = i18n.replace('export const dictionary = {', 'export const dictionary = {' + dictStr + ',');
fs.writeFileSync('src/i18n.js', i18n);
