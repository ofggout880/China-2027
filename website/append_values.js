import fs from 'fs';

const valDict = {
  "$18.56 Trillion": "$18.56 Billions",
  "Trillion USD": "Trillion de USD",
  "+5.0% YoY": "+5.0% sur un an",
  "2.64% of GDP": "2.64% du PIB",
  "% of GDP": "% du PIB",
  ">$450B Annual": ">$450 Mds Annuel",
  "70,015 Filings/yr": "70 015 Dépôts/an",
  "Filings / year": "Dépôts / an",
  "#1 Global Ranking": "#1 Rang Mondial",
  "45,000+ km": "45 000+ km",
  "km operational": "km opérationnels",
  ">70% of Global Total": ">70% du Total Mondial",
  "492,000+": "492 000+",
  "Students": "Étudiants",
  "From 196 Nations": "De 196 Nations",
  "2 in World Top 15": "2 dans le Top 15 Mondial",
  "Universities": "Universités",
  "Tsinghua #14 · Peking #12": "Tsinghua #14 · Pékin #12"
};

let i18n = fs.readFileSync('src/i18n.js', 'utf-8');
const dictStr = JSON.stringify(valDict, null, 2).slice(1, -1);
i18n = i18n.replace('export const dictionary = {', 'export const dictionary = {' + dictStr + ',');
fs.writeFileSync('src/i18n.js', i18n);
