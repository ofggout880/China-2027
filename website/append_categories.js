import fs from 'fs';

const dict = {
  "Engineering & Technology": "Ingénierie & Technologie",
  "Comprehensive & Humanities": "Généraliste & Sciences Humaines",
  "Languages & Cultural Studies": "Langues & Études Culturelles"
};

let i18n = fs.readFileSync('src/i18n.js', 'utf-8');
const dictStr = JSON.stringify(dict, null, 2).slice(1, -1);
i18n = i18n.replace('export const dictionary = {', 'export const dictionary = {' + dictStr + ',');
fs.writeFileSync('src/i18n.js', i18n);
