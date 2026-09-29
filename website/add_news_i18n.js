import fs from 'fs';

const dict = {
  "Weekly China Intelligence & News": "Actualités & Veille Hebdomadaire sur la Chine",
  "Curated economic insights, university developments, visa policies, and international student updates for 2027.": "Veille économique ciblée, politiques de bourses et visas, évolutions universitaires et opportunités pour les étudiants internationaux.",
  "Higher Education": "Enseignement Supérieur",
  "Economy & Tech": "Économie & Technologie",
  "Student Life & Visa": "Vie Étudiante & Visas",
  "University Rankings": "Classements Universitaires",
  "Scholarships & Visas": "Bourses & Visas",
  "Economy & Research": "Économie & Recherche",
  "Visa & Immigration": "Visa & Immigration",
  "Rankings & C9": "Classements & Ligue C9",
  "3 min read": "3 min de lecture",
  "4 min read": "4 min de lecture",
  "2 min read": "2 min de lecture",
  "China Expands Silk Road & Belt and Road Scholarships for 2027 International Intakes": "La Chine étend les bourses de la Route de la Soie pour la rentrée internationale 2027",
  "The Ministry of Education announced an expanded allocation of CSC full scholarships focusing on STEM, Artificial Intelligence, and Renewable Energy for incoming degree students in 2027.": "Le Ministère de l'Éducation a annoncé une augmentation des bourses complètes du CSC axées sur les STIM, l'intelligence artificielle et les énergies renouvelables pour les étudiants de la rentrée 2027.",
  "China Outlines 15th Five-Year Higher Education & Quantum Tech Strategic Roadmap": "La Chine dévoile sa feuille de route stratégique pour l'enseignement supérieur et le quantique (15e Plan Quinquennal)",
  "National scientific research funding in C9 League universities is set to rise by 12% annually, prioritizing joint international laboratories and foreign researcher partnerships.": "Le financement de la recherche scientifique nationale dans les universités de la Ligue C9 va augmenter de 12% par an, renforçant les laboratoires conjoints internationaux.",
  "Streamlined X1 Student Visa Application & Digital JW202 Procedures Announced for 2027": "Simplification des procédures de visa étudiant X1 et déploiement du formulaire JW202 100% numérique pour 2027",
  "Consulates will deploy an accelerated digital pre-clearance portal for admitted international master and doctoral degree candidates starting in early 2027.": "Les consulats déploieront un portail numérique accéléré pour les candidats admis en master et doctorat dès le début de l'année 2027.",
  "Top Chinese Universities Strengthen Positions in Global QS & THE Subject Rankings": "Les meilleures universités chinoises renforcent leurs positions dans les classements mondiaux QS & THE",
  "Tsinghua and Peking University continue their ascent in global computer science and engineering rankings, accompanied by significant expansions in bilingual graduate curricula.": "Les universités Tsinghua et Pékin poursuivent leur ascension dans les classements mondiaux en informatique et ingénierie, avec un élargissement des cursus bilingues.",
  "Read Article": "Lire l'article",
  "Weekly Update Schedule": "Mise à jour chaque lundi"
};

let i18n = fs.readFileSync('src/i18n.js', 'utf-8');
const dictStr = JSON.stringify(dict, null, 2).slice(1, -1);
i18n = i18n.replace('export const dictionary = {', 'export const dictionary = {' + dictStr + ',');
fs.writeFileSync('src/i18n.js', i18n);
