import fs from 'fs';

const statsDict = {
  // Stats titles
  "Gross Domestic Product (GDP)": "Produit Intérieur Brut (PIB)",
  "R&D Expenditure": "Dépenses en R&D",
  "WIPO International Patents": "Brevets Internationaux (OMPI)",
  "High-Speed Rail Network": "Réseau TGV",
  "International Student Population": "Étudiants Internationaux",
  "Global Top-Tier Universities": "Universités Mondiales de Premier Rang",
  
  // Stats descriptions
  "World's second-largest economy driving unprecedented research investment, high-tech employment, and international scholarship budgets.": "Deuxième économie mondiale propulsant des investissements inédits en recherche et des budgets de bourses internationales.",
  "Surpassing 3.3 trillion RMB ($450B+) in annual research expenditure, powering world-class university laboratories in AI, quantum computing, and green energy.": "Plus de 3.3 trillions de RMB de dépenses de recherche, alimentant des laboratoires d'IA et d'énergie verte de classe mondiale.",
  "Ranked #1 globally in Patent Cooperation Treaty (PCT) applications for 5 consecutive years, creating thriving commercialization ecosystems around top campuses.": "Classé n°1 mondial en brevets PCT depuis 5 ans, créant des écosystèmes florissants de commercialisation autour des grands campus.",
  "Over 70% of the entire world's high-speed rail network, seamlessly connecting student life across Beijing, Shanghai, Hangzhou, and the Greater Bay Area in hours.": "Plus de 70 % du réseau mondial de TGV, connectant facilement la vie étudiante entre Pékin, Shanghai et Hangzhou.",
  "The primary study-abroad destination in Asia with over 492k international students from 196 countries, backed by generous CSC and university scholarships.": "La principale destination d'études en Asie avec plus de 492 000 étudiants internationaux issus de 196 pays.",
  "Tsinghua University (QS #14) and Peking University (QS #12) lead China's Double First-Class university initiative, with 5 institutions in the global top 50.": "L'Université Tsinghua (QS #14) et l'Université de Pékin (QS #12) dirigent l'initiative Double Première Classe de la Chine.",
  
  // Chart strings
  "International Student Enrollment Trajectory (2018–2027 Projected)": "Évolution des inscriptions d'étudiants internationaux (Projeté 2018–2027)",
  "Academic Year": "Année Académique",
  "Students (in Thousands)": "Étudiants (en milliers)",
  "Degree Seeking (Bachelor/Master/PhD)": "Chercheurs de diplômes (Licence/Master/Doctorat)",
  "Language & Non-Degree Exchange": "Échanges Linguistiques et Non Diplômants",
  "International Students by Academic Discipline": "Étudiants Internationaux par Discipline",
  "Top Fields": "Principaux Domaines",
  "STEM & Artificial Intelligence": "STEM et Intelligence Artificielle",
  "Chinese Language & Culture": "Langue et Culture Chinoises",
  "Economics & Global Trade": "Économie et Commerce Mondial",
  "Clinical Medicine & Health": "Médecine Clinique et Santé",
  
  // Stats badges
  "World #2 Economy": "2ème Économie Mondiale",
  "Innovation Powerhouse": "Puissance de l'Innovation",
  "PCT Global Leader": "Leader Mondial PCT",
  "350 km/h Operational": "Opérationnel à 350 km/h",
  "Top Asian Destination": "Top Destination en Asie",
  "C9 League Elite": "Élite de la Ligue C9",

  // Wait, these strings from the Countdown component
  "Months": "Mois",
  "Days": "Jours",
  "Hours": "Heures",
  "Minutes": "Minutes",
  "Seconds": "Secondes",
  
  // HSK
  "March 2027": "Mars 2027",
  "May 2027": "Mai 2027",
  "July 2027": "Juillet 2027",
  "September 2027": "Septembre 2027",
  
  // Other small strings from school finder missing
  "No universities match your criteria.": "Aucune université ne correspond à vos critères."
};

let i18n = fs.readFileSync('src/i18n.js', 'utf-8');
const dictStr = JSON.stringify(statsDict, null, 2).slice(1, -1);
i18n = i18n.replace('export const dictionary = {', 'export const dictionary = {' + dictStr + ',');
fs.writeFileSync('src/i18n.js', i18n);
