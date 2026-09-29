import fs from 'fs';

const dict = {
  "Interactive University Map": "Carte Interactive des Universités",
  "Overview": "Vue globale",
  "View on Map": "Localiser sur la carte",
  "Interactive map active. Add Google Maps API key for satellite zoom.": "Carte vectorielle active. Cliquez sur 🔑 API Key pour activer Google Maps."
};

let i18n = fs.readFileSync('src/i18n.js', 'utf-8');
const dictStr = JSON.stringify(dict, null, 2).slice(1, -1);
i18n = i18n.replace('export const dictionary = {', 'export const dictionary = {' + dictStr + ',');
fs.writeFileSync('src/i18n.js', i18n);
